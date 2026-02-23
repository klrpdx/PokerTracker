import { useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Location } from '../types';

interface AddLocationModalProps {
    onCreated: (location: Location) => void;
    onClose: () => void;
}

export default function AddLocationModal({ onCreated, onClose }: AddLocationModalProps) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSaving(true);
        setError('');

        try {
            const location = await api.createLocation(name.trim());
            onCreated(location);
        } catch (err: any) {
            setError(err.message || 'Failed to create location');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <h2>Add New Location</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem' }}>
                    Enter the name of the poker venue or location.
                </p>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="location-name">Location Name</label>
                        <input
                            id="location-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Bellagio, Home Game"
                            autoFocus
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
                            {saving ? 'Saving...' : 'Add Location'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
