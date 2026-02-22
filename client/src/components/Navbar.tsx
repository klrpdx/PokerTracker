import { NavLink } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <NavLink to="/" className="navbar-brand">
                    <span className="icon">🃏</span>
                    <span className="text">Poker Tracker</span>
                </NavLink>
                <div className="navbar-links">
                    <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/sessions" className={({ isActive }) => isActive ? 'active' : ''}>
                        Sessions
                    </NavLink>
                    <NavLink to="/sessions/new" className={({ isActive }) => isActive ? 'active' : ''}>
                        + New
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}
