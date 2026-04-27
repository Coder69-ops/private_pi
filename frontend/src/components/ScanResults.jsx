import React, { useState } from 'react';
import { MdTerminal, MdPublic, MdDns, MdPerson, MdCode, MdCamera, MdBugReport, MdRadar, MdDescription, MdExpandMore, MdExpandLess, MdFileDownload, MdOpenInNew, MdHub } from 'react-icons/md';
import { downloadFile } from '../utils/exporters';

import { parseNmap, parseSherlock, parseSublist3r, parseTechNmap, parseNuclei } from '../utils/parsers';
import EmptyState from './EmptyState';
import NetworkMap from './visualizations/NetworkMap';

// --- COMPONENT VIEWS ---

const ViewPortPatrol = ({ ports }) => (
    <div className="space-y-3">
        {ports.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
                {ports.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded bg-black/40 border border-[#06f943]/20 hover:border-[#06f943]/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(6,249,67,0.8)] ${p.state === 'open' ? 'bg-[#06f943] animate-pulse' : 'bg-yellow-500'}`}></span>
                            <span className="font-mono text-[#06f943] font-bold text-sm tracking-wide">{p.port}</span>
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-medium group-hover:text-white transition-colors">{p.service}</span>
                    </div>
                ))}
            </div>
        ) : (
            <EmptyState
                icon={<MdDns />}
                title="NO PORTS"
                description="No open ports detected."
                compact={true}
            />
        )}
    </div>
);

const ViewUserHunter = ({ accounts, error }) => (
    <div className="space-y-3">
        {accounts.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
                {accounts.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded bg-black/40 border border-blue-500/20 hover:border-blue-400/50 transition-all group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <MdPerson className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="font-medium text-slate-300 text-sm group-hover:text-blue-300 transition-colors">{a.platform}</span>
                        </div>
                        <MdOpenInNew className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </a>
                ))}
            </div>
        ) : (
            <EmptyState
                icon={<MdPerson />}
                title={error ? "SCAN ERROR" : "NO PROFILES"}
                description={error ? "Scanner encountered errors." : "No social profiles found."}
                compact={true}
            />
        )}
    </div>
);

const ViewSubdomain = ({ subdomains }) => (
    <div className="space-y-2">
        {subdomains.length > 0 ? (
            <>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">Discovered {subdomains.length} Hosts</div>
                <div className="max-h-60 overflow-y-auto pr-2 grid grid-cols-1 gap-1.5 scrollbar-custom">
                    {subdomains.map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-purple-500 pl-3">
                            <MdDns className="w-3 h-3 text-purple-400/70 flex-shrink-0" />
                            <span className="font-mono text-slate-300 text-xs break-all">{sub}</span>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            <EmptyState
                icon={<MdPublic />}
                title="NO SUBDOMAINS"
                description="No subdomains found."
                compact={true}
            />
        )}
    </div>
);

const ViewVisual = ({ data }) => (
    <div className="space-y-4">
        {data && data.desktop ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-black">
                <img src={data.desktop} alt="Desktop Screenshot" className="w-full opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-100 group-hover:scale-105 transform" />
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono border border-white/10">
                    1280x1024
                </div>
                <a
                    href={data.desktop}
                    download
                    className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-2 text-xs text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                >
                    <MdFileDownload className="w-3.5 h-3.5" />
                    Save Screenshot
                </a>
            </div>
        ) : (
            <EmptyState
                icon={<MdCamera className="opacity-40" />}
                title="NO VISUALS"
                description="Visual reconnaissance unavailable."
                compact={true}
            />
        )}
    </div>
);

const ViewVuln = ({ vulns }) => (
    <div className="space-y-2">
        {vulns.length > 0 ? (
            <>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">Detected {vulns.length} Issues</div>
                {vulns.map((v, i) => (
                    <div key={i} className="flex flex-col p-3 rounded-lg bg-red-950/10 border border-red-500/10 hover:border-red-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                            <span className="font-bold text-slate-200 text-xs flex-1 group-hover:text-red-300 transition-colors">{v.name || v.id}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded border font-mono uppercase font-bold tracking-wider flex-shrink-0 ${v.severity === 'critical' ? 'bg-red-950 text-red-400 border-red-500/50' :
                                v.severity === 'high' ? 'bg-orange-950 text-orange-400 border-orange-500/50' :
                                    v.severity === 'medium' ? 'bg-yellow-950 text-yellow-400 border-yellow-500/50' :
                                        'bg-slate-800 text-slate-400 border-slate-600'
                                }`}>{v.severity}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 break-all font-mono pl-2 border-l border-slate-700">
                            {v.url}
                        </div>
                    </div>
                ))}
            </>
        ) : (
            <EmptyState
                icon={<MdBugReport />}
                title="NO VULNS"
                description="No vulnerabilities detected."
                compact={true}
            />
        )}
    </div>
);

const ViewBreach = ({ data }) => (
    <div className="space-y-2">
        {data && data.length > 0 ? (
            data.map((b, i) => (
                <div key={i} className="flex flex-col p-3 rounded bg-red-950/20 border border-red-500/20">
                    <div className="flex justify-between">
                        <span className="font-bold text-red-400 text-xs">{b.title || 'Unknown Breach'}</span>
                        <span className="text-[10px] text-slate-500">{b.date || 'N/A'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{b.description || 'No description available.'}</div>
                </div>
            ))
        ) : (
            <EmptyState
                icon={<MdRadar />}
                title="NO BREACHES"
                description="No breach data found."
                compact={true}
            />
        )}
    </div>
);

const ViewAI = ({ data }) => (
    <div className="space-y-3">
        {data ? (
            <div className="p-3 rounded bg-indigo-950/20 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                    <MdDescription />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Analysis</span>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {typeof data === 'string' ? data : data.summary || JSON.stringify(data, null, 2)}
                </div>
            </div>
        ) : (
            <EmptyState
                icon={<MdDescription />}
                title="NO ANALYSIS"
                description="AI summary unavailable."
                compact={true}
            />
        )}
    </div>
);

const ViewReport = ({ data }) => (
    <div className="space-y-3">
        {data ? (
            <div className="flex items-center justify-between p-3 rounded bg-violet-950/20 border border-violet-500/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-violet-500/20 text-violet-400">
                        <MdFileDownload />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-violet-300 uppercase">Report Generated</div>
                        <div className="text-[10px] text-slate-500">{data.filename || 'report.pdf'}</div>
                    </div>
                </div>
                {data.url && (
                    <a href={data.url} download className="px-3 py-1.5 rounded bg-violet-500/20 hover:bg-violet-500/40 text-violet-300 text-[10px] font-bold uppercase transition-colors border border-violet-500/30">
                        Download
                    </a>
                )}
            </div>
        ) : (
            <EmptyState
                icon={<MdFileDownload />}
                title="NO REPORT"
                description="Report generation pending or failed."
                compact={true}
            />
        )}
    </div>
);

const ViewTech = ({ technologies }) => (
    <div className="space-y-3">
        {technologies.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
                {technologies.map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded bg-black/40 border border-orange-500/20 hover:border-orange-500/40 transition-colors group">
                        <span className="font-semibold text-slate-300 text-sm group-hover:text-orange-300 transition-colors flex-1">{t.name}</span>
                        <span className="text-[10px] text-orange-200/80 font-mono bg-orange-950/30 px-2 py-1 rounded border border-orange-500/10">{t.version}</span>
                    </div>
                ))}
            </div>
        ) : (
            <EmptyState
                icon={<MdCode />}
                title="NO TECH"
                description="No technologies detected."
                compact={true}
            />
        )}
    </div>
);

// --- MAIN CARD ---

const ResultCard = ({ title, data, type }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showRaw, setShowRaw] = useState(false);

    // Extract actual data from backend format
    let extractedData = data;
    let rawOutput = "";

    if (data && typeof data === 'object') {
        if (data.output) {
            extractedData = data.output;
            rawOutput = typeof data.output === 'string' ? data.output : JSON.stringify(data.output, null, 2);
        } else if (data.logs) {
            if (data.logs.output) {
                rawOutput = data.logs.output;
            } else {
                rawOutput = typeof data.logs === 'string' ? data.logs : JSON.stringify(data.logs, null, 2);
            }
        } else {
            rawOutput = JSON.stringify(data, null, 2);
        }
    } else if (typeof data === 'string') {
        extractedData = data;
        rawOutput = data;
    }

    // Parsed Data
    const nmapPorts = (type === 'PortPatrol' && typeof extractedData === 'string') ? parseNmap(extractedData) : [];
    const sherlockAccounts = (type === 'UserHunter' && typeof extractedData === 'string') ? parseSherlock(extractedData) : [];
    const subdomains = type === 'SubdomainSeeker' ? parseSublist3r(rawOutput) : [];
    const technologies = type === 'TechDetective' ? parseTechNmap(rawOutput) : [];
    const vulns = type === 'VulnScanner' ? parseNuclei(rawOutput) : [];

    // Icon
    const getIcon = () => {
        switch (type) {
            case 'PortPatrol': return <MdDns className="w-5 h-5 text-[#06f943]" />;
            case 'UserHunter': return <MdPerson className="w-5 h-5 text-blue-400" />;
            case 'SubdomainSeeker': return <MdPublic className="w-5 h-5 text-purple-400" />;
            case 'TechDetective': return <MdCode className="w-5 h-5 text-orange-400" />;
            case 'VisualRecon': return <MdCamera className="w-5 h-5 text-pink-400" />;
            case 'VulnScanner': return <MdBugReport className="w-5 h-5 text-red-500" />;
            case 'BreachRadar': return <MdRadar className="w-5 h-5 text-yellow-400" />;
            case 'AISummary':
            case 'AIExecutiveSummary': return <MdDescription className="w-5 h-5 text-indigo-400" />;
            case 'ReportGenerator': return <MdFileDownload className="w-5 h-5 text-violet-400" />;
            default: return <MdTerminal className="w-5 h-5 text-slate-400" />;
        }
    };

    // Helper to format title (camelCase to Title Case)
    const formatTitle = (str) => {
        return str
            .replace(/([A-Z])/g, ' $1') // Add space before capitals
            .replace(/^./, (str) => str.toUpperCase()) // Upper first char
            .trim();
    };

    return (
        <div className="glass-panel rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(6,249,67,0.1)] transition-all duration-300 flex flex-col h-full bg-[#0a160d]/80 border border-[#1a2e22]">
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a2e22] bg-black/20">
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded bg-[#06f943]/10 border border-[#06f943]/20 shadow-[0_0_10px_rgba(6,249,67,0.1)]">
                        {getIcon()}
                    </div>
                    <h3 className="font-bold text-slate-100 tracking-tight text-sm uppercase">{formatTitle(title)}</h3>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowRaw(!showRaw); }}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${showRaw ? 'text-[#06f943]' : 'text-slate-500'}`}
                        title="Toggle Raw Data"
                    >
                        <MdCode className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        {isExpanded ? <MdExpandLess className="w-5 h-5" /> : <MdExpandMore className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {isExpanded && (
                <div className="flex-1 overflow-auto scrollbar-custom p-4 bg-transparent max-h-[400px]">
                    <div className="animate-in fade-in duration-300">
                        {showRaw ? (
                            <pre className="text-[10px] font-mono text-slate-400 bg-black/50 p-3 rounded border border-slate-800 whitespace-pre-wrap break-all overflow-x-hidden">
                                {rawOutput || "No raw data available."}
                            </pre>
                        ) : (
                            <>
                                {type === 'PortPatrol' && <ViewPortPatrol ports={nmapPorts} />}
                                {type === 'UserHunter' && <ViewUserHunter accounts={sherlockAccounts} error={rawOutput.includes('Error')} />}
                                {type === 'SubdomainSeeker' && <ViewSubdomain subdomains={subdomains} />}
                                {type === 'TechDetective' && <ViewTech technologies={technologies} />}
                                {type === 'VisualRecon' && <ViewVisual data={data} />}
                                {type === 'VulnScanner' && <ViewVuln vulns={vulns} />}
                                {type === 'BreachRadar' && <ViewBreach data={data} />}
                                {(type === 'AISummary' || type === 'AIExecutiveSummary') && <ViewAI data={data} />}
                                {type === 'ReportGenerator' && <ViewReport data={data} />}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Add MdTimer to imports at the top (I can't edit imports with this call easily without replacing whole file or using multi-replace, but let's see if I can do it in one go with multi-replace or just assume I need to update the card content area. I'll use separate calls if needed or just use MD icon I have already or add it).
// Actually, I should update the imports first or just use an existing icon like MdAccessTime or similar if available, or just MdTimer.
// `MdTerminal` is already imported. I'll use `MdTerminal` for now to avoid import errors, or I can add MdTimer to the import list in a separate chunk.

const ScanResults = ({ results, status, startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    // Define valid tools to prevent system messages or garbage from rendering
    const VALID_TOOLS = [
        'PortPatrol', 'VulnScanner', 'TechDetective', 'SubdomainSeeker',
        'UserHunter', 'VisualRecon', 'BreachRadar', 'AISummary',
        'AIExecutiveSummary', 'ReportGenerator'
    ];

    React.useEffect(() => {
        let interval;
        if (status === 'RUNNING' && startTime) {
            // update immediately
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, startTime]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

    // Aggregate data for Network Map
    const fullData = React.useMemo(() => {
        if (!results) return {};
        const data = { target: 'Target System' }; // Default if unknown

        results.forEach(r => {
            if (r.tool_name === 'Nmap' || r.tool_name === 'PortPatrol') {
                // Try to find target name from Nmap output if possible, or just parse ports
                const parsed = parseNmap(typeof r.result === 'string' ? r.result : (r.result.output || r.result));
                data.nmap_data = { open_ports: parsed };
            }
            if (r.tool_name === 'Sublist3r' || r.tool_name === 'SubdomainSeeker') {
                const raw = typeof r.result === 'string' ? r.result : (r.result.output || r.result);
                data.subdomains = parseSublist3r(raw);
            }
            if (r.tool_name === 'Nuclei' || r.tool_name === 'VulnScanner') {
                const raw = typeof r.result === 'string' ? r.result : (r.result.output || r.result);
                data.nuclei_data = parseNuclei(raw);
            }
            // Capture Target from arguments if available? 
            // We don't have target passed as prop explicitly, but usually it's in the result metadata.
            // For now, we'll rely on the parsed data filling the nodes.
        });
        return data;
    }, [results]);

    if (!results && status !== 'PENDING' && status !== 'RUNNING') return null;

    return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-[#1a2e22] gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${status === 'COMPLETED' ? 'bg-[#06f943] shadow-[0_0_15px_rgba(6,249,67,0.8)]' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide uppercase font-mono">Mission Intelligence</h2>
                        <div className="flex items-center gap-4 mt-0.5">
                            <p className="text-[10px] text-[#06f943] font-mono uppercase tracking-widest opacity-70">Privileged Access Data</p>

                            {/* VIEW TOGGLES */}
                            <div className="flex items-center gap-1 bg-black/40 rounded p-0.5 border border-white/10 ml-4">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-[#06f943] text-black shadow-[0_0_10px_rgba(6,249,67,0.4)]' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <MdTerminal /> Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-[#06f943] text-black shadow-[0_0_10px_rgba(6,249,67,0.4)]' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <MdHub /> Map
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <span className={`px-4 py-1 rounded border text-[10px] font-bold tracking-widest uppercase font-mono ${status === 'COMPLETED' ? 'bg-[#06f943]/10 border-[#06f943]/30 text-[#06f943]' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                    {status}
                </span>
            </div>

            {viewMode === 'map' ? (
                <div className="fade-in">
                    <NetworkMap data={fullData} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {results
                        .filter(res => VALID_TOOLS.includes(res.tool_name) && res.tool_name !== 'System' && res.tool_name !== 'Error')
                        .map((res, idx) => (
                            <ResultCard
                                key={idx}
                                title={res.tool_name}
                                data={res.result}
                                type={res.tool_name}
                            />
                        ))}

                    {status === 'RUNNING' && (
                        <div className="h-64 flex flex-col items-center justify-center border border-[#06f943]/30 rounded-xl bg-[#0a160d]/80 p-8 shadow-[0_0_30px_rgba(6,249,67,0.05)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#06f943]/5 animate-pulse"></div>
                            {/* Grid background for the card */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#06f943 1px, transparent 1px), linear-gradient(90deg, #06f943 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full border-2 border-[#06f943] flex items-center justify-center mb-4 relative shadow-[0_0_20px_rgba(6,249,67,0.2)] bg-black/50">
                                    <div className="absolute inset-0 rounded-full border border-[#06f943] animate-ping opacity-20"></div>
                                    <span className="font-mono text-2xl font-bold text-white shadow-black drop-shadow-lg">{formatTime(elapsed)}</span>
                                </div>

                                <span className="text-xs font-mono text-[#06f943] uppercase tracking-widest font-bold mb-2">Scan In Progress</span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    <span className="w-1.5 h-1.5 bg-[#06f943] rounded-full animate-blink"></span>
                                    Gathering Intelligence...
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScanResults;
