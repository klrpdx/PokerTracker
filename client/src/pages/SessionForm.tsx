import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { SessionInput, Location } from '../types';
import AddLocationModal from '../components/AddLocationModal';

export default function SessionForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState<SessionInput>({
        date: new Date().toISOString().split('T')[0],
        location: '',
        game_type: '',
        buy_in: 0,
        cash_out: 0,
        duration_minutes: 0,
        notes: '',
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [error, setError] = useState('');

    // Location dropdown state
    const [locations, setLocations] = useState<Location[]>([]);
    const [showAddLocation, setShowAddLocation] = useState(false);

    // Duration helper state (hours + minutes)
    const [durHours, setDurHours] = useState(0);
    const [durMins, setDurMins] = useState(0);

    // Fetch locations on mount
    useEffect(() => {
        api.getLocations()
            .then(setLocations)
            .catch(e => console.error('Failed to load locations:', e));
    }, []);

    useEffect(() => {
        if (isEditing && id) {
            api.getSession(Number(id))
                .then(s => {
                    setForm({
                        date: s.date,
                        location: s.location,
                        game_type: s.game_type,
                        buy_in: s.buy_in,
                        cash_out: s.cash_out,
                        duration_minutes: s.duration_minutes,
                        notes: s.notes,
                    });
                    setDurHours(Math.floor(s.duration_minutes / 60));
                    setDurMins(s.duration_minutes % 60);
                })
                .catch(e => setError(e.message))
                .finally(() => setFetching(false));
        }
    }, [id, isEditing]);

    const handleChange = (field: keyof SessionInput, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleDurationChange = (hours: number, minutes: number) => {
        setDurHours(hours);
        setDurMins(minutes);
        setForm(prev => ({ ...prev, duration_minutes: hours * 60 + minutes }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEditing && id) {
                await api.updateSession(Number(id), form);
            } else {
                await api.createSession(form);
            }
            navigate('/sessions');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="page-container">
                <div className="loading-container"><div className="spinner" /></div>
            </div>
        );
    }

    const profit = form.cash_out - form.buy_in;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>{isEditing ? 'Edit Session' : 'Log New Session'}</h1>
                <p>{isEditing ? 'Update the details of this session' : 'Record the results of a poker session'}</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="form-card">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={form.date}
                            onChange={e => handleChange('date', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="game_type">Game Type</label>
                        <input
                            id="game_type"
                            type="text"
                            value={form.game_type}
                            onChange={e => handleChange('game_type', e.target.value)}
                            placeholder="e.g. 1/2 NL Hold'em"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="location">Location</label>
                        <select
                            id="location"
                            value={form.location}
                            onChange={e => {
                                if (e.target.value === '__add_new__') {
                                    setShowAddLocation(true);
                                } else {
                                    handleChange('location', e.target.value);
                                }
                            }}
                        >
                            <option value="">Select a location…</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                            <option value="__add_new__">➕ Add new location…</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="buy_in">Buy-in ($)</label>
                        <input
                            id="buy_in"
                            type="number"
                            min="0"
                            step="1"
                            value={form.buy_in || ''}
                            onChange={e => handleChange('buy_in', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cash_out">Cash-out ($)</label>
                        <input
                            id="cash_out"
                            type="number"
                            min="0"
                            step="1"
                            value={form.cash_out || ''}
                            onChange={e => handleChange('cash_out', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dur_hours">Duration (hours)</label>
                        <input
                            id="dur_hours"
                            type="number"
                            min="0"
                            step="1"
                            value={durHours || ''}
                            onChange={e => handleDurationChange(parseInt(e.target.value) || 0, durMins)}
                            placeholder="0"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dur_mins">Duration (minutes)</label>
                        <input
                            id="dur_mins"
                            type="number"
                            min="0"
                            max="59"
                            step="1"
                            value={durMins || ''}
                            onChange={e => handleDurationChange(durHours, parseInt(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="notes">Notes</label>
                        <textarea
                            id="notes"
                            value={form.notes || ''}
                            onChange={e => handleChange('notes', e.target.value)}
                            placeholder="How did the session go? Any notable hands?"
                        />
                    </div>
                </div>

                {/* Live profit preview */}
                {(form.buy_in > 0 || form.cash_out > 0) && (
                    <div style={{
                        margin: '20px 0 0',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: profit >= 0 ? 'var(--profit-bg)' : 'var(--loss-bg)',
                        border: `1px solid ${profit >= 0 ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                    }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                            Profit Preview
                        </span>
                        <div style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color: profit >= 0 ? 'var(--profit)' : 'var(--loss)',
                            marginTop: '4px',
                        }}>
                            {profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : isEditing ? 'Update Session' : 'Log Session'}
                    </button>
                    <Link to="/sessions" className="btn btn-secondary">Cancel</Link>
                </div>
            </form>

            {showAddLocation && (
                <AddLocationModal
                    onCreated={(location) => {
                        setLocations(prev => [...prev, location].sort((a, b) => a.name.localeCompare(b.name)));
                        handleChange('location', location.name);
                        setShowAddLocation(false);
                    }}
                    onClose={() => setShowAddLocation(false)}
                />
            )}
        </div>
    );
}
