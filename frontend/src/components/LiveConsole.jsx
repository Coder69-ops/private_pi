import React, { useEffect, useRef } from 'react';
import { MdTerminal } from 'react-icons/md';
import EmptyState from './EmptyState';

const LiveConsole = ({ logs = [], status, connectionStatus = 'CONNECTED' }) => {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Render Logic
    return (
        <div className="glass-panel border-2 border-[#1a2e22] bg-black font-mono rounded-lg overflow-hidden flex flex-col h-[400px] shadow-[0_0_30px_rgba(6,249,67,0.1)]">
            {/* Header */}
            <div className="bg-[#0a160d] border-b border-[#1a2e22] p-2 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#06f943]">
                    <MdTerminal className="text-lg" />
                    <span className="tracking-widest font-bold">LIVE_TERMINAL_V1.0</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-[#06f943] animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-slate-500">{connectionStatus}</span>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-custom text-sm space-y-1 font-mono">
                {logs.length === 0 && (
                    <div className="h-full flex items-center justify-center pb-12">
                        <EmptyState
                            icon={<MdTerminal className="animate-pulse text-[#06f943]" />}
                            title="TERMINAL STANDBY"
                            description="Waiting for mission command..."
                            compact={true}
                        />
                    </div>
                )}
                {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in duration-100">
                        <span className="text-slate-600 select-none">[{log.timestamp || "00:00:00"}]</span>
                        <span className={`
                            ${log.type === 'system' ? 'text-yellow-500 font-bold' : ''}
                            ${log.type === 'error' ? 'text-red-500' : ''}
                            ${log.type === 'success' ? 'text-[#06f943]' : ''}
                            ${log.type === 'info' ? 'text-slate-300' : ''}
                            break-all
                        `}>
                            {log.message}
                        </span>
                    </div>
                ))}
                {/* Typing Cursor */}
                {connectionStatus === 'CONNECTED' && (
                    <div className="flex gap-3 animate-pulse">
                        <span className="text-slate-600 invisible">[00:00:00]</span>
                        <span className="text-[#06f943]">_</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LiveConsole;
