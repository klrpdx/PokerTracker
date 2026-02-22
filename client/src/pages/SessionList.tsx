import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Session } from '../types';

type SortKey = 'date' | 'location' | 'game_type' | 'buy_in' | 'cash_out' | 'profit' | 'duration_minutes';

function formatMoney(value: number): string {
    const prefix = value >= 0 ? '+$' : '-$';
    return `${prefix}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMoneyPlain(value: number): string {
    return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SessionList() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        api.getSessions()
            .then(setSessions)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this session? This cannot be undone.')) return;
        try {
            await api.deleteSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir(key === 'date' ? 'desc' : 'desc');
        }
    };

    const sorted = [...sessions].sort((a, b) => {
        let av: number | string;
        let bv: number | string;

        if (sortKey === 'profit') {
            av = a.cash_out - a.buy_in;
            bv = b.cash_out - b.buy_in;
        } else {
            av = a[sortKey];
            bv = b[sortKey];
        }

        if (typeof av === 'string') {
            const cmp = av.localeCompare(bv as string);
            return sortDir === 'asc' ? cmp : -cmp;
        }
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    const sortIndicator = (key: SortKey) => {
        if (sortKey !== key) return '';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container"><div className="spinner" /></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Sessions</h1>
                        <p>{sessions.length} session{sessions.length !== 1 ? 's' : ''} logged</p>
                    </div>
                    <Link to="/sessions/new" className="btn btn-primary">+ Log Session</Link>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {sessions.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No sessions recorded</h3>
                    <p>Start tracking your poker results by logging your first session.</p>
                    <Link to="/sessions/new" className="btn btn-primary">+ Log Session</Link>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th className={sortKey === 'date' ? 'sorted' : ''} onClick={() => handleSort('date')}>
                                    Date{sortIndicator('date')}
                                </th>
                                <th className={sortKey === 'location' ? 'sorted' : ''} onClick={() => handleSort('location')}>
                                    Location{sortIndicator('location')}
                                </th>
                                <th className={sortKey === 'game_type' ? 'sorted' : ''} onClick={() => handleSort('game_type')}>
                                    Game{sortIndicator('game_type')}
                                </th>
                                <th className={sortKey === 'buy_in' ? 'sorted' : ''} onClick={() => handleSort('buy_in')}>
                                    Buy-in{sortIndicator('buy_in')}
                                </th>
                                <th className={sortKey === 'cash_out' ? 'sorted' : ''} onClick={() => handleSort('cash_out')}>
                                    Cash-out{sortIndicator('cash_out')}
                                </th>
                                <th className={sortKey === 'profit' ? 'sorted' : ''} onClick={() => handleSort('profit')}>
                                    Profit{sortIndicator('profit')}
                                </th>
                                <th className={sortKey === 'duration_minutes' ? 'sorted' : ''} onClick={() => handleSort('duration_minutes')}>
                                    Duration{sortIndicator('duration_minutes')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(s => {
                                const profit = s.cash_out - s.buy_in;
                                return (
                                    <tr key={s.id}>
                                        <td>{new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td>{s.location || '—'}</td>
                                        <td>{s.game_type || '—'}</td>
                                        <td>{formatMoneyPlain(s.buy_in)}</td>
                                        <td>{formatMoneyPlain(s.cash_out)}</td>
                                        <td className={`profit-text ${profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : 'profit-zero'}`}>
                                            {formatMoney(profit)}
                                        </td>
                                        <td>{s.duration_minutes ? `${Math.floor(s.duration_minutes / 60)}h ${s.duration_minutes % 60}m` : '—'}</td>
                                        <td>
                                            <div className="actions-cell">
                                                <Link to={`/sessions/${s.id}/edit`} className="btn-icon" title="Edit">✏️</Link>
                                                <button className="btn-icon" title="Delete" onClick={() => handleDelete(s.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
