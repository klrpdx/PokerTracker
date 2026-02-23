export interface Location {
    id: number;
    name: string;
}

export interface Session {
    id: number;
    date: string;
    location: string;
    game_type: string;
    buy_in: number;
    cash_out: number;
    duration_minutes: number;
    notes: string;
    created_at: string;
}

export interface SessionInput {
    date: string;
    location: string;
    game_type: string;
    buy_in: number;
    cash_out: number;
    duration_minutes: number;
    notes?: string;
}

export interface SessionStats {
    total_sessions: number;
    total_profit: number;
    winning_sessions: number;
    losing_sessions: number;
    win_rate: number;
    avg_profit: number;
    avg_hourly_rate: number;
    total_hours: number;
    best_session: number;
    worst_session: number;
    by_location: { location: string; sessions: number; profit: number }[];
    by_game_type: { game_type: string; sessions: number; profit: number }[];
}
