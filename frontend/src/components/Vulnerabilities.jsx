import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { MdBugReport, MdExpandMore, MdExpandLess, MdInfo, MdSecurity, MdWarning, MdSafetyCheck } from 'react-icons/md';
import EmptyState from './EmptyState';

const Vulnerabilities = () => {
    const [vulns, setVulns] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVulns = async () => {
        try {
            const res = await apiClient.get('/vulnerabilities');
            if (Array.isArray(res.data)) {
                setVulns(res.data);
            } else {
                console.error("Expected array from API, got:", res.data);
                setVulns([]); // Fallback to empty array
            }
        } catch (err) {
            console.error("Failed to fetch vulnerabilities:", err);
            setVulns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVulns();
    }, []);

    // Helper to parse Nuclei JSON outputs
    const parseVulns = (output) => {
        if (!output) return [];

        const parsed = [];
        const uniqueKeys = new Set(); // For deduplication

        try {
            // Try separating by newlines first (JSONL format)
            const lines = output.split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                try {
                    const data = JSON.parse(line);
                    // Standard Nuclei JSON format
                    if (data.template || data['template-id']) {
                        const id = data['template-id'] || data.template;
                        const matched = data['matched-at'] || data.host;
                        const key = `${id}-${matched}`; // Unique key based on ID + URL

                        if (!uniqueKeys.has(key)) {
                            uniqueKeys.add(key);
                            parsed.push({
                                id: id,
                                name: data.info?.name,
                                severity: data.info?.severity || 'info',
                                url: matched,
                                type: data.type,
                                description: data.info?.description,
                                original: data
                            });
                        }
                    }
                } catch (e) {
                    // Try legacy regex fallback for this line if JSON parse fails
                }
            });
            if (parsed.length > 0) return parsed;
        } catch (e) { }

        const API_URL = import.meta.env.VITE_API_URL || '/api/backend';
        // Fallback: Global Regex match on entire output
        const regex = /\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)/g;
        let match;
        while ((match = regex.exec(output)) !== null) {
            const key = `${match[1]}-${match[4]}`;
            if (!uniqueKeys.has(key)) {
                uniqueKeys.add(key);
                parsed.push({
                    id: match[1],
                    protocol: match[2],
                    severity: match[3],
                    url: match[4]
                });
            }
        }
        return parsed;
    };

    if (loading) return <div className="p-8 text-center text-[#06f943] animate-pulse font-mono">Scanning Threat Database...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 fade-in pb-20">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 font-mono tracking-tight flex items-center gap-3">
                    <MdSecurity className="text-[#06f943]" />
                    Threat Intelligence
                </h1>
                <p className="text-slate-400 max-w-2xl">
                    Aggregated security findings from all recent operations. High-risk vulnerabilities require immediate attention.
                </p>
            </div>

            <div className="space-y-6">
                {vulns.length === 0 ? (
                    <EmptyState
                        icon={<MdSafetyCheck className="text-emerald-500" />}
                        title="SYSTEM SECURE"
                        description="No critical vulnerabilities detected in recent scans."
                    />
                ) : (
                    vulns.map((v, i) => {
                        // Check for explicit error in result
                        if (v.result && v.result.error) {
                            return (
                                <div key={i} className="p-5 border-l-4 border-l-orange-500 rounded-lg bg-orange-950/10 border border-orange-500/20 mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <MdWarning className="text-orange-500 w-6 h-6" />
                                        <h3 className="font-bold text-slate-200">Scanner Error: {v.target}</h3>
                                    </div>
                                    <p className="text-sm text-slate-400 font-mono mb-2">The vulnerability scanner encountered a problem.</p>
                                    <details className="bg-black/30 p-3 rounded border border-slate-800">
                                        <summary className="text-xs text-orange-400 cursor-pointer font-bold select-none">View Error Logs &gt;</summary>
                                        <pre className="mt-2 text-[10px] text-slate-500 font-mono whitespace-pre-wrap">
                                            {typeof v.result.logs === 'string' ? v.result.logs : JSON.stringify(v.result)}
                                        </pre>
                                    </details>
                                </div>
                            );
                        }

                        // Extract output string if it's wrapped in an object
                        const rawOutput = v.result && v.result.output ? v.result.output : v.result;
                        const content = parseVulns(typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput));

                        if (content.length === 0) return null; // Skip empty results

                        return (
                            <VulnCard
                                key={i}
                                vulns={content}
                                date={v.created_at}
                                target={v.target || "Unknown Target"}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

const VulnCard = ({ vulns, date, target }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const criticalCount = vulns.filter(v => v.severity === 'critical' || v.severity === 'high').length;

    return (
        <div className="glass-panel border-l-4 border-l-red-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            {/* Header */}
            <div
                className="p-5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-red-950/30 to-transparent"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <MdBugReport className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                                {criticalCount > 0 ? 'Potential Risk' : 'Security Notice'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                                {new Date(date).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-200 font-mono tracking-wide">
                            {target} <span className="text-slate-500 text-sm font-sans font-normal ml-2">({vulns.length} Issues)</span>
                        </h3>
                    </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                    {isExpanded ? <MdExpandLess className="w-6 h-6" /> : <MdExpandMore className="w-6 h-6" />}
                </button>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-slate-800 bg-black/20">
                    {vulns.map((item, idx) => (
                        <div key={idx} className="p-4 border-b border-slate-800/50 last:border-0 hover:bg-white/5 transition-colors group">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-bold text-slate-300 font-mono group-hover:text-white transition-colors">
                                        {item.name || item.id}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono mt-1 break-all">
                                        {item.url}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                            {item.type || 'vuln'}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${item.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                    item.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/50' :
                                        item.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    }`}>
                                    {item.severity}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Vulnerabilities;
