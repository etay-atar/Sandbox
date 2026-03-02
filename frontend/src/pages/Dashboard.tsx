import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

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

    const fetchSubmissions = async () => {
        try {
            const res = await api.get('/submissions/');
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        }
    };

    useEffect(() => {
        fetchSubmissions();
        const interval = setInterval(fetchSubmissions, 5000);
        return () => clearInterval(interval);
    }, []);

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
                            <span className="text-sm font-semibold text-gray-200">{user?.username}</span>
                            <button onClick={logout} className="btn-danger text-xs font-semibold py-1.5">Terminate Session</button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[90rem] mx-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">

                {/* Left Col: Upload & List */}
                <div className="xl:col-span-4 flex flex-col gap-6 h-[calc(100vh-8rem)]">

                    {/* Upload Card */}
                    <div className="glass rounded-2xl p-6 flex-shrink-0 animate-fade-in relative overflow-hidden group border border-gray-800 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            Submit Target
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-4 relative z-10">
                            <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-primary-500/50 hover:bg-primary-900/10 transition-colors cursor-pointer flex flex-col gap-2 items-center justify-center min-h-[120px] bg-gray-900/40">
                                <input
                                    type="file"
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
                <div className="xl:col-span-8 h-[calc(100vh-8rem)] glass rounded-2xl flex flex-col overflow-hidden animate-slide-up border border-gray-800 shadow-2xl" style={{ animationDelay: '0.2s' }}>
                    <div className="p-4 border-b border-gray-800/60 bg-gray-900/50 flex justify-between items-center relative z-10">
                        <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Intelligence Report
                        </h2>
                        {selectedId && <span className="text-[10px] font-mono font-bold tracking-widest text-primary-400 bg-primary-900/20 px-2 py-1 rounded border border-primary-500/30">ID: {selectedId.split('-')[0]}</span>}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-[#0a0f16]">
                        {selectedId ? (
                            <div className="h-full">
                                {report ? (
                                    <div className="animate-fade-in h-full flex flex-col gap-4">
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
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 relative z-10">
                                        <svg className="w-12 h-12 mb-4 animate-pulse text-primary-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        <p className="font-mono text-sm tracking-widest uppercase opacity-80 animate-pulse text-primary-400/80">Running diagnostics...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-700 relative z-10">
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

            </main>
        </div>
    );
}
