import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdRadar, MdGpsFixed, MdWarning, MdHistory, MdSettings, MdLogout } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, close }) => {
    const { logout } = useAuth();
    const navLinkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
            ? 'bg-primary/20 border border-primary/50 text-white shadow-[0_0_15px_rgba(6,249,67,0.2)]'
            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
        }`;

    const iconClasses = ({ isActive }) =>
        `text-xl transition-colors ${isActive ? 'text-primary drop-shadow-[0_0_5px_rgba(6,249,67,0.8)]' : 'text-gray-500 group-hover:text-gray-300'}`;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
                    onClick={close}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-[#102315] border-r border-border-dark transform transition-transform duration-300 ease-in-out md:static md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col gap-4 h-full p-4">
                    {/* Logo & Close Button */}
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div className="flex gap-3 items-center">
                            <div
                                className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border-2 border-primary shadow-[0_0_10px_rgba(6,249,67,0.3)]"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23162f1d\'/%3E%3Cpath d=\'M20 10L30 20L20 30L10 20Z\' fill=\'%2306f943\' opacity=\'0.5\'/%3E%3C/svg%3E")' }}
                            />
                            <div className="flex flex-col">
                                <h1 className="text-white text-lg font-bold leading-tight tracking-wider">Private PI</h1>
                                <p className="text-primary text-xs font-mono leading-normal">v2.5.0_SECURE</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <NavLink to="/dashboard" onClick={close} className={navLinkClasses}>
                            {({ isActive }) => (
                                <>
                                    <MdDashboard className={iconClasses({ isActive })} />
                                    <p className="text-sm font-medium">Dashboard</p>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/new-scan" onClick={close} className={navLinkClasses}>
                            {({ isActive }) => (
                                <>
                                    <MdRadar className={iconClasses({ isActive })} />
                                    <p className="text-sm font-medium">New Scan</p>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/targets" onClick={close} className={navLinkClasses}>
                            {({ isActive }) => (
                                <>
                                    <MdGpsFixed className={iconClasses({ isActive })} />
                                    <p className="text-sm font-medium">Targets</p>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/vulnerabilities" onClick={close} className={navLinkClasses}>
                            {({ isActive }) => (
                                <>
                                    <MdWarning className={iconClasses({ isActive })} />
                                    <p className="text-sm font-medium">Vulnerabilities</p>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/history" onClick={close} className={navLinkClasses}>
                            {({ isActive }) => (
                                <>
                                    <MdHistory className={iconClasses({ isActive })} />
                                    <p className="text-sm font-medium">Scan History</p>
                                </>
                            )}
                        </NavLink>
                    </nav>

                    {/* Bottom Links */}
                    <div className="mt-auto border-t border-border-dark pt-4">
                        <NavLink to="/settings" onClick={close} className={navLinkClasses}>
                            {({ isActive }) => (
                                <>
                                    <MdSettings className={iconClasses({ isActive })} />
                                    <p className="text-sm font-medium">Settings</p>
                                </>
                            )}
                        </NavLink>
                        <button
                            onClick={() => { close(); logout(); }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 group transition-colors w-full text-left"
                        >
                            <MdLogout className="text-gray-400 group-hover:text-primary text-xl" />
                            <p className="text-gray-300 group-hover:text-white text-sm font-medium">Log Out</p>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
