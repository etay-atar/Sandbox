import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState(''); // Only during registration
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        
        try {
            if (isRegistering) {
                // EXPLICIT REGISTRATION
                try {
                    await api.post('/auth/register', { username, password, email, role: 'Analyst' });
                    setSuccessMsg('Registration successful! Logging in...');
                } catch (registerError: any) {
                    setError(registerError.response?.data?.detail || 'Registration failed due to strict password requirements.');
                    return;
                }
            }

            // EXPLICIT LOGIN
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const res = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(res.data.access_token, username);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 400 || err.response?.status === 401) {
                setError('Invalid username or password');
            } else {
                setError('Network or server error');
            }
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
            {/* Background animated elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-400 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

            {/* Very faint background grid/texture could go here if needed, but the dark bg and glowing orbs are usually enough for cybersecurity */}

            <div className="relative w-full max-w-md p-10 glass rounded-2xl animate-slide-up mx-4 shadow-2xl z-10 border border-gray-800/60">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-700 shadow-lg animate-glow">
                        <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight">Sandbox Access</h2>
                <p className="text-gray-500 text-sm text-center mb-8 font-medium">Secure analysis environment authentication</p>

                {error && <div className="p-3 mb-6 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg animate-fade-in text-center font-medium shadow-inner">{error}</div>}
                {successMsg && <div className="p-3 mb-6 text-sm text-green-400 bg-green-950/40 border border-green-900/50 rounded-lg animate-fade-in text-center font-medium shadow-inner">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="group">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-primary-400 transition-colors">Analyst ID / Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="input-premium"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-primary-400 transition-colors">Clearance Code</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-premium font-mono tracking-widest"
                            placeholder="••••••••"
                        />
                    </div>

                    {isRegistering && (
                        <div className="group animate-slide-up">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-primary-400 transition-colors">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-premium"
                                placeholder="analyst@domain.com"
                                required
                            />
                        </div>
                    )}

                    <div className="pt-2">
                        <button type="submit" className="btn-primary w-full shadow-[0_0_15px_rgba(30,58,138,0.5)]">
                            {isRegistering ? 'Register & Initialize' : 'Initialize Session'}
                        </button>
                    </div>
                </form>
                
                <div className="mt-6 text-center">
                    <button 
                        type="button" 
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-gray-400 hover:text-primary-400 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        {isRegistering ? "Already have an account? Login" : "Don't have an account? Request access"}
                    </button>
                </div>
            </div>
        </div>
    );
}
