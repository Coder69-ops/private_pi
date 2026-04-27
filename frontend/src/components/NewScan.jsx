import React, { useEffect } from 'react';
import ScanForm from './ScanForm';
import ScanResults from './ScanResults';
import LiveConsole from './LiveConsole';

// Helper to disable scrolling when scan active? No, we want user to scroll log.

const NewScan = ({ activeScanId, activeTarget, scanStatus, scanResults, isSubmitting, handleStartScan, scanStartTime, scanLogs }) => {

    // Determine view state
    const isScanActive = !!activeScanId;

    // Auto-scroll to mission control when active
    useEffect(() => {
        if (isScanActive) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [isScanActive]);

    return (
        <div className="flex flex-col gap-8 fade-in pb-20 max-w-7xl mx-auto">
            {/* 1. Configuration Form */}
            {!isScanActive && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <ScanForm onScanStart={handleStartScan} isLoading={isSubmitting} />
                </div>
            )}

            {/* 2. Mission Command (Live Console + Results) */}
            {isScanActive && (
                <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between border-b border-[#1a2e22] pb-4">
                        <h2 className="text-xl font-bold text-slate-200 font-mono tracking-widest uppercase">
                            Mission Status: <span className={`
                                ${scanStatus === 'RUNNING' ? 'text-yellow-500 animate-pulse' : ''}
                                ${scanStatus === 'COMPLETED' ? 'text-primary' : ''}
                                ${scanStatus === 'FAILED' ? 'text-red-500' : ''}
                             `}>{scanStatus}</span>
                        </h2>
                        {scanStatus === 'COMPLETED' && (
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 text-xs font-bold text-black bg-primary rounded hover:bg-[#04c234] transition-colors font-mono uppercase tracking-wider"
                            >
                                NEW OPERATION
                            </button>
                        )}
                    </div>

                    {/* Live Console */}
                    <LiveConsole logs={scanLogs} status={scanStatus} connectionStatus="CONNECTED" />

                    {/* 3. Results (Stream in) */}
                    <ScanResults
                        results={scanResults}
                        status={scanStatus}
                        scanId={activeScanId}
                        target={activeTarget}
                        startTime={scanStartTime}
                    />
                </div>
            )}
        </div>
    );
};

export default NewScan;
