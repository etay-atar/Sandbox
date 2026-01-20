import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('Analyst'); // Default for ease
    const [password, setPassword] = useState('password123'); // Default for ease
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. Register (just in case it's a new test run, makes life easier)
            // Ignore error if already exists
            try {
                await api.post('/auth/register', { username, password });
            } catch (err) { /* ignore */ }

            // 2. Login
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const res = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(res.data.access_token, username);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">Sandbox Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full p-2 mt-1 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-2 mt-1 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-400"
                        />
                    </div>
                    <button type="submit" className="w-full p-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition">
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}
