import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { Session, SessionInput, SessionStats } from '../types';

const router = Router();

// GET /api/sessions — list all sessions
router.get('/sessions', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const sessions = db.prepare(`
      SELECT * FROM sessions ORDER BY date DESC, id DESC
    `).all() as Session[];
        res.json(sessions);
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// GET /api/sessions/:id — get single session
router.get('/sessions/:id', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as Session | undefined;
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (err) {
        console.error('Error fetching session:', err);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// POST /api/sessions — create session
router.post('/sessions', (req: Request, res: Response) => {
    try {
        const input = req.body as SessionInput;

        // Basic validation
        if (!input.date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        if (input.buy_in == null || input.buy_in < 0) {
            return res.status(400).json({ error: 'Buy-in must be >= 0' });
        }
        if (input.cash_out == null || input.cash_out < 0) {
            return res.status(400).json({ error: 'Cash-out must be >= 0' });
        }

        const db = getDb();
        const stmt = db.prepare(`
      INSERT INTO sessions (date, location, game_type, buy_in, cash_out, duration_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(
            input.date,
            input.location || '',
            input.game_type || '',
            input.buy_in,
            input.cash_out,
            input.duration_minutes || 0,
            input.notes || ''
        );

        const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid) as Session;
        res.status(201).json(session);
    } catch (err) {
        console.error('Error creating session:', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// PUT /api/sessions/:id — update session
router.put('/sessions/:id', (req: Request, res: Response) => {
    try {
        const input = req.body as SessionInput;
        const db = getDb();

        const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Session not found' });
        }

        db.prepare(`
      UPDATE sessions
      SET date = ?, location = ?, game_type = ?, buy_in = ?, cash_out = ?, duration_minutes = ?, notes = ?
      WHERE id = ?
    `).run(
            input.date,
            input.location || '',
            input.game_type || '',
            input.buy_in,
            input.cash_out,
            input.duration_minutes || 0,
            input.notes || '',
            req.params.id
        );

        const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id) as Session;
        res.json(session);
    } catch (err) {
        console.error('Error updating session:', err);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// DELETE /api/sessions/:id — delete session
router.delete('/sessions/:id', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Session not found' });
        }

        db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
        res.json({ message: 'Session deleted' });
    } catch (err) {
        console.error('Error deleting session:', err);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// GET /api/stats — aggregated statistics
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const sessions = db.prepare('SELECT * FROM sessions ORDER BY date ASC').all() as Session[];

        if (sessions.length === 0) {
            const emptyStats: SessionStats = {
                total_sessions: 0,
                total_profit: 0,
                winning_sessions: 0,
                losing_sessions: 0,
                win_rate: 0,
                avg_profit: 0,
                avg_hourly_rate: 0,
                total_hours: 0,
                best_session: 0,
                worst_session: 0,
                by_location: [],
                by_game_type: [],
            };
            return res.json(emptyStats);
        }

        const profits = sessions.map(s => s.cash_out - s.buy_in);
        const totalProfit = profits.reduce((a, b) => a + b, 0);
        const winningSessions = profits.filter(p => p > 0).length;
        const losingSessions = profits.filter(p => p < 0).length;
        const totalMinutes = sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0);
        const totalHours = totalMinutes / 60;

        // By location
        const locationMap = new Map<string, { sessions: number; profit: number }>();
        sessions.forEach((s, i) => {
            const loc = s.location || 'Unknown';
            const existing = locationMap.get(loc) || { sessions: 0, profit: 0 };
            existing.sessions++;
            existing.profit += profits[i];
            locationMap.set(loc, existing);
        });

        // By game type
        const gameTypeMap = new Map<string, { sessions: number; profit: number }>();
        sessions.forEach((s, i) => {
            const gt = s.game_type || 'Unknown';
            const existing = gameTypeMap.get(gt) || { sessions: 0, profit: 0 };
            existing.sessions++;
            existing.profit += profits[i];
            gameTypeMap.set(gt, existing);
        });

        const stats: SessionStats = {
            total_sessions: sessions.length,
            total_profit: Math.round(totalProfit * 100) / 100,
            winning_sessions: winningSessions,
            losing_sessions: losingSessions,
            win_rate: Math.round((winningSessions / sessions.length) * 100 * 10) / 10,
            avg_profit: Math.round((totalProfit / sessions.length) * 100) / 100,
            avg_hourly_rate: totalHours > 0 ? Math.round((totalProfit / totalHours) * 100) / 100 : 0,
            total_hours: Math.round(totalHours * 10) / 10,
            best_session: Math.max(...profits),
            worst_session: Math.min(...profits),
            by_location: Array.from(locationMap.entries()).map(([location, data]) => ({
                location,
                sessions: data.sessions,
                profit: Math.round(data.profit * 100) / 100,
            })),
            by_game_type: Array.from(gameTypeMap.entries()).map(([game_type, data]) => ({
                game_type,
                sessions: data.sessions,
                profit: Math.round(data.profit * 100) / 100,
            })),
        };

        res.json(stats);
    } catch (err) {
        console.error('Error computing stats:', err);
        res.status(500).json({ error: 'Failed to compute stats' });
    }
});

export default router;
