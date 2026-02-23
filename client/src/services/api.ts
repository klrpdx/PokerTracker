import { Location, Session, SessionInput, SessionStats } from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error || `Request failed: ${res.status}`);
    }
    return res.json();
}

export const api = {
    getSessions: () => request<Session[]>('/sessions'),

    getSession: (id: number) => request<Session>(`/sessions/${id}`),

    createSession: (input: SessionInput) =>
        request<Session>('/sessions', {
            method: 'POST',
            body: JSON.stringify(input),
        }),

    updateSession: (id: number, input: SessionInput) =>
        request<Session>(`/sessions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
        }),

    deleteSession: (id: number) =>
        request<{ message: string }>(`/sessions/${id}`, {
            method: 'DELETE',
        }),

    getStats: () => request<SessionStats>('/stats'),

    getLocations: () => request<Location[]>('/locations'),

    createLocation: (name: string) =>
        request<Location>('/locations', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),
};
