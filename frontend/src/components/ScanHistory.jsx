import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { MdHistory, MdSearch, MdFilterList, MdCheckCircle, MdError, MdHourglassEmpty, MdChevronRight, MdExpandMore, MdDelete, MdRadar } from 'react-icons/md';
import ScanResults from './ScanResults';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import EmptyState from './EmptyState';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api/backend';


const ScanHistory = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedScanId, setExpandedScanId] = useState(null);
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, scanId: null, target: null });

    useEffect(() => {
        const fetchScans = async () => {
            try {
                const response = await apiClient.get(`${API_URL}/scans`);
                // Sort by date desc
                const sorted = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setScans(sorted);
            } catch (error) {
                console.error("Error fetching scans:", error);
                addToast("Failed to fetch scan history", 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchScans();
    }, []);

    const toggleExpand = (id) => {
        setExpandedScanId(expandedScanId === id ? null : id);
    };

    const confirmDelete = async () => {
        const { scanId } = deleteModal;
        if (!scanId) return;

        try {
            await apiClient.delete(`${API_URL}/scans/${scanId}`);
            setScans(scans.filter(s => s.id !== scanId));
            addToast("Scan record deleted", 'success');
        } catch (error) {
            console.error("Error deleting scan:", error);
            addToast("Failed to delete scan", 'error');
        } finally {
            setDeleteModal({ isOpen: false, scanId: null, target: null });
        }
    };

    const promptDelete = (e, scan) => {
        e.stopPropagation(); // Prevent row expansion
        setDeleteModal({ isOpen: true, scanId: scan.id, target: scan.target });
    };

    const getStatusBadge = (status) => {
        const styles = {
            COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
            PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            RUNNING: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
                {status}
            </span>
        );
    };

    const filteredScans = scans.filter(scan =>
        scan.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.id?.includes(searchTerm)
    );

    return (
        <div className="flex flex-col gap-8 fade-in h-full">
            <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col min-h-0">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by target or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a160d] border border-border-dark rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary font-mono placeholder-gray-600 transition-all focus:ring-1 focus:ring-primary"
                        />
                        <MdSearch className="absolute left-3 top-2.5 text-gray-500 text-lg" />
                    </div>
                    <button className="btn-secondary whitespace-nowrap">
                        <MdFilterList /> Filter
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-auto scrollbar-custom flex-1">
                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0a160d] z-10 shadow-lg shadow-black/20">
                            <tr className="border-b border-border-dark/50 text-[#8ecc9e] text-xs font-mono uppercase tracking-wider">
                                <th className="p-4">SCAN ID</th>
                                <th className="p-4">TARGET</th>
                                <th className="p-4">TYPE</th>
                                <th className="p-4">STATUS</th>
                                <th className="p-4">DATE</th>
                                <th className="p-4 text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a2e22]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 font-mono">Loading history...</td>
                                </tr>
                            ) : filteredScans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-4">
                                        <EmptyState
                                            icon={<MdHistory />}
                                            title="NO SCAN HISTORY"
                                            description={searchTerm ? "No scans match your search criteria." : "No operations recorded."}
                                            action={!searchTerm ? {
                                                label: "New Scan",
                                                onClick: () => navigate('/scan'),
                                                icon: <MdRadar />
                                            } : null}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredScans.map(scan => (
                                    <React.Fragment key={scan.id}>
                                        <tr
                                            onClick={() => toggleExpand(scan.id)}
                                            className={`cursor-pointer transition-colors group ${expandedScanId === scan.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                                        >
                                            <td className="p-4 text-xs font-mono text-gray-500 group-hover:text-primary transition-colors">{scan.id.substring(0, 8)}...</td>
                                            <td className="p-4 font-bold text-white tracking-wide">{scan.target}</td>
                                            <td className="p-4 text-xs text-gray-400 uppercase font-mono tracking-wider">{scan.scan_type}</td>
                                            <td className="p-4">{getStatusBadge(scan.status)}</td>
                                            <td className="p-4 text-xs text-gray-500 font-mono">{new Date(scan.created_at).toLocaleDateString()} <span className="text-gray-600">{new Date(scan.created_at).toLocaleTimeString()}</span></td>
                                            <td className="p-4 text-right text-gray-500 flex justify-end items-center gap-2">
                                                <button
                                                    onClick={(e) => promptDelete(e, scan)}
                                                    className="p-2 hover:text-red-500 transition-colors"
                                                    title="Delete Scan Record"
                                                >
                                                    <MdDelete className="text-lg" />
                                                </button>
                                                <MdChevronRight className={`text-xl transition-transform duration-300 ${expandedScanId === scan.id ? 'rotate-90 text-primary' : 'group-hover:text-white'}`} />
                                            </td>
                                        </tr>
                                        {expandedScanId === scan.id && (
                                            <tr className="bg-black/20">
                                                <td colSpan="6" className="p-0">
                                                    <div className="p-6 border-b border-[#1a2e22] animate-in slide-in-from-top-2 duration-300">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-sm font-bold text-[#8ecc9e] uppercase tracking-widest font-mono">Detailed Scan Report: {scan.target}</h4>
                                                        </div>
                                                        {scan.results && scan.results.length > 0 ? (
                                                            <ScanResults results={scan.results} status={scan.status} />
                                                        ) : (
                                                            <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
                                                                No detailed results available for this scan.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 font-mono">Loading history...</div>
                        ) : filteredScans.length === 0 ? (
                            <EmptyState
                                icon={<MdHistory />}
                                title="NO SCAN HISTORY"
                                description={searchTerm ? "No scans match your search criteria." : "No operations recorded."}
                                action={!searchTerm ? {
                                    label: "New Scan",
                                    onClick: () => navigate('/scan'),
                                    icon: <MdRadar />
                                } : null}
                                compact={true}
                            />
                        ) : (
                            filteredScans.map(scan => (
                                <div key={scan.id} className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
                                    <div
                                        onClick={() => toggleExpand(scan.id)}
                                        className="p-4 cursor-pointer active:bg-white/5 relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-white text-lg">{scan.target}</div>
                                                <div className="text-xs font-mono text-gray-500">{scan.id.substring(0, 8)}...</div>
                                            </div>
                                            {getStatusBadge(scan.status)}
                                        </div>
                                        <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
                                            <div className="font-mono uppercase text-xs tracking-wider">{scan.scan_type}</div>
                                            <div className="font-mono text-xs text-gray-500">{new Date(scan.created_at).toLocaleDateString()}</div>
                                        </div>

                                        {/* Mobile Delete Button */}
                                        <button
                                            onClick={(e) => promptDelete(e, scan)}
                                            className="absolute top-4 right-20 bg-red-500/10 p-2 rounded-full text-red-500 border border-red-500/20 z-10"
                                        >
                                            <MdDelete />
                                        </button>
                                    </div>

                                    {/* Expanded Details Mobile */}
                                    {expandedScanId === scan.id && (
                                        <div className="border-t border-white/5 p-4 bg-black/10">
                                            <div className="mb-4 text-xs font-bold text-[#8ecc9e] uppercase tracking-widest font-mono">Report Details</div>
                                            {scan.results && scan.results.length > 0 ? (
                                                <ScanResults results={scan.results} status={scan.status} />
                                            ) : (
                                                <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
                                                    No detailed results.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, scanId: null, target: null })}
                onConfirm={confirmDelete}
                title="Delete Scan Record"
                message={`Permanently delete scan history for ${deleteModal.target}? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
};

export default ScanHistory;

