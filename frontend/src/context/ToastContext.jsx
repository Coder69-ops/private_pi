import React, { createContext, useContext, useState, useEffect } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100">
                        <ToastDisplay message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastDisplay = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <MdCheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <MdError className="w-5 h-5 text-red-400" />,
        info: <MdInfo className="w-5 h-5 text-blue-400" />
    };

    const colors = {
        success: 'border-emerald-500/20 bg-[#06f943]/5 shadow-[0_0_15px_rgba(6,249,67,0.1)]',
        error: 'border-red-500/20 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
        info: 'border-blue-500/20 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    };

    return (
        <div className={`p-4 rounded-lg shadow-2xl border backdrop-blur-xl flex items-start gap-3 min-w-[320px] max-w-md ${colors[type] || colors.info}`}>
            <div className="mt-0.5">{icons[type] || icons.info}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white font-mono tracking-wide">{message}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <MdClose className="w-4 h-4" />
            </button>
        </div>
    );
};
