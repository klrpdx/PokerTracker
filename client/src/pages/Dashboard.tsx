import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { api } from '../services/api';
import { Session, SessionStats } from '../types';

function formatMoney(value: number): string {
    const prefix = value >= 0 ? '+$' : '-$';
    return `${prefix}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMoneyPlain(value: number): string {
    return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
    const [stats, setStats] = useState<SessionStats | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([api.getStats(), api.getSessions()])
            .then(([s, sess]) => {
                setStats(s);
                setSessions(sess);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container"><div className="spinner" /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="error-banner">{error}</div>
            </div>
        );
    }

    if (!stats || stats.total_sessions === 0) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Dashboard</h1>
                </div>
                <div className="card empty-state">
                    <div className="empty-icon">🃏</div>
                    <h3>No sessions yet</h3>
                    <p>Log your first poker session to start tracking your results.</p>
                    <Link to="/sessions/new" className="btn btn-primary">+ Log Session</Link>
                </div>
            </div>
        );
    }

    // Build profit-over-time data (cumulative)
    const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    const profitOverTime = sortedSessions.map(s => {
        cumulative += s.cash_out - s.buy_in;
        return {
            date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            profit: Math.round(cumulative),
        };
    });

    // By location data for bar chart
    const locationData = stats.by_location
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 8);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Your poker performance at a glance</p>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Profit</div>
                    <div className={`stat-value ${stats.total_profit >= 0 ? 'profit' : 'loss'}`}>
                        {formatMoney(stats.total_profit)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Sessions Played</div>
                    <div className="stat-value">{stats.total_sessions}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Win Rate</div>
                    <div className="stat-value">{stats.win_rate}%</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg Hourly Rate</div>
                    <div className={`stat-value ${stats.avg_hourly_rate >= 0 ? 'profit' : 'loss'}`}>
                        {formatMoney(stats.avg_hourly_rate)}/hr
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Hours</div>
                    <div className="stat-value">{stats.total_hours}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Best Session</div>
                    <div className="stat-value profit">{formatMoney(stats.best_session)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Worst Session</div>
                    <div className="stat-value loss">{formatMoney(stats.worst_session)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg Profit/Session</div>
                    <div className={`stat-value ${stats.avg_profit >= 0 ? 'profit' : 'loss'}`}>
                        {formatMoney(stats.avg_profit)}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Cumulative Profit Over Time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={profitOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                            <XAxis
                                dataKey="date"
                                stroke="#6e7681"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                stroke="#6e7681"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1c2333',
                                    border: '1px solid #30363d',
                                    borderRadius: '8px',
                                    color: '#e6edf3',
                                }}
                                formatter={(value: number) => [formatMoney(value), 'Profit']}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                stroke="#2ea97a"
                                strokeWidth={2.5}
                                dot={{ fill: '#2ea97a', r: 3 }}
                                activeDot={{ r: 5, stroke: '#3cc68e', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Profit by Location</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={locationData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                            <XAxis
                                type="number"
                                stroke="#6e7681"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(v) => `$${v}`}
                            />
                            <YAxis
                                type="category"
                                dataKey="location"
                                stroke="#6e7681"
                                tick={{ fontSize: 12 }}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1c2333',
                                    border: '1px solid #30363d',
                                    borderRadius: '8px',
                                    color: '#e6edf3',
                                }}
                                formatter={(value: number) => [formatMoney(value), 'Profit']}
                            />
                            <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                                {locationData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.profit >= 0 ? '#3fb950' : '#f85149'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Sessions */}
            <div className="chart-card">
                <h3>Recent Sessions</h3>
                {sessions.length > 0 && (
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Location</th>
                                    <th>Game</th>
                                    <th>Buy-in</th>
                                    <th>Cash-out</th>
                                    <th>Profit</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.slice(0, 5).map(s => {
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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {sessions.length > 5 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                        <Link to="/sessions" className="btn btn-secondary btn-sm">View All Sessions →</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
