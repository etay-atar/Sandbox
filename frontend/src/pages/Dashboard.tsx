import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import ReportGlossaryModal from '../components/ReportGlossaryModal';
import VisualReport from '../components/VisualReport';

interface Submission {
    submission_id: string;
    filename: string;
    status: string;
    final_verdict: string;
    created_at: string;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);
    const [showGlossary, setShowGlossary] = useState(false);
    const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
    const [dashboardMode, setDashboardMode] = useState<'analysis' | 'admin'>('analysis');
    const [adminTab, setAdminTab] = useState<'health' | 'users'>('health');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [healthMetrics, setHealthMetrics] = useState<any>(null);
    const [usersList, setUsersList] = useState<any[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchSubmissions = async () => {
        try {
            const res = await api.get('/submissions/');
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        }
    };

    const fetchAdminData = async () => {
        if (user?.role === 'Admin') {
            try {
                const logsRes = await api.get('/audit/logs');
                setAuditLogs(logsRes.data);
                const healthRes = await api.get('/admin/vm-pool');
                setHealthMetrics(healthRes.data);
                const usersRes = await api.get('/admin/users');
                setUsersList(usersRes.data);
            } catch (err) {
                console.error("Failed to fetch admin data", err);
            }
        }
    };

    useEffect(() => {
        fetchSubmissions();
        fetchAdminData();
        const interval = setInterval(() => {
            fetchSubmissions();
            if (dashboardMode === 'admin') fetchAdminData();
        }, 5000);
        return () => clearInterval(interval);
    }, [user, dashboardMode]);

    useEffect(() => {
        if (selectedId) {
            const fetchReport = async () => {
                const statusRes = await api.get(`/submissions/${selectedId}/status`);
                if (statusRes.data.status === 'Completed' || statusRes.data.status === 'Failed') {
                    try {
                        const reportRes = await api.get(`/submissions/${selectedId}/report`);
                        setReport(reportRes.data);
                    } catch {
                        setReport(statusRes.data);
                    }
                } else {
                    setReport(statusRes.data);
                }
            };
            fetchReport();
            const interval = setInterval(fetchReport, 2000);
            return () => clearInterval(interval);
        } else {
            setReport(null);
        }
    }, [selectedId]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/submissions/', formData);
            setFile(null);
            fetchSubmissions();
            setSelectedId(res.data.submission_id);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to update role");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to delete user");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
            case 'Failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getVerdictStyle = (verdict: string) => {
        if (!verdict) return '';
        const v = verdict.toLowerCase();
        if (v.includes('malicious')) return 'text-red-400 font-bold';
        if (v.includes('suspicious')) return 'text-yellow-400 font-bold';
        if (v.includes('benign')) return 'text-emerald-400 font-bold';
        return 'text-gray-400';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-900/20 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="glass border-b border-gray-800/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gray-800 rounded-lg border border-gray-700 shadow-lg glow">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Sandbox <span className="text-primary-400">Analysis</span></h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-300">System Online</span>
                        </div>
                        <div className="h-6 w-px bg-gray-700"></div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col text-right mr-2">
                                <span className="text-sm font-semibold text-gray-200 leading-tight">{user?.username}</span>
                                <span className="text-[10px] font-bold tracking-widest text-primary-400 uppercase">{user?.role}</span>
                            </div>
                            <button onClick={logout} className="btn-danger text-xs font-semibold py-1.5">Terminate Session</button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[95rem] mx-auto p-4 md:p-6 flex flex-col xl:grid xl:grid-cols-12 gap-6 relative z-10">

                {/* Mobile / Tablet Navigation */}
                <nav className="xl:hidden flex gap-3 overflow-x-auto pb-2 custom-scrollbar glass rounded-xl p-2 border border-gray-800">
                    <button onClick={() => { 
                        setDashboardMode('analysis'); 
                        setFile(null); 
                        setSelectedId(null);
                        setTimeout(() => fileInputRef.current?.click(), 50);
                    }} className={clsx("whitespace-nowrap px-4 py-2 rounded-lg font-bold tracking-wide transition-colors flex items-center gap-2 text-sm", dashboardMode === 'analysis' && !selectedId ? "bg-primary-500/20 text-primary-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200")}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        New Scan
                    </button>
                    <button onClick={() => setDashboardMode('analysis')} className={clsx("whitespace-nowrap px-4 py-2 rounded-lg font-bold tracking-wide transition-colors flex items-center gap-2 text-sm", dashboardMode === 'analysis' && selectedId ? "bg-primary-500/20 text-primary-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200")}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Recent Scans
                    </button>
                    {user?.role === 'Admin' && (
                        <button onClick={() => setDashboardMode('admin')} className={clsx("whitespace-nowrap px-4 py-2 rounded-lg font-bold tracking-wide transition-colors flex items-center gap-2 text-sm", dashboardMode === 'admin' ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200")}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Admin Console
                        </button>
                    )}
                </nav>

                {/* Left Sidebar (Desktop Only) */}
                <div className="xl:col-span-2 flex-col gap-4 h-[calc(100vh-10rem)] hidden xl:flex">
                    <nav className="glass rounded-2xl border border-gray-800 shadow-2xl p-4 flex flex-col gap-2 bg-gray-900/40">
                        <a href="#" onClick={(e) => { 
                            e.preventDefault(); 
                            setDashboardMode('analysis'); 
                            setFile(null); 
                            setSelectedId(null);
                            setTimeout(() => fileInputRef.current?.click(), 50);
                        }} className={clsx("px-4 py-3 rounded-xl font-bold tracking-wide transition-colors flex items-center gap-3", dashboardMode === 'analysis' && !selectedId ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200")}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            New Analysis
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setDashboardMode('analysis'); }} className={clsx("px-4 py-3 rounded-xl font-bold tracking-wide transition-colors flex items-center gap-3", dashboardMode === 'analysis' && selectedId ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200")}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Recent Scans
                        </a>
                        
                        {user?.role === 'Admin' && (
                            <a href="#" onClick={(e) => { e.preventDefault(); setDashboardMode('admin'); }} className={clsx("px-4 py-3 rounded-xl font-bold tracking-wide transition-colors flex items-center gap-3", dashboardMode === 'admin' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200")}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Admin Console
                            </a>
                        )}
                        <a href="https://github.com/etay-atar/Sandbox" target="_blank" rel="noreferrer" className="px-4 py-3 rounded-xl text-gray-400 font-bold tracking-wide hover:bg-gray-800/50 hover:text-gray-200 transition-colors flex items-center gap-3 mt-auto">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            Documentation
                        </a>
                    </nav>
                </div>

                {/* Middle Col & Right Col container conditionally rendered */}
                {dashboardMode === 'analysis' ? (
                    <>
                        <div className="xl:col-span-3 flex flex-col gap-6 h-[600px] xl:h-[calc(100vh-10rem)]">

                    {/* Upload Card */}
                    <div className={clsx("glass rounded-2xl p-6 flex-shrink-0 animate-fade-in relative overflow-hidden group border shadow-2xl", user?.role === 'Auditor' ? "border-red-900/50 bg-red-950/10" : "border-gray-800")}>
                        {user?.role === 'Auditor' ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
                                <div className="p-3 bg-red-900/20 rounded-full border border-red-500/30 mb-4 shadow-inner">
                                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-200 tracking-wide mb-2">Read-Only Compliance Mode</h3>
                                <p className="text-sm text-gray-400 font-medium max-w-sm">
                                    Your Auditor clearance restricts active detonation operations. You may review existing reports and audit logs.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2 relative z-10">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    Submit Target
                                </h2>

                                <form onSubmit={handleUpload} className="space-y-4 relative z-10">
                                    <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-primary-500/50 hover:bg-primary-900/10 transition-colors cursor-pointer flex flex-col gap-2 items-center justify-center min-h-[120px] bg-gray-900/40">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={e => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="p-2 bg-gray-800 rounded-full text-gray-400 group-hover:text-primary-400 transition-colors shadow-inner border border-gray-700">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        </div>
                                        <div className="text-sm font-medium text-gray-300">
                                            {file ? <span className="text-primary-400 truncate max-w-[200px] block">{file.name}</span> : 'Select or drop executable'}
                                        </div>
                                    </div>
                                    <button
                                        disabled={!file || uploading}
                                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 relative overflow-hidden"
                                    >
                                        {uploading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Transmitting...
                                            </>
                                        ) : 'Initiate Scan'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    {/* List Card */}
                    <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden animate-slide-up border border-gray-800 shadow-2xl" style={{ animationDelay: '0.1s' }}>
                        <div className="p-4 border-b border-gray-800/60 flex justify-between items-center bg-gray-900/50">
                            <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                Recent Operations
                            </h2>
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">{submissions.length} Total</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-900/20">
                            {submissions.map(sub => (
                                <div
                                    key={sub.submission_id}
                                    onClick={() => setSelectedId(sub.submission_id)}
                                    className={clsx(
                                        "group p-4 rounded-xl cursor-pointer transition-all duration-300 border relative overflow-hidden flex flex-col gap-2",
                                        selectedId === sub.submission_id
                                            ? "bg-primary-900/20 border-primary-500/50 shadow-[inset_4px_0_0_0_rgba(14,165,233,1)]"
                                            : "glass border-gray-800 hover:bg-gray-800/60 hover:border-gray-700 hover:shadow-[inset_4px_0_0_0_rgba(55,65,81,1)]"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-mono text-sm text-gray-200 truncate pr-2 font-medium" title={sub.filename}>{sub.filename}</div>
                                        <div className="text-[10px] text-gray-500 whitespace-nowrap font-medium tracking-wide">{new Date(sub.created_at).toLocaleTimeString()}</div>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className={clsx("text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border", getStatusStyle(sub.status))}>
                                            {sub.status.toUpperCase()}
                                        </span>
                                        <span className={clsx("text-[10px] font-bold tracking-wider uppercase", getVerdictStyle(sub.final_verdict))}>
                                            {sub.final_verdict}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {submissions.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 relative z-10">
                                    <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center bg-gray-900/30">
                                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    </div>
                                    <p className="text-sm font-medium tracking-wide">Awaiting first target intel.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Report Viewer */}
                <div className="xl:col-span-7 h-[800px] xl:h-[calc(100vh-10rem)] glass rounded-2xl flex flex-col overflow-hidden animate-slide-up border border-gray-800 shadow-2xl" style={{ animationDelay: '0.2s' }}>
                    <div className="p-4 border-b border-gray-800/60 bg-gray-900/50 flex justify-between items-center relative z-10">
                        <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Intelligence Report
                        </h2>
                        <div className="flex items-center gap-4">
                            
                            {/* View Mode Toggle */}
                            {report && (
                                <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('visual')}
                                        className={clsx("text-xs font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-2", viewMode === 'visual' ? "bg-primary-500/20 text-primary-400" : "text-gray-500 hover:text-gray-300")}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        Visual
                                    </button>
                                    <button
                                        onClick={() => setViewMode('json')}
                                        className={clsx("text-xs font-semibold px-3 py-1.5 rounded-md transition-all flex items-center gap-2", viewMode === 'json' ? "bg-primary-500/20 text-primary-400" : "text-gray-500 hover:text-gray-300")}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                        JSON
                                    </button>
                                </div>
                            )}

                            <button 
                                onClick={() => setShowGlossary(true)}
                                className="text-xs font-semibold tracking-wide text-primary-400 bg-primary-900/10 hover:bg-primary-900/30 border border-primary-500/20 hover:border-primary-500/50 px-3 py-1.5 rounded transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Glossary
                            </button>
                            {selectedId && <span className="text-[10px] font-mono font-bold tracking-widest text-primary-400 bg-primary-900/20 px-2 py-1 rounded border border-primary-500/30">ID: {selectedId.split('-')[0]}</span>}
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-[#0a0f16]">
                        {selectedId ? (
                            <div className="min-h-full">
                                {report ? (
                                    <div className="animate-fade-in min-h-full flex flex-col gap-4">
                                        
                                        {viewMode === 'visual' ? (
                                            <VisualReport report={report} />
                                        ) : (
                                            <>
                                                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex divide-x divide-gray-700/50 shadow-inner">
                                            <div className="px-4 flex-1">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Status</p>
                                                <p className="font-mono text-sm text-gray-300 bg-gray-800 inline-block px-2 py-1 rounded">{report.status || 'Completed'}</p>
                                            </div>
                                            {report.verdict && (
                                                <div className="px-4 flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Verdict</p>
                                                    <p className={clsx("font-mono text-sm tracking-wider uppercase inline-block px-2 py-1 rounded bg-gray-800", getVerdictStyle(report.verdict))}>{report.verdict}</p>
                                                </div>
                                            )}
                                            {report.engine && (
                                                <div className="px-4 flex-1">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Engine</p>
                                                    <p className="font-mono text-sm text-primary-400 bg-gray-800 inline-block px-2 py-1 rounded">{report.engine}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 relative rounded-xl border border-gray-800 bg-[#06090e] shadow-inner overflow-hidden flex flex-col">
                                            <div className="flex px-4 py-3 bg-gray-900/80 border-b border-gray-800 gap-2 items-center shadow-sm">
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm border border-red-600/50"></div>
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm border border-yellow-600/50"></div>
                                                    <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm border border-green-600/50"></div>
                                                </div>
                                                <span className="ml-4 text-xs font-mono font-medium text-gray-500 flex items-center gap-2">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    terminal_output.json
                                                </span>
                                            </div>
                                            <div className="flex-1 overflow-auto p-5 custom-scrollbar bg-transparent">
                                                <pre className="text-[13px] font-mono leading-relaxed tracking-tight">
                                                    <code className="text-primary-300 block pb-4">
                                                        {JSON.stringify(report, null, 2).split('\n').map((line, i) => {
                                                            if (line.includes('": "')) {
                                                                const parts = line.split('": "');
                                                                return <div key={i} className="hover:bg-primary-900/20 px-2 rounded -mx-2 transition-colors duration-150"><span className="text-gray-400">{parts[0]}": "</span><span className="text-emerald-400">{parts[1].replace('",', '')}</span>{line.endsWith('",') ? '",' : '"'}</div>;
                                                            }
                                                            if (line.includes('": null')) {
                                                                return <div key={i} className="hover:bg-primary-900/20 px-2 rounded -mx-2 transition-colors duration-150"><span className="text-gray-400">{line.replace('null', '')}</span><span className="text-purple-400 italic">null</span>{line.endsWith(',') ? ',' : ''}</div>;
                                                            }
                                                            if (line.includes('": true') || line.includes('": false')) {
                                                                const boolStr = line.includes('true') ? 'true' : 'false';
                                                                return <div key={i} className="hover:bg-primary-900/20 px-2 rounded -mx-2 transition-colors duration-150"><span className="text-gray-400">{line.replace(boolStr, '')}</span><span className="text-purple-400">{boolStr}</span>{line.endsWith(',') ? ',' : ''}</div>;
                                                            }
                                                            if (line.includes('": [') || line.includes('": {')) {
                                                                const parts = line.split('": ');
                                                                return <div key={i} className="hover:bg-primary-900/20 px-2 rounded -mx-2 transition-colors duration-150"><span className="text-primary-300 font-medium">{parts[0]}": </span>{parts[1]}</div>;
                                                            }
                                                            return <div key={i} className="text-gray-400 hover:bg-primary-900/20 px-2 rounded -mx-2 transition-colors duration-150">{line}</div>;
                                                        })}
                                                    </code>
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                                    </div>
                                ) : (
                                    <div className="min-h-full flex flex-col items-center justify-center text-gray-600 relative z-10 py-20">
                                        <svg className="w-12 h-12 mb-4 animate-pulse text-primary-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        <p className="font-mono text-sm tracking-widest uppercase opacity-80 animate-pulse text-primary-400/80">Running diagnostics...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="min-h-full flex flex-col items-center justify-center text-gray-700 relative z-10 py-20">
                                <div className="p-6 rounded-full glass border border-gray-800 mb-8 shadow-2xl relative">
                                    <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping opacity-20 hidden md:block"></div>
                                    <svg className="w-16 h-16 text-primary-500/40 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <p className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-gray-500">Initialize Target Selection</p>
                                <div className="mt-6 border border-gray-800 rounded-xl bg-gray-900/30 p-5 max-w-sm text-center shadow-inner">
                                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                        Select a recent operation from the panel to view its complete intelligence report, static analysis details, and AI behavioral verdicts.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                    </>
                ) : (
                    <div className="xl:col-span-10 flex flex-col gap-6 min-h-[800px] xl:h-[calc(100vh-10rem)] animate-fade-in">
                        {/* Admin Navigation */}
                        <div className="glass rounded-xl p-2 border border-gray-800 shadow-lg flex items-center gap-2 max-w-fit">
                            <button
                                onClick={() => setAdminTab('health')}
                                className={clsx("px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all", adminTab === 'health' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-inner" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50")}
                            >
                                System Overview
                            </button>
                            <button
                                onClick={() => setAdminTab('users')}
                                className={clsx("px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all", adminTab === 'users' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-inner" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50")}
                            >
                                User Management
                            </button>
                        </div>

                        {/* Admin Content */}
                        {adminTab === 'health' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                                <div className="glass rounded-2xl p-6 border border-purple-900/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col">
                                    <h3 className="text-sm font-bold tracking-widest text-purple-400 uppercase mb-4">System Health</h3>
                                    {healthMetrics ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">VM Pool Status</span>
                                                <span className="text-sm font-mono text-emerald-400">{healthMetrics.status}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Agents</span>
                                                <span className="text-sm font-mono text-primary-400">{healthMetrics.active_vms} / {healthMetrics.total_vms}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-800 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-800 rounded"></div></div></div></div>
                                    )}
                                </div>
                                
                                <div className="md:col-span-2 glass rounded-2xl p-6 border border-gray-800 shadow-2xl flex flex-col h-full overflow-hidden">
                                    <h3 className="text-sm font-bold tracking-widest text-gray-300 uppercase mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Global Audit Log
                                    </h3>
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                        {auditLogs.length > 0 ? auditLogs.map(log => (
                                            <div key={log.log_id} className="bg-gray-900/40 p-3 rounded-lg border border-gray-800 flex justify-between items-center hover:bg-gray-800/40 transition-colors">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold text-gray-200">{log.username}</span>
                                                        <span className="text-[10px] uppercase tracking-widest font-mono bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">{log.action}</span>
                                                    </div>
                                                    <span className="text-[11px] text-gray-400">{log.details}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-gray-500 italic">No audit events recorded.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass rounded-2xl border border-gray-800 shadow-2xl flex flex-col h-full overflow-hidden p-6 animate-slide-up">
                                <h3 className="text-sm font-bold tracking-widest text-gray-300 uppercase mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    Registered Personnel
                                </h3>
                                <div className="flex-1 overflow-auto custom-scrollbar border border-gray-800/50 rounded-xl bg-gray-900/20">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-900/80 text-xs tracking-widest uppercase text-gray-500 border-b border-gray-800">
                                                <th className="p-4 font-bold">User</th>
                                                <th className="p-4 font-bold">Email</th>
                                                <th className="p-4 font-bold">Clearance Level</th>
                                                <th className="p-4 font-bold">Registration Date</th>
                                                <th className="p-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800/50">
                                            {usersList.map(u => (
                                                <tr key={u.user_id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-200">{u.username}</div>
                                                        <div className="text-[10px] font-mono text-gray-600 truncate max-w-[120px]">{u.user_id}</div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400">{u.email || 'N/A'}</td>
                                                    <td className="p-4">
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleUpdateRole(u.user_id, e.target.value)}
                                                            className={clsx(
                                                                "bg-gray-900 border text-xs font-bold tracking-wider uppercase px-2 py-1.5 rounded-lg outline-none cursor-pointer transition-colors focus:ring-2 focus:ring-primary-500/50",
                                                                u.role === 'Admin' ? "border-purple-500/50 text-purple-400 hover:bg-purple-900/20" :
                                                                u.role === 'Auditor' ? "border-red-500/50 text-red-400 hover:bg-red-900/20" :
                                                                "border-primary-500/50 text-primary-400 hover:bg-primary-900/20"
                                                            )}
                                                        >
                                                            <option value="Analyst">Analyst</option>
                                                            <option value="Auditor">Auditor</option>
                                                            <option value="Admin">Admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-xs font-mono text-gray-500">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteUser(u.user_id)}
                                                            className="text-xs font-bold tracking-wider uppercase bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:border-red-500/60 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title={u.username === user?.username ? "Cannot delete yourself" : "Delete User"}
                                                        >
                                                            Revoke
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="glass border-t border-gray-800/50 mt-auto relative z-50">
                <div className="max-w-[95rem] mx-auto px-6 h-10 flex justify-between items-center bg-gray-900/50 text-xs font-mono font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        All Systems Operational
                    </div>
                    <div className="flex items-center gap-4">
                        <span>VM Pool: 3/5 Busy</span>
                        <div className="h-4 w-px bg-gray-700"></div>
                        <span>v1.0.0</span>
                    </div>
                </div>
            </footer>

            <ReportGlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
        </div>
    );
}
