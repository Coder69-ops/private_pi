import React, { useState, useEffect } from 'react';
import { MdGetApp, MdClose, MdInstallDesktop, MdIosShare } from 'react-icons/md';

// Global capture to ensure we don't miss the event before component mounts
let deferredInstallPrompt = null;

// Add listener immediately
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredInstallPrompt = e;
    });
}

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // 1. Check if event was already captured globally
        if (deferredInstallPrompt) {
            setDeferredPrompt(deferredInstallPrompt);
            setIsVisible(true);
        }

        // 2. Also listen for future events (if not yet fired)
        const handler = (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // 3. iOS Detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isInStandalone = window.navigator.standalone === true;

        if (isIosDevice && !isInStandalone) {
            setIsIOS(true);
            setIsVisible(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="glass-panel p-0 rounded-lg border border-primary/50 overflow-hidden shadow-[0_0_30px_rgba(6,249,67,0.2)]">
                {/* Header */}
                <div className="bg-primary/10 px-4 py-2 flex justify-between items-center border-b border-primary/20">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">System Install Available</span>
                    </div>
                    <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white transition-colors">
                        <MdClose />
                    </button>
                </div>

                <div className="p-5 flex items-start gap-4 bg-black/80 backdrop-blur-xl">
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 text-primary">
                        <MdInstallDesktop className="text-2xl" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold mb-1 font-display tracking-tight">
                            {isIOS ? 'Install on iOS' : 'Initialize Native Interface?'}
                        </h4>
                        <p className="text-xs text-gray-400 font-mono mb-4 leading-relaxed">
                            {isIOS
                                ? <span>Tap the <span className="inline-flex items-center bg-gray-700 px-1 rounded mx-1"><MdIosShare /> Share</span> button and select <span className="text-white font-bold">"Add to Home Screen"</span></span>
                                : "Install Private PI as a native application for enhanced performance and offline capabilities."
                            }
                        </p>

                        {!isIOS && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 bg-primary text-black text-xs font-bold py-2 rounded border border-primary hover:bg-white hover:border-white transition-all shadow-[0_0_10px_rgba(6,249,67,0.3)] uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <MdGetApp className="text-lg" />
                                    Install System
                                </button>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="px-3 py-2 rounded border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/30 transition-all uppercase tracking-wider font-mono"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                        {isIOS && (
                            <button
                                onClick={() => setIsVisible(false)}
                                className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded border border-white/20 transition-all uppercase tracking-wider"
                            >
                                Understood
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
