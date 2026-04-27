import React from 'react';
import { MdWarning, MdClose, MdCheck } from 'react-icons/md';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`w-full max-w-md bg-[#0a160d] border ${isDangerous ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-primary/50 shadow-[0_0_30px_rgba(6,249,67,0.2)]'} rounded-xl overflow-hidden transform animate-in slide-in-from-bottom-8 duration-300`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDangerous ? 'border-red-500/20 bg-red-500/5' : 'border-primary/20 bg-primary/5'} flex justify-between items-center`}>
                    <h3 className={`text-lg font-bold font-mono uppercase tracking-wider flex items-center gap-2 ${isDangerous ? 'text-red-500' : 'text-primary'}`}>
                        {isDangerous && <MdWarning className="text-xl" />}
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-300 leading-relaxed font-mono text-sm">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all font-mono"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-black transition-all shadow-lg flex items-center gap-2 ${isDangerous
                                ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
                                : 'bg-primary hover:bg-[#04c234] shadow-primary/20'
                            }`}
                    >
                        {isDangerous ? <MdWarning /> : <MdCheck />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
