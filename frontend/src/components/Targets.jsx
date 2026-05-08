import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { useToast } from '../context/ToastContext';
import {
    FaBullseye, FaPlus, FaTrash, FaFilePdf,
    FaShieldAlt, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';
import { MdOutlineRadar } from "react-icons/md";
import { SiKalilinux } from "react-icons/si";
import ConfirmationModal from './ConfirmationModal';
import EmptyState from './EmptyState';

const Targets = () => {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTarget, setNewTarget] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const { addToast } = useToast();

    // Updated API URL to avoid collision with frontend routes
    const API_URL = '/api/backend';

    // Fetch targets
    const fetchTargets = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`${API_URL}/targets`);
            setTargets(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || err.message);
            addToast("Failed to fetch targets", 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, []);

    // Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetName: null });

    const promptDelete = (targetName) => {
        setDeleteModal({ isOpen: true, targetName });
    };

    const confirmDelete = async () => {
        const { targetName } = deleteModal;
        if (!targetName) return;

        try {
            await axios.delete(`${API_URL}/targets/${targetName}`);
            setTargets(targets.filter(t => t.target !== targetName));
            addToast(`Target ${targetName} deleted`, 'success');
        } catch (err) {
            addToast(err.response?.data?.detail || err.message, 'error');
        } finally {
            setDeleteModal({ isOpen: false, targetName: null });
        }
    };

    const handleGenerateReport = async (taskId) => {
        if (!taskId) return;
        try {
            await axios.post(`${API_URL}/scan/${taskId}/report`);
            addToast("Report generation initiated. It will be ready shortly.", 'success');
        } catch (err) {
            console.error(err);
            addToast("Failed to initiate report generation", 'error');
        }
    };

    const handleAddTarget = async (e) => {
        e.preventDefault();
        if (!newTarget.trim()) return;
        setIsAdding(true);

        try {
            // "Adding" a target means initializing a passive scan
            // Include ReportGenerator and AIExecutiveSummary for immediate value
            await axios.post(`${API_URL}/scan`, {
                target: newTarget,
                scan_type: 'passive',
                modules: ['subdomain_seeker', 'AIExecutiveSummary', 'ReportGenerator'],
                has_permission: true
            });

            setNewTarget('');
            setShowAddModal(false);
            addToast(`Target ${newTarget} added successfully`, 'success');
            // Refresh list - might take a moment to appear
            setTimeout(fetchTargets, 1000);
        } catch (err) {
            addToast(err.response?.data?.detail || err.message, 'error');
        } finally {
            setIsAdding(false);
        }
    };

    // Theme-compliant risk colors
    const getRiskColor = (score) => {
        if (!score || score === 'UNKNOWN') return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
        if (score === 'CRITICAL') return 'text-red-500 border-red-500/30 bg-red-500/10';
        if (score === 'HIGH') return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
        if (score === 'MEDIUM') return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
        return 'text-primary border-primary/30 bg-primary/10';
    };

    return (
        <div className="flex flex-col gap-8 fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-dark pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <MdOutlineRadar className="text-primary" />
                        Target Management
                    </h2>
                    <p className="text-gray-400 mt-1 text-sm font-mono">
                        ACTIVE SURVEILLANCE & SYSTEM INVENTORY
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary group"
                >
                    <FaPlus className="group-hover:rotate-90 transition-transform" />
                    Add Target
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-primary"><FaBullseye size={60} /></div>
                    <div className="p-3 bg-primary/20 rounded-lg text-primary"><FaBullseye size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Active Targets</p>
                        <p className="text-3xl font-bold text-white mt-1">{targets.length}</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><FaExclamationTriangle size={60} /></div>
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><FaExclamationTriangle size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Critical Risks</p>
                        <p className="text-3xl font-bold text-white mt-1">
                            {targets.filter(t => t.risk_score === 'CRITICAL' || t.risk_score === 'HIGH').length}
                        </p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400"><FaCheckCircle size={60} /></div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><FaCheckCircle size={24} /></div>
                    <div>
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">System Status</p>
                        <p className="text-lg font-bold text-emerald-400 font-mono mt-1">OPERATIONAL</p>
                    </div>
                </div>
            </div>

            {/* Target Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-primary font-mono text-sm animate-pulse">Scanning Database...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-900/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-center">
                    ERROR FETCHING TARGETS: {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {targets.map((t) => (
                        <div key={t.target} className="glass-panel p-0 rounded-xl hover:shadow-[0_0_20px_rgba(6,249,67,0.1)] transition-all duration-300 group relative">
                            {/* Header Section */}
                            <div className="p-6 flex justify-between items-start border-b border-border-dark/50 bg-black/20">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded bg-card-dark flex items-center justify-center border border-border-dark group-hover:border-primary/50 transition-colors">
                                        <SiKalilinux className="text-2xl text-gray-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors tracking-wide font-mono">{t.target}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                                                Last Scan: {t.last_scan_at ? new Date(t.last_scan_at).toLocaleDateString() : 'NEVER'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Badge */}
                                <div className={`px-3 py-1 rounded text-[10px] font-bold font-mono border ${getRiskColor(t.risk_score)}`}>
                                    {t.risk_score}
                                </div>
                            </div>

                            {/* Data Body */}
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Total Scans</p>
                                    <p className="text-xl font-mono text-white">{t.total_scans}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Latest Report</p>
                                    <p className={`text-xs font-mono font-bold ${t.latest_report_path ? 'text-primary' : 'text-gray-600'}`}>
                                        {t.latest_report_path ? 'AVAILABLE' : 'PENDING/NONE'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-4 bg-black/20 border-t border-border-dark/50 flex gap-3">
                                {t.latest_report_path ? (
                                    <a
                                        href={`/scans/${t.latest_report_path.split('/').pop()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-card-dark hover:bg-border-dark/30 text-gray-300 text-xs font-bold uppercase tracking-wider transition-colors border border-border-dark hover:text-white hover:border-primary/30"
                                    >
                                        <FaFilePdf className="text-red-400" /> View Report
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => handleGenerateReport(t.latest_scan_id)}
                                        disabled={!t.latest_scan_id}
                                        className="flex-1 py-2 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={t.latest_scan_id ? "Generate Report for latest scan" : "Run a scan first"}
                                    >
                                        {t.latest_scan_id ? "Generate Report" : "No Scan Data"}
                                    </button>
                                )}

                                <button
                                    onClick={() => promptDelete(t.target)}
                                    className="px-4 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors flex items-center justify-center"
                                    title="Delete Target"
                                >
                                    <FaTrash className="text-sm" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {targets.length === 0 && (
                        <div className="col-span-full">
                            <EmptyState
                                icon={<FaBullseye />}
                                title="NO TARGETS MONITORED"
                                description="Initiate surveillance to begin data collection and analysis."
                                action={{
                                    label: "Initialize Target",
                                    onClick: () => setShowAddModal(true),
                                    icon: <FaPlus />
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Add Target Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content border border-primary/30 relative">
                        <div className="p-6 border-b border-border-dark bg-black/40 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
                                <FaPlus className="text-primary" /> NEW TARGET INITIATION
                            </h2>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                            </div>
                        </div>

                        <form onSubmit={handleAddTarget} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-primary font-mono mb-2 uppercase tracking-widest">Target Domain / IP</label>
                                <input
                                    type="text"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    placeholder="e.g. example.com"
                                    className="w-full bg-[#0a160d] border border-border-dark rounded p-4 text-white font-mono focus:border-primary focus:outline-none transition-colors placeholder-gray-700"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-mono">
                                    <FaShieldAlt /> Initial passive reconnaissance will differ.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded border border-border-dark text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-mono font-bold uppercase tracking-wider"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdding || !newTarget.trim()}
                                    className="flex-1 btn-primary font-mono uppercase tracking-wider"
                                >
                                    {isAdding ? 'INITIALIZING...' : 'CONFIRM TARGET'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, targetName: null })}
                onConfirm={confirmDelete}
                title="Delete Target"
                message={`Are you sure you want to delete ${deleteModal.targetName}? This will permanently purge all associated scan data and reports.`}
                confirmText="Terminate Target"
                isDangerous={true}
            />
        </div>
    );
};

export default Targets;

