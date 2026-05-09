interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportGlossaryModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" 
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0f16] border border-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col glow">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-900/20 rounded-lg text-primary-400 border border-primary-500/30">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">Intelligence Data Glossary</h2>
                            <p className="text-xs text-gray-400 tracking-wide">A guide to interpreting Sandbox Analysis metrics.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                    
                    {/* Section 1: Verdict & Engines */}
                    <section>
                        <h3 className="text-primary-400 text-sm font-bold tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">1. The Verdict & Engines</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                                <h4 className="text-gray-200 font-bold mb-1">Engines</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    The Sandbox uses multiple tools to inspect files. The <strong>Static Engine</strong> looks for known malware patterns without running the file. The <strong>AI Engine</strong> uses machine learning mathematics to guess if a file looks dangerous even if it has never been seen before (Zero-Day threats).
                                </p>
                            </div>
                            <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                                <h4 className="text-gray-200 font-bold mb-1">Final Verdict</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    <span className="text-red-400 font-semibold">Malicious:</span> The file is definitively harmful.<br/>
                                    <span className="text-yellow-400 font-semibold">Suspicious:</span> No exact match was found, but AI flagged it as risky.<br/>
                                    <span className="text-emerald-400 font-semibold">Benign:</span> The file appears safe.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: PE Architecture */}
                    <section>
                        <h3 className="text-primary-400 text-sm font-bold tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">2. Executable DNA (PE Headers)</h3>
                        <div className="space-y-3">
                            <div className="flex gap-4 items-start bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                                <div className="font-mono text-xs font-bold text-gray-300 w-24 pt-0.5">is_pe</div>
                                <div className="flex-1 text-sm text-gray-400">
                                    Stands for "Portable Executable". If this is true, the file is a standard Windows program (like an .exe or .dll). Malware often disguises itself as documents, so checking the true structure is critical.
                                </div>
                            </div>
                            <div className="flex gap-4 items-start bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                                <div className="font-mono text-xs font-bold text-gray-300 w-24 pt-0.5">anomalies</div>
                                <div className="flex-1 text-sm text-gray-400">
                                    Hackers often modify a file's metadata to trick security systems. An anomaly like a <em>"Future compilation timestamp"</em> means the file claims it was built in the year 2099—a massive red flag indicating the file has been tampered with.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Entropy */}
                    <section>
                        <h3 className="text-primary-400 text-sm font-bold tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">3. Shannon Entropy & Packing</h3>
                        <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50 space-y-3">
                            <p className="text-sm text-gray-400 leading-relaxed">
                                <strong>Shannon Entropy</strong> is a mathematical score from <strong className="text-white">0.0 to 8.0</strong> that measures the "randomness" of the data inside the file.
                            </p>
                            <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
                                <li><strong>Low Entropy (1.0 - 4.0):</strong> Highly predictable data, like plain text documents.</li>
                                <li><strong>Normal Entropy (4.0 - 6.5):</strong> Standard, safe computer code.</li>
                                <li><strong>High Entropy (7.0 - 8.0):</strong> The data looks like complete random gibberish. <strong>Why is this dangerous?</strong> Malware authors use encryption or "packing" tools to scramble their malicious code to hide it from antivirus scanners. An abnormally high entropy score almost always points to hidden, compressed malware payloads.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4: Imports */}
                    <section>
                        <h3 className="text-primary-400 text-sm font-bold tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">4. Imports (What does it do?)</h3>
                        <div className="flex gap-4 items-start bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                            <div className="font-mono text-xs font-bold text-gray-300 w-24 pt-0.5">imports</div>
                            <div className="flex-1 text-sm text-gray-400">
                                Programs have to ask Windows for permission to do things (like reading files, connecting to the internet, or drawing windows). These requests are called "Imports". If we see a file importing functions like <code className="bg-gray-800 px-1 rounded text-red-400">VirtualAlloc</code> or <code className="bg-gray-800 px-1 rounded text-red-400">WriteProcessMemory</code>, it indicates the file is trying to inject code into other programs—a classic hacker technique.
                            </div>
                        </div>
                    </section>
                    
                    {/* Section 5: YARA & AI */}
                    <section>
                        <h3 className="text-primary-400 text-sm font-bold tracking-widest uppercase mb-3 border-b border-gray-800 pb-2">5. Signatures vs. Intelligence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                                <h4 className="text-gray-200 font-bold mb-1">yara_matches</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    YARA is essentially a tool that looks for "fingerprints". If a file matches a YARA rule, it means we found an exact piece of code that has been used in known malware families before. It is a smoking gun.
                                </p>
                            </div>
                            <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                                <h4 className="text-gray-200 font-bold mb-1">ai_analysis</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Instead of looking for known fingerprints, the AI outputs a <strong>threat_score</strong>. It looks at the file's overall structure and entropy, and guesses the probability that it is malware. A score closer to <strong className="text-red-400">1.0</strong> means the AI is highly confident the file is dangerous.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
