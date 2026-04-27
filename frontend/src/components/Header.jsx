import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdNotifications, MdLogout, MdPerson, MdMenu } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Header = ({ toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const { addToast } = useToast();

    const handleLogout = async () => {
        try {
            await logout();
            addToast("SYSTEM DISCONNECTED. SESSION TERMINATED.", "info");
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    const getPageDetails = (pathname) => {
        switch (pathname) {
            case '/dashboard':
                return { title: 'Dashboard', breadcrumb: 'HOME / DASHBOARD' };
            case '/new-scan':
                return { title: 'Initialize New Scan', breadcrumb: 'HOME / SCANS / NEW_INIT' };
            case '/history':
                return { title: 'Scan History', breadcrumb: 'HOME / SCANS / HISTORY' };
            case '/targets':
                return { title: 'Target Management', breadcrumb: 'HOME / TARGETS' };
            case '/vulnerabilities':
                return { title: 'Threat Intelligence', breadcrumb: 'HOME / VULNERABILITIES' };
            case '/settings':
                return { title: 'System Configuration', breadcrumb: 'HOME / SETTINGS' };
            default:
                return { title: 'Private PI', breadcrumb: 'HOME' };
        }
    };

    const { title, breadcrumb } = getPageDetails(location.pathname);

    return (
        <header className="flex items-center justify-between border-b border-border-dark px-4 md:px-8 py-4 z-10 bg-[#102315]/80 backdrop-blur-md sticky top-0 md:relative">
            <div className="flex items-center gap-4">
                {/* Hamburger */}
                <button
                    onClick={toggleSidebar}
                    className="md:hidden text-white hover:text-primary transition-colors p-1"
                >
                    <MdMenu className="text-2xl" />
                </button>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-[#8ecc9e] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] md:max-w-none">
                        {breadcrumb.split(' / ').map((crumb, index, arr) => (
                            <React.Fragment key={index}>
                                <span className={index === arr.length - 1 ? 'text-primary' : ''}>{crumb}</span>
                                {index < arr.length - 1 && <span>/</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    <h2 className="text-white text-lg md:text-2xl font-bold tracking-tight truncate max-w-[200px] md:max-w-none">{title}</h2>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="hidden md:inline">SYSTEM_ON LINE</span>
                    <span className="md:hidden">ON</span>
                </div>
                <button className="text-white hover:text-primary transition-colors">
                    <MdNotifications className="text-2xl" />
                </button>
                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                    <div className="text-right hidden lg:block">
                        <div className="text-sm font-bold text-white tracking-wide">{currentUser?.displayName || 'OPERATOR'}</div>
                        <div className="text-xs text-primary font-mono">{currentUser?.email}</div>
                    </div>
                    <div className="relative group">
                        <div
                            className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-black/50 border border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        >
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <MdPerson className="text-2xl text-primary/70" />
                            )}
                        </div>
                        {/* Hover Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto bg-black/90 border border-red-500/50 text-red-500 rounded px-4 py-2 flex items-center gap-2 text-sm font-bold tracking-wider hover:bg-red-500/10 transition-all shadow-[0_0_20px_rgba(255,0,0,0.2)] whitespace-nowrap z-50 origin-top-right"
                        >
                            <MdLogout /> DISCONNECT
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
