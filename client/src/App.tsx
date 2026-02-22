import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SessionList from './pages/SessionList';
import SessionForm from './pages/SessionForm';

export default function App() {
    return (
        <BrowserRouter>
            <div className="app-layout">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sessions" element={<SessionList />} />
                    <Route path="/sessions/new" element={<SessionForm />} />
                    <Route path="/sessions/:id/edit" element={<SessionForm />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
