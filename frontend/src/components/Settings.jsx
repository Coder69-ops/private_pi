import React, { useState, useEffect } from 'react';
import { MdSettings, MdSecurity, MdNotifications, MdColorLens, MdStorage, MdLanguage, MdPerson, MdFingerprint, MdHistory, MdVpnKey, MdCheckCircle, MdLogout } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/apiClient';
const API_URL = import.meta.env.VITE_API_URL || '/api/backend';

const Settings = () => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        shodan_api_key: '',
        hibp_api_key: '',
        openrouter_api_key: '',
        openrouter_model: 'google/gemini-2.0-flash-exp:free',
        stealth_mode: false,
        auto_pdf_report: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('account');

    const tabs = [
        { id: 'account', label: 'Account Details', icon: <MdPerson className="text-xl" /> },
        { id: 'security', label: 'API Keys & Access', icon: <MdSecurity className="text-xl" /> },
        { id: 'notifications', label: 'Notifications', icon: <MdNotifications className="text-xl" /> },
        { id: 'appearance', label: 'Appearance', icon: <MdColorLens className="text-xl" /> },
        { id: 'data', label: 'Data Management', icon: <MdStorage className="text-xl" /> }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await apiClient.get('/settings');
            setFormData(response.data);
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await apiClient.post('/settings', formData);
            setMessage({ type: 'success', text: 'Settings saved successfully' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Failed to save settings", error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="flex flex-col gap-8 fade-in">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Navigation for Settings */}
                {/* Sidebar Navigation for Settings */}
                <div className="glass-panel p-4 rounded-xl h-fit overflow-hidden bg-black/40 border-slate-800">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-4 py-4 rounded-r-lg transition-all whitespace-nowrap text-sm font-medium border-l-2
                                    ${activeTab === tab.id
                                        ? 'bg-primary/5 text-white border-primary shadow-[inset_10px_0_20px_rgba(6,249,67,0.02)]'
                                        : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <span className={`${activeTab === tab.id ? 'text-primary' : 'opacity-50'}`}>{tab.icon}</span>
                                <span className="tracking-wide uppercase font-mono text-xs">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Settings Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Account Details Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 fade-in">
                            {/* Identity Card */}
                            <div className="glass-panel p-0 rounded-xl overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
                                <div className="p-8 relative z-10">
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-xl bg-black border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(6,249,67,0.1)] group-hover:border-primary/60 transition-colors">
                                                {currentUser?.photoURL ? (
                                                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <MdPerson className="text-5xl text-primary/50" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-black border border-primary/30 p-1.5 rounded-lg shadow-lg">
                                                <MdCheckCircle className="text-primary text-xl" />
                                            </div>
                                        </div>

                                        <div className="text-center md:text-left flex-1">
                                            <h3 className="text-2xl font-bold text-white tracking-wider font-mono mb-1">
                                                {currentUser?.displayName || 'OPERATOR'}
                                            </h3>
                                            <p className="text-primary text-sm font-mono mb-4">{currentUser?.email}</p>

                                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                                <span className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                                                    Level 5 Access
                                                </span>
                                                <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                                                    Ops Team
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-4"></div>

                                        <div className="grid grid-cols-1 gap-4 min-w-[200px]">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                                                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">ACTIVE</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500 uppercase tracking-wider">Clearance</span>
                                                <span className="text-xs text-slate-300 font-mono">ALPHA-1</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-slate-500 uppercase tracking-wider">Region</span>
                                                <span className="text-xs text-slate-300 font-mono">US-EAST</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative bg elements */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                            </div>

                            {/* Session Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="glass-panel p-5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <MdFingerprint className="text-xl text-purple-400" />
                                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Digital Fingerprint</h4>
                                    </div>
                                    <div className="font-mono text-xs text-slate-500 bg-black/40 p-3 rounded border border-white/5 break-all">
                                        {currentUser?.uid || 'Loading...'}
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <MdHistory className="text-xl text-blue-400" />
                                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Last Connection</h4>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-300 font-mono">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 uppercase">Synchronized with Mainframe</div>
                                </div>
                                <div className="glass-panel p-5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <MdVpnKey className="text-xl text-orange-400" />
                                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Session Security</h4>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-emerald-400">ENCRYPTED (AES-256)</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 pl-4">192.168.1.X (Protected)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab (API Keys + Settings) */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 fade-in">
                            <div className="glass-panel p-6 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <MdSecurity className="text-primary" /> API Configuration
                                    </h3>
                                    <div className="text-xs text-slate-500 font-mono px-2 py-1 bg-black/30 rounded border border-white/5">
                                        SECURE STORAGE ACTIVE
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {message && (
                                        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                            {message.type === 'success' ? <MdCheckCircle className="text-xl" /> : <MdSecurity className="text-xl" />}
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-5">
                                        <label className="block bg-black/20 p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-colors group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                                                    Shodan API Key
                                                    {formData.shodan_api_key && <MdCheckCircle className="text-emerald-500 text-xs" />}
                                                </span>
                                                <span className="text-[10px] text-slate-600 uppercase tracking-wider group-hover:text-primary/70 transition-colors">Reconnaissance</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    name="shodan_api_key"
                                                    value={formData.shodan_api_key || ''}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/50 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono placeholder:text-slate-700"
                                                    placeholder="Enter verified API Key..."
                                                />
                                            </div>
                                        </label>

                                        <label className="block bg-black/20 p-4 rounded-lg border border-white/5 hover:border-primary/30 transition-colors group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                                                    HaveIBeenPwned API Key
                                                    {formData.hibp_api_key && <MdCheckCircle className="text-emerald-500 text-xs" />}
                                                </span>
                                                <span className="text-[10px] text-slate-600 uppercase tracking-wider group-hover:text-primary/70 transition-colors">Breach Data</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    name="hibp_api_key"
                                                    value={formData.hibp_api_key || ''}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/50 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono placeholder:text-slate-700"
                                                    placeholder="Enter verified API Key..."
                                                />
                                            </div>
                                        </label>

                                        <div className="relative p-5 rounded-lg border border-emerald-500/20 bg-emerald-950/5">
                                            <div className="absolute top-0 right-0 p-2">
                                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold tracking-wider">RECOMMENDED ENGINE</span>
                                            </div>
                                            <label className="block mt-2">
                                                <span className="text-emerald-600 font-bold text-sm mb-2 flex items-center gap-2">
                                                    OpenRouter API Key
                                                    {formData.openrouter_api_key && <MdCheckCircle className="text-emerald-500 text-xs" />}
                                                </span>
                                                <input
                                                    type="password"
                                                    name="openrouter_api_key"
                                                    value={formData.openrouter_api_key || ''}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/50 border border-emerald-500/30 text-emerald-100 text-sm rounded px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono placeholder:text-emerald-900/50"
                                                    placeholder="sk-or-..."
                                                />
                                                <p className="text-[11px] text-emerald-600/70 mt-1.5 flex justify-between">
                                                    <span>Required for Executive Summaries & Mitigation Strategies.</span>
                                                    <a href="https://openrouter.ai" target="_blank" className="hover:text-emerald-400 hover:underline">Get Key &rarr;</a>
                                                </p>
                                            </label>

                                            <label className="block mt-4 pt-4 border-t border-emerald-500/10">
                                                <span className="text-slate-500 text-xs font-semibold mb-1.5 block">AI Model Configuration</span>
                                                <input
                                                    type="text"
                                                    name="openrouter_model"
                                                    value={formData.openrouter_model || ''}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/30 border border-slate-700/50 text-slate-400 text-xs rounded px-3 py-2 focus:outline-none focus:border-slate-500 transition-all font-mono"
                                                    placeholder="e.g. google/gemini-pro"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* General Preferences moved inside Security Tab for now or keep separate? 
                                The original code had separate panels. I'll keep the second panel here but styled better. 
                            */}
                            <div className="glass-panel p-6 rounded-xl border border-slate-800">
                                <h3 className="text-base font-bold text-slate-300 mb-4 flex items-center gap-2">
                                    <MdLanguage className="text-slate-500" /> System Preferences
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-slate-800 cursor-pointer hover:bg-white/5 transition-colors group">
                                        <div>
                                            <div className="font-medium text-slate-200 text-sm group-hover:text-white transition-colors">Advanced Stealth Mode</div>
                                            <div className="text-[11px] text-slate-500 group-hover:text-slate-400">Increase scan duration to evade basic WAF detection</div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="stealth_mode"
                                                checked={formData.stealth_mode}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                                        </div>
                                    </label>
                                    <label className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-slate-800 cursor-pointer hover:bg-white/5 transition-colors group">
                                        <div>
                                            <div className="font-medium text-slate-200 text-sm group-hover:text-white transition-colors">Auto-Generate PDF Reports</div>
                                            <div className="text-[11px] text-slate-500 group-hover:text-slate-400">Compile executive summary immediately after scan completion</div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="auto_pdf_report"
                                                checked={formData.auto_pdf_report}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                                        </div>
                                    </label>

                                    <div className="flex justify-end pt-4 border-t border-slate-800 mt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-black font-bold text-xs rounded transition-all shadow-[0_0_15px_rgba(6,249,67,0.3)] hover:shadow-[0_0_25px_rgba(6,249,67,0.5)] tracking-widest uppercase flex items-center gap-2"
                                        >
                                            {saving ? 'Saving...' : 'Save Configuration'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder Tabs */}
                    {activeTab === 'notifications' && (
                        <div className="glass-panel p-12 rounded-xl text-center fade-in">
                            <MdNotifications className="text-6xl text-gray-700 mx-auto mb-4" />
                            <h3 className="text-xl text-gray-400 font-mono">Notification Center Offline</h3>
                            <p className="text-gray-500 mt-2">Connecting to messaging relay...</p>
                        </div>
                    )}
                    {activeTab === 'appearance' && (
                        <div className="glass-panel p-12 rounded-xl text-center fade-in">
                            <MdColorLens className="text-6xl text-gray-700 mx-auto mb-4" />
                            <h3 className="text-xl text-gray-400 font-mono">Theme Override Locked</h3>
                            <p className="text-gray-500 mt-2">System locked to <span className="text-primary">CYBER_GREEN</span> protocol.</p>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="glass-panel p-12 rounded-xl text-center fade-in">
                            <MdStorage className="text-6xl text-gray-700 mx-auto mb-4" />
                            <h3 className="text-xl text-gray-400 font-mono">Data Archives Encrypted</h3>
                            <p className="text-gray-500 mt-2">Export functionality requires Level 6 clearance.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;
