import React from 'react';
import { MdAdd } from 'react-icons/md';

const EmptyState = ({
    icon,
    title = "NO DATA FOUND",
    description = "No records match your criteria.",
    action,
    compact = false
}) => {
    return (
        <div className={`
            flex flex-col items-center justify-center text-center
            border border-dashed border-white/10 rounded-xl bg-black/20
            ${compact ? 'p-6' : 'p-12'}
            fade-in
        `}>
            {icon && (
                <div className={`
                    bg-white/5 rounded-full flex items-center justify-center text-gray-600 mb-4
                    ${compact ? 'w-12 h-12 text-2xl' : 'w-20 h-20 text-4xl'}
                `}>
                    {icon}
                </div>
            )}

            <h3 className={`
                font-mono font-bold text-gray-500 uppercase tracking-widest
                ${compact ? 'text-sm' : 'text-lg'}
            `}>
                {title}
            </h3>

            {description && (
                <p className={`
                    text-gray-600 font-mono mt-2 max-w-sm
                    ${compact ? 'text-xs' : 'text-sm'}
                `}>
                    {description}
                </p>
            )}

            {action && (
                <div className="mt-6">
                    <button
                        onClick={action.onClick}
                        className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                    >
                        {action.icon || <MdAdd className="text-lg" />}
                        {action.label}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
