import React, { useState, useEffect } from 'react';
import { MdMyLocation, MdGridView, MdNetworkCheck, MdBugReport, MdLanguage, MdTravelExplore, MdCamera, MdRadar, MdPsychology, MdDescription, MdBolt, MdLayers, MdTune } from 'react-icons/md';
import { validateTarget } from '../utils/validators';

const ScanForm = ({ onScanStart, isLoading }) => {
    const [target, setTarget] = useState('');
    const [hasPermission, setHasPermission] = useState(false);
    const [validation, setValidation] = useState({ valid: true, message: '' });
    const [scanMode, setScanMode] = useState('full'); // quick, full, custom

    // Module State
    const [selectedModules, setSelectedModules] = useState({
        'PortPatrol': true,
        'UserHunter': true,
        'SubdomainSeeker': true,
        'TechDetective': true,
        'VisualRecon': true,
        'VulnScanner': true,
        'BreachRadar': true,
        'AIExecutiveSummary': true,
        'ReportGenerator': true
    });

    const modules = [
        { id: 'PortPatrol', name: 'Port Patrol', icon: <MdNetworkCheck />, category: 'RECON', desc: 'Active port scanning & service enumeration.' },
        { id: 'SubdomainSeeker', name: 'Subdomain Seeker', icon: <MdTravelExplore />, category: 'RECON', desc: 'DNS enumeration & subdomain discovery.' },
        { id: 'TechDetective', name: 'Tech Detective', icon: <MdLanguage />, category: 'RECON', desc: 'Stack analysis & framework detection.' },
        { id: 'VisualRecon', name: 'Visual Recon', icon: <MdCamera />, category: 'RECON', desc: 'Headless browser screenshots.' },
        { id: 'UserHunter', name: 'User Hunter', icon: <MdRadar />, category: 'OSINT', desc: 'Social media & identity cross-referencing.' },
        { id: 'BreachRadar', name: 'Breach Radar', icon: <MdRadar />, category: 'OSINT', desc: 'Public breach database lookup.' },
        { id: 'VulnScanner', name: 'Vuln Scanner', icon: <MdBugReport />, category: 'ATTACK', desc: 'CVE vulnerability assessment (Nuclei).' },
        { id: 'AIExecutiveSummary', name: 'AI Analyzer', icon: <MdPsychology />, category: 'INTEL', desc: 'LLM-based risk assessment & reporting.' },
    ];

    // Presets Logic
    const PRESETS = {
        quick: {
            label: 'Quick Recon',
            icon: <MdBolt />,
            modules: ['PortPatrol', 'TechDetective', 'SubdomainSeeker'],
            desc: 'Fast, lightweight enumeration.'
        },
        full: {
            label: 'Deep Parametric',
            icon: <MdLayers />,
            modules: ['PortPatrol', 'SubdomainSeeker', 'TechDetective', 'VisualRecon', 'UserHunter', 'BreachRadar', 'VulnScanner', 'AIExecutiveSummary', 'ReportGenerator'],
            desc: 'Comprehensive full-spectrum analysis.'
        },
        custom: {
            label: 'Manual Override',
            icon: <MdTune />,
            modules: [],
            desc: 'Operator-defined mission profile.'
        }
    };

    // Apply Preset
    const applyPreset = (mode) => {
        setScanMode(mode);
        if (mode === 'custom') return; // Keep current selection

        const targetModules = PRESETS[mode].modules;
        const newSelection = {};
        Object.keys(selectedModules).forEach(k => {
            newSelection[k] = targetModules.includes(k);
        });
        setSelectedModules(newSelection);
    };

    // Handle Manual Toggle
    const toggleModule = (moduleId) => {
        setScanMode('custom'); // Switch to custom if user manually toggles
        setSelectedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    // Validation Effect
    useEffect(() => {
        if (target.trim()) {
            setValidation(validateTarget(target));
        } else {
            setValidation({ valid: true, message: '' });
        }
    }, [target]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validation.valid || !hasPermission || !target.trim()) return;

        const selected = Object.entries(selectedModules).filter(([_, v]) => v).map(([k, _]) => k);
        // Map our UI preset names to backend expected types if needed, or just send 'custom' with list
        // Backend handles 'full' specially? Let's check schema. Schema has 'full' or 'custom'.
        // If we send 'full', backend might ignore module list. So safer to send 'custom' with full list if not 'full' preset?
        // Actually, if preset is 'full', send 'full'. If 'quick', likely 'custom' + modules.

        let apiScanType = 'custom';
        if (scanMode === 'full') apiScanType = 'full';

        onScanStart({
            target: target.trim(),
            scan_type: apiScanType,
            has_permission: hasPermission,
            modules: selected
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-10 animate-in fade-in duration-500">
            {/* 1. Target Scope */}
            <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1a2e22] pb-2">
                    <h3 className="text-primary font-mono text-lg font-bold tracking-wider flex items-center gap-2">
                        <MdMyLocation /> TARGET_DESIGNATION
                    </h3>
                    <span className="text-[10px] text-primary/50 font-mono">STEP 01 // IDENTIFY</span>
                </div>

                <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-lg blur opacity-25 group-focus-within:opacity-75 transition duration-1000`}></div>
                    <div className="relative flex items-center bg-black border border-[#1a2e22] rounded-lg overflow-hidden group-focus-within:border-primary/50 transition-colors">
                        <div className="w-12 h-14 flex items-center justify-center bg-[#0a160d] border-r border-[#1a2e22] text-primary/50">
                            <MdMyLocation className="text-xl" />
                        </div>
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="ENTER HOSTNAME OR IP (e.g. target.com)"
                            disabled={isLoading}
                            className="w-full bg-transparent text-white font-mono h-14 px-4 focus:outline-none placeholder-slate-700 uppercase tracking-wider"
                            autoComplete="off"
                        />
                        {/* Validation Indicator */}
                        <div className="pr-4">
                            {target && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border whitespace-nowrap ${validation.valid ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {validation.message || (validation.valid ? 'RESOLVED' : 'INVALID')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Authorization */}
                <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${hasPermission ? 'border-primary bg-primary' : 'border-slate-600 bg-transparent group-hover:border-slate-400'}`}>
                        {hasPermission && <MdBolt className="text-black text-sm" />}
                    </div>
                    <input type="checkbox" checked={hasPermission} onChange={e => setHasPermission(e.target.checked)} className="hidden" disabled={isLoading} />
                    <span className="text-xs text-slate-400 font-mono group-hover:text-slate-200 transition-colors">
                        I CERTIFY AUTHORIZATION to enable offensive modules against this target.
                    </span>
                </label>
            </section>

            {/* 2. Mission Profile (Presets) */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#1a2e22] pb-2">
                    <h3 className="text-primary font-mono text-lg font-bold tracking-wider flex items-center gap-2">
                        <MdTune /> MISSION_PROFILE
                    </h3>
                    <span className="text-[10px] text-primary/50 font-mono">STEP 02 // CONFIGURE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => applyPreset(key)}
                            disabled={isLoading}
                            className={`relative text-left p-4 rounded-lg border transition-all duration-300 group overflow-hidden ${scanMode === key ? 'bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(6,249,67,0.1)]' : 'bg-transparent border-[#1a2e22] text-slate-500 hover:border-slate-600'}`}
                        >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className={`text-2xl ${scanMode === key ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'}`}>{preset.icon}</span>
                                {scanMode === key && <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(6,249,67,0.8)]"></span>}
                            </div>
                            <div className="relative z-10">
                                <div className="font-bold text-sm tracking-wider uppercase mb-1">{preset.label}</div>
                                <div className="text-[10px] opacity-70 leading-relaxed font-mono">{preset.desc}</div>
                            </div>
                            {/* Background decoration */}
                            {scanMode === key && <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-bl-full blur-xl transform translate-x-4 -translate-y-4"></div>}
                        </button>
                    ))}
                </div>
            </section>

            {/* 3. Module Selection (Visual) */}
            <section className={`space-y-4 transition-all duration-500 ${scanMode === 'full' ? 'opacity-80 grayscale' : 'opacity-100'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {modules.map(module => (
                        <label key={module.id} className={`
                             cursor-pointer border rounded flex items-center gap-3 p-3 transition-all relative overflow-hidden group
                             ${selectedModules[module.id] ? 'bg-[#0a160d] border-primary/30 text-slate-200' : 'bg-transparent border-[#1a2e22] text-slate-600'}
                             ${scanMode === 'full' ? 'pointer-events-none' : ''}
                         `}>
                            <div className={`p-2 rounded bg-black border ${selectedModules[module.id] ? 'border-primary/20 text-primary' : 'border-slate-800 text-slate-700'}`}>
                                {module.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold uppercase tracking-wider truncate">{module.name}</div>
                                <div className="text-[9px] font-mono opacity-50">{module.category}</div>
                            </div>

                            <input type="checkbox" checked={selectedModules[module.id]} onChange={() => toggleModule(module.id)} className="hidden" />

                            {/* Selected Indicator */}
                            {selectedModules[module.id] && <div className="absolute top-0 right-0 w-2 h-full bg-primary/20 blur-sm"></div>}
                        </label>
                    ))}
                </div>
            </section>

            {/* Action */}
            <div className="border-t border-[#1a2e22] pt-6 flex justify-end">
                <button
                    type="submit"
                    disabled={!target.trim() || !hasPermission || !validation.valid || isLoading}
                    className={`
                        relative px-8 py-4 bg-primary text-black font-bold font-mono tracking-widest uppercase rounded
                        hover:bg-[#04c234] disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-[0_0_20px_rgba(6,249,67,0.4)] hover:shadow-[0_0_35px_rgba(6,249,67,0.6)]
                        transition-all duration-300 transform active:scale-95
                        flex items-center gap-3 overflow-hidden
                    `}
                >
                    {isLoading ? (
                        <>
                            <MdRadar className="animate-spin text-xl" />
                            DEPLOYING AGENTS...
                        </>
                    ) : (
                        <>
                            <MdRadar className="text-xl" />
                            INITIATE SCAN_SEQUENCE
                        </>
                    )}
                    {/* Glare effect */}
                    <div className="absolute inset-0 bg-white/20 -translate-x-full hover:animate-[shimmer_1s_infinite] skew-x-12"></div>
                </button>
            </div>
        </form>
    );
};

export default ScanForm;
