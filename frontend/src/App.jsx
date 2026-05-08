import { useState, useEffect, useLayoutEffect } from 'react';
import axios from 'axios';
import apiClient from './utils/apiClient';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import NewScan from './components/NewScan';
import ScanHistory from './components/ScanHistory';
import Targets from './components/Targets';
import Vulnerabilities from './components/Vulnerabilities';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import EthicalFramework from './components/legal/EthicalFramework';

// Use relative path for production (Backend API is at /api/backend on same domain)
// This works with nginx reverse proxy configuration
// Use relative path for production, matches env var logic
const API_URL = import.meta.env.VITE_API_URL || '/api/backend';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return <Navigate to="/login" />;
    return children;
};

function PrivatePIApp() {
    const [activeScanId, setActiveScanId] = useState(null);
    const [activeTarget, setActiveTarget] = useState('');
    const [scanStatus, setScanStatus] = useState(null);
    const [scanResults, setScanResults] = useState([]);
    const [scanLogs, setScanLogs] = useState([]); // Centralized Logs
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scanStartTime, setScanStartTime] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar State

    // Global Toast Hook
    const { addToast } = useToast();

    const location = useLocation();
    const { currentUser } = useAuth();

    // Axios Interceptor: Attach User ID to all requests
    useLayoutEffect(() => {
        const interceptor = axios.interceptors.request.use(config => {
            if (currentUser?.id) {
                config.headers['X-User-ID'] = currentUser.id;
            }
            return config;
        }, error => Promise.reject(error));

        return () => axios.interceptors.request.eject(interceptor);
    }, [currentUser]);

    // WebSocket Persistence
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?uid=${currentUser?.id}`;
        let ws;
        let reconnectTimer;

        const connect = () => {
            if (!currentUser?.id) return;

            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log('Connected to Private PI Net');
                    // Add system log on connect
                    setScanLogs(prev => [...prev, { type: 'system', message: '>> ENCRYPTED UPLINK ESTABLISHED...', timestamp: new Date().toLocaleTimeString() }]);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        // Parse log message
                        const timestamp = new Date().toLocaleTimeString();
                        let formattedMsg = "";
                        let type = "info";

                        if (data.status === "RUNNING") {
                            formattedMsg = `[${data.tool}] ${data.message || 'Executing module...'}`;
                            type = "info";
                        } else if (data.status === "COMPLETED") {
                            formattedMsg = `[${data.tool}] Task Completed successfully.`;
                            type = "success";
                        } else if (data.status === "FAILED") {
                            formattedMsg = `[${data.tool}] CRITICAL ERROR: Execution failed.`;
                            type = "error";
                        } else {
                            formattedMsg = `[${data.tool || 'System'}] ${data.message || 'Data packet received'}`;
                        }

                        // Append to centralized logs if it looks like a log message (has status or message)
                        if (data.status || data.message) {
                            setScanLogs(prev => [...prev, {
                                message: formattedMsg,
                                timestamp,
                                type
                            }]);
                        }

                        // Update Global State
                        setActiveScanId(currentId => {
                            if (currentId && data.task_id === currentId) {
                                // Default to RUNNING if getting data
                                if (data.status !== "COMPLETED" && data.status !== "FAILED" && data.status !== "PENDING") {
                                    setScanStatus("RUNNING");
                                }

                                if (data.status === "COMPLETED" || data.status === "TOOL_COMPLETED") {
                                    setScanResults(prevResults => {
                                        const exists = prevResults.find(r => r.tool_name === data.tool);
                                        if (exists) return prevResults;
                                        addToast(`${data.tool} completed`, 'success');
                                        return [...prevResults, { tool_name: data.tool, result: data.result }];
                                    });
                                }

                                if (data.status === "COMPLETED") {
                                    setScanStatus(data.status);
                                    addToast('Scan completed successfully!', 'success');
                                } else if (data.status === "FAILED") {
                                    setScanStatus(data.status);
                                    addToast('Scan failed. Please try again!', 'error');
                                }
                            }
                            return currentId;
                        });
                    } catch (err) {
                        console.error("WS Parse error", err);
                    }
                };

                ws.onclose = () => {
                    setScanLogs(prev => [...prev, { type: 'system', message: '>> CONNECTION LOST. RETRYING...', timestamp: new Date().toLocaleTimeString() }]);
                    reconnectTimer = setTimeout(connect, 3000);
                };
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                reconnectTimer = setTimeout(connect, 3000);
            }
        };

        connect();

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
    }, [currentUser?.uid]);

    // Polling (Fallback) - Fixed Status Overwrite Logic
    useEffect(() => {
        let intervalId;
        if (activeScanId && scanStatus !== 'COMPLETED' && scanStatus !== 'FAILED') {
            intervalId = setInterval(async () => {
                try {
                    const response = await apiClient.get(`/scan/${activeScanId}`);

                    // Critical Fix: Don't revert "RUNNING" to "PENDING"
                    // If local is RUNNING and remote is PENDING, keep RUNNING.
                    const remoteStatus = response.data.status;
                    setScanStatus(prevStatus => {
                        if (prevStatus === 'RUNNING' && remoteStatus === 'PENDING') {
                            return prevStatus;
                        }
                        return remoteStatus;
                    });

                    if (response.data.results && response.data.results.length > scanResults.length) {
                        setScanResults(response.data.results);
                    }
                } catch (error) {
                    console.error("Polling error:", error);
                }
            }, 5000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeScanId, scanStatus, scanResults.length]);

    const handleStartScan = async (formData) => {
        setIsSubmitting(true);
        setScanResults([]);
        // Initialize logs with immediate feedback
        setScanLogs([{
            type: 'system',
            message: '>> INITIATING NEW SCAN SEQUENCE...',
            timestamp: new Date().toLocaleTimeString()
        }]);
        setScanStatus('PENDING');
        setScanStartTime(Date.now());
        setActiveTarget(formData.target);

        try {
            const response = await apiClient.post(`/scan`, formData);
            setActiveScanId(response.data.id);
            addToast(`Scan initiated for ${formData.target}`, 'success');
        } catch (error) {
            console.error("Scan start error:", error);
            addToast("Failed to start scan. Please check console.", 'error');
            setScanStatus(null);
            setScanStartTime(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hide Sidebar and Header on Landing Page, Login Page, and Legal Pages
    const isStandalonePage = ['/', '/login', '/privacy', '/terms', '/ethics'].includes(location.pathname);


    if (isStandalonePage) {
        return (
            <div className="w-full relative overflow-x-hidden">
                <main className="w-full">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/ethics" element={<EthicalFramework />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        );
    }

    // Sidebar State moved up

    return (
        <div className="flex h-screen overflow-hidden w-full bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-background-dark relative">
                <div
                    className="absolute inset-0 z-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#06f943 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}
                />

                <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-custom p-4 md:p-8 z-10 scroll-smooth relative">
                    <div className="max-w-6xl mx-auto pb-20">
                        <Routes>
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/new-scan" element={
                                <ProtectedRoute>
                                    <NewScan
                                        activeScanId={activeScanId}
                                        activeTarget={activeTarget}
                                        scanStatus={scanStatus}
                                        scanResults={scanResults}
                                        isSubmitting={isSubmitting}
                                        handleStartScan={handleStartScan}

                                        scanStartTime={scanStartTime}
                                        scanLogs={scanLogs}
                                    />
                                </ProtectedRoute>
                            } />
                            <Route path="/history" element={<ProtectedRoute><ScanHistory /></ProtectedRoute>} />
                            <Route path="/targets" element={<ProtectedRoute><Targets /></ProtectedRoute>} />
                            <Route path="/vulnerabilities" element={<ProtectedRoute><Vulnerabilities /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
}

import InstallPrompt from './components/InstallPrompt';

const App = () => (
    <Router>
        <AuthProvider>
            <ToastProvider>
                <PrivatePIApp />
                <InstallPrompt />
            </ToastProvider>
        </AuthProvider>
    </Router>
);

export default App;
