import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// GET /api/locations — list all locations
router.get('/locations', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const locations = db.prepare('SELECT * FROM locations ORDER BY name ASC').all();
        res.json(locations);
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// POST /api/locations — create a new location
router.post('/locations', (req: Request, res: Response) => {
    try {
        const { name } = req.body as { name: string };

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Location name is required' });
        }

        const db = getDb();
        const trimmed = name.trim();

        // Check for duplicate
        const existing = db.prepare('SELECT * FROM locations WHERE name = ?').get(trimmed);
        if (existing) {
            return res.status(409).json({ error: 'Location already exists' });
        }

        const result = db.prepare('INSERT INTO locations (name) VALUES (?)').run(trimmed);
        const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(location);
    } catch (err) {
        console.error('Error creating location:', err);
        res.status(500).json({ error: 'Failed to create location' });
    }
});

export default router;
