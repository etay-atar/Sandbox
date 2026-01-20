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
            const res = await api.get('/submissions/'); // Uses the new endpoint
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        }
    };

    useEffect(() => {
        fetchSubmissions();
        const interval = setInterval(fetchSubmissions, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedId) {
            // Poll report if selected
            const fetchReport = async () => {
                // First check status
                const statusRes = await api.get(`/submissions/${selectedId}/status`);
                if (statusRes.data.status === 'Completed') {
                    const reportRes = await api.get(`/submissions/${selectedId}/report`);
                    setReport(reportRes.data);
                } else {
                    setReport(statusRes.data); // Show progress
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
            // Select the new file
            setSelectedId(res.data.submission_id);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800 p-4 shadow flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-400">🛡️ Sandbox Admin</h1>
                <div className="flex items-center gap-4">
                    <span>{user?.username}</span>
                    <button onClick={logout} className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-500">Logout</button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Col: Upload & List */}
                <div className="md:col-span-1 space-y-6">

                    {/* Upload Card */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Submit Sample</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                            />
                            <button
                                disabled={!file || uploading}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-2 rounded font-medium transition"
                            >
                                {uploading ? 'Uploading...' : 'Analyze File'}
                            </button>
                        </form>
                    </div>

                    {/* List Card */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow h-[60vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
                        <div className="space-y-2">
                            {submissions.map(sub => (
                                <div
                                    key={sub.submission_id}
                                    onClick={() => setSelectedId(sub.submission_id)}
                                    className={clsx(
                                        "p-3 rounded cursor-pointer border-l-4 transition",
                                        selectedId === sub.submission_id ? "bg-gray-700 border-blue-500" : "bg-gray-750 border-transparent hover:bg-gray-700"
                                    )}
                                >
                                    <div className="font-medium truncate">{sub.filename}</div>
                                    <div className="text-xs flex justify-between mt-1">
                                        <span className={clsx(
                                            sub.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'
                                        )}>{sub.status}</span>
                                        <span className="text-gray-500">{new Date(sub.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                            {submissions.length === 0 && <p className="text-gray-500 text-center">No submissions yet.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Col: Report Viewer */}
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow h-full overflow-y-auto">
                    {selectedId ? (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Analysis Report <span className="text-sm font-normal text-gray-500">{selectedId}</span></h2>
                            {report ? (
                                <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-sm font-mono text-green-400">
                                    {JSON.stringify(report, null, 2)}
                                </pre>
                            ) : (
                                <div className="flex justify-center py-10">Loading details...</div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-20">Select a submission to view details</div>
                    )}
                </div>

            </main>
        </div>
    );
}
