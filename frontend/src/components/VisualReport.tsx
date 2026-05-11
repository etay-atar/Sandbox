import clsx from 'clsx';

interface Props {
    report: any;
}

export default function VisualReport({ report }: Props) {
    if (!report) return null;

    const getVerdictStyle = (verdict: string) => {
        if (!verdict) return 'bg-gray-800 text-gray-400';
        const v = verdict.toLowerCase();
        if (v.includes('malicious')) return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
        if (v.includes('suspicious')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
        if (v.includes('benign')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
        return 'bg-gray-800 text-gray-400 border-gray-700';
    };

    // Safely extract nested data
    const staticData = report.static_analysis || {};
    const aiData = report.ai_analysis || {};
    const dynamicData = report.dynamic_analysis || {};
    
    const threatScore = aiData.threat_score || 0;
    const entropy = aiData.features?.shannon_entropy || 0;
    
    const yaraMatches: string[] = report.yara_matches || [];
    const anomalies: string[] = staticData.anomalies || [];
    const imports: string[] = staticData.imports_sample || [];

    // Calculate progress bar widths and colors
    const threatScorePercent = Math.min(Math.max(threatScore * 100, 0), 100);
    const threatColor = threatScorePercent > 80 ? 'bg-red-500' : threatScorePercent > 50 ? 'bg-yellow-500' : 'bg-emerald-500';

    const entropyPercent = Math.min(Math.max((entropy / 8) * 100, 0), 100);
    const entropyColor = entropy > 7.0 ? 'bg-red-500' : entropy > 6.0 ? 'bg-yellow-500' : 'bg-blue-500';

    return (
        <div className="flex flex-col gap-6 animate-fade-in p-2">
            
            {/* Header Area */}
            <div className="glass rounded-2xl p-6 border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-900/10 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none"></div>
                <div className="z-10 flex-1">
                    <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                        <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {report.filename}
                    </h1>
                    <p className="text-xs font-mono text-gray-500 mt-2 truncate w-full max-w-md" title={report.file_sha256}>
                        SHA256: {report.file_sha256}
                    </p>
                    <p className="text-xs text-primary-500/70 mt-1 font-semibold">Engine: {report.engine}</p>
                </div>
                <div className={clsx("z-10 px-6 py-3 rounded-xl border-2 font-bold tracking-[0.2em] uppercase text-sm", getVerdictStyle(report.verdict))}>
                    {report.verdict}
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AI Threat Meter */}
                <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800/80 shadow-inner flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI Threat Score
                        </h3>
                        <span className="font-mono text-lg font-bold text-gray-200">{threatScorePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                        <div className={clsx("h-full transition-all duration-1000", threatColor)} style={{ width: `${threatScorePercent}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-3 text-right">Model: {aiData.model || 'N/A'}</p>
                </div>

                {/* Entropy Gauge */}
                <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800/80 shadow-inner flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                            Shannon Entropy
                        </h3>
                        <span className="font-mono text-lg font-bold text-gray-200">{entropy.toFixed(2)} / 8.0</span>
                    </div>
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                        <div className={clsx("h-full transition-all duration-1000", entropyColor)} style={{ width: `${entropyPercent}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-3 text-right">
                        {entropy > 7.0 ? 'Highly packed/encrypted' : entropy > 6.0 ? 'Elevated randomness' : 'Normal code structure'}
                    </p>
                </div>
            </div>

            {/* Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* YARA & Anomalies */}
                <div className="glass rounded-2xl p-5 border border-gray-800 flex flex-col gap-4">
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase border-b border-gray-800 pb-2">Detection Indicators</h3>
                    
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">YARA Rules Triggered ({yaraMatches.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {yaraMatches.length > 0 ? yaraMatches.map((y, i) => (
                                <span key={i} className="px-2 py-1 bg-red-900/30 text-red-400 text-xs font-mono rounded border border-red-500/30">{y}</span>
                            )) : <span className="text-xs text-emerald-500 font-mono bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">Clean - No Signatures</span>}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Structural Anomalies ({anomalies.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {anomalies.length > 0 ? anomalies.map((a, i) => (
                                <span key={i} className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-mono rounded border border-yellow-500/30">{a}</span>
                            )) : <span className="text-xs text-emerald-500 font-mono bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">Clean - Standard Structure</span>}
                        </div>
                    </div>
                </div>

                {/* PE Info */}
                <div className="glass rounded-2xl p-5 border border-gray-800 flex flex-col gap-4">
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase border-b border-gray-800 pb-2">PE Architecture</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Executable</p>
                            <p className="font-mono text-sm text-gray-200">{staticData.is_pe ? 'True (Windows PE)' : 'False'}</p>
                        </div>
                        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Architecture</p>
                            <p className="font-mono text-sm text-gray-200">{staticData.machine || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Digital Signature</p>
                            <p className="font-mono text-sm text-gray-200">{staticData.is_signed ? <span className="text-emerald-400">Present</span> : <span className="text-red-400">Missing</span>}</p>
                        </div>
                        <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/50">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500">Sections</p>
                            <p className="font-mono text-sm text-gray-200">{staticData.number_of_sections || 0}</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Imports Array */}
            {imports.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-gray-800 mt-2">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Suspicious / Sample Imports</h3>
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">{staticData.imports_count} Total</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {imports.map((imp, idx) => {
                            const [dll, func] = imp.split(':');
                            return (
                                <div key={idx} className="flex flex-col bg-gray-900/30 p-2 rounded border border-gray-800/50">
                                    <span className="text-[10px] text-gray-500 font-mono">{dll}</span>
                                    <span className="text-xs text-primary-300 font-mono truncate" title={func}>{func}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Behavioral Activity (Dynamic Sandbox) */}
            {dynamicData.status && (
                <div className="glass rounded-2xl p-5 border border-gray-800 mt-2 flex flex-col gap-5 relative overflow-hidden">
                    {/* Simulated Badge */}
                    {dynamicData.hypervisor?.includes('Simulated') && (
                        <div className="absolute top-4 right-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Simulated Execution
                        </div>
                    )}

                    <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                        <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400 border border-purple-500/30">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-gray-200 uppercase">Behavioral Activity</h3>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Runtime execution captured via {dynamicData.hypervisor || 'Sandbox'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Process Tree */}
                        <div className="bg-[#06090e] border border-gray-800 rounded-xl p-4 shadow-inner flex flex-col">
                            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-2">
                                <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                Process Tree
                            </h4>
                            <p className="text-[9px] text-gray-600 mb-3">Identifies if the malware attempts to spawn hidden child processes (like PowerShell or cmd.exe) to execute malicious commands.</p>
                            <div className="font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto whitespace-pre">
                                {(dynamicData.process_tree || []).length > 0 ? (
                                    (dynamicData.process_tree || []).map((proc: string, i: number) => (
                                        <div key={i} className="text-primary-300">{proc}</div>
                                    ))
                                ) : (
                                    <span className="text-gray-600 italic">No child processes spawned.</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {/* Network Activity */}
                            <div className="bg-[#06090e] border border-gray-800 rounded-xl p-4 shadow-inner">
                                <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-2">
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                    Network Calls
                                </h4>
                                <p className="text-[9px] text-gray-600 mb-3">Intercepted outbound connections attempting to reach Command & Control (C2) servers or download secondary payloads.</p>
                                <div className="space-y-1.5">
                                    {(dynamicData.network_activity || []).length > 0 ? (
                                        (dynamicData.network_activity || []).map((net: string, i: number) => (
                                            <div key={i} className="font-mono text-[10px] bg-gray-900/50 border border-gray-800/80 px-2 py-1 rounded text-emerald-400/80 truncate" title={net}>{net}</div>
                                        ))
                                    ) : (
                                        <span className="text-xs font-mono text-gray-600 italic">No network traffic detected.</span>
                                    )}
                                </div>
                            </div>

                            {/* File System */}
                            <div className="bg-[#06090e] border border-gray-800 rounded-xl p-4 shadow-inner">
                                <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-2">
                                    <svg className="w-3 h-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                    File Drops & Modifications
                                </h4>
                                <p className="text-[9px] text-gray-600 mb-3">Detects if the malware attempts to drop hidden files (ransomware encryptors) or modify critical host system files.</p>
                                <div className="space-y-1.5">
                                    {(dynamicData.file_system_changes || []).length > 0 ? (
                                        (dynamicData.file_system_changes || []).map((file: string, i: number) => {
                                            const isCreate = file.toLowerCase().includes('create');
                                            return (
                                                <div key={i} className="font-mono text-[10px] bg-gray-900/50 border border-gray-800/80 px-2 py-1.5 rounded flex items-start gap-2">
                                                    <span className={clsx("px-1.5 py-0.5 rounded text-[9px] uppercase font-bold", isCreate ? "bg-yellow-900/30 text-yellow-500 border border-yellow-500/20" : "bg-blue-900/30 text-blue-400 border border-blue-500/20")}>
                                                        {isCreate ? 'Drop' : 'Mod'}
                                                    </span>
                                                    <span className="text-gray-400 truncate mt-0.5" title={file}>{file.replace(/^(Created:|Modified:)\s*/i, '')}</span>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <span className="text-xs font-mono text-gray-600 italic">No persistent file system changes.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
