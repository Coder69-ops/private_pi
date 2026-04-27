
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdSecurity, MdRadar, MdArrowForward, MdTerminal,
    MdGpsFixed, MdNetworkCheck, MdGroup,
    MdStorage, MdLayers, MdBolt, MdDataObject,
    MdCheckCircle, MdDataUsage, MdPublic, MdFingerprint, MdCode, MdSettings
} from 'react-icons/md';

/* -------------------------------------------------------------------------- */
/*                                UTILITY HOOKS                               */
/* -------------------------------------------------------------------------- */

const useIntersectionObserver = (options = { threshold: 0.1 }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
            if (entry.isIntersecting) setHasIntersected(true);
        }, options);
        observer.observe(ref.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [ref, isIntersecting, hasIntersected];
};

const useScrambleText = (text, active = true) => {
    const [display, setDisplay] = useState(text);
    const chars = useRef('!@#$%^&*()_+-=[]{}|;:,.<>?/~');

    useEffect(() => {
        if (!active) {
            setDisplay(text);
            return;
        }
        let interval;
        let iteration = 0;

        interval = setInterval(() => {
            setDisplay(
                text
                    .split("")
                    .map((char, index) => {
                        if (index < iteration) return text[index];
                        return chars.current[Math.floor(Math.random() * chars.current.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);

        return () => clearInterval(interval);
    }, [text, active]);

    return display;
};

/* -------------------------------------------------------------------------- */
/*                            VISUAL COMPONENTS                               */
/* -------------------------------------------------------------------------- */

const MatrixCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let animationFrameId;

        const fontSize = 14;
        let columns = Math.ceil(width / fontSize);
        if (columns > 150) columns = 150; // Performance cap for ultra-wide
        const drops = Array(columns).fill(1).map(() => Math.random() * -100);

        let lastTime = 0;
        const fps = 18; // Lower FPS for better performance
        const interval = 1000 / fps;

        const draw = (currentTime) => {
            animationFrameId = requestAnimationFrame(draw);

            const delta = currentTime - lastTime;
            if (delta < interval) return;
            lastTime = currentTime - (delta % interval);

            ctx.fillStyle = 'rgba(5, 10, 6, 0.15)'; // Slightly darker trail
            ctx.fillRect(0, 0, width, height);

            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = 'start';
            ctx.textBaseline = 'top';

            drops.forEach((y, i) => {
                const text = String.fromCharCode(0x30A0 + Math.random() * 96);
                const x = i * fontSize;

                ctx.fillStyle = Math.random() > 0.98 ? '#fff' : '#06f943';
                ctx.fillText(text, x, y * fontSize);

                if (y * fontSize > height && Math.random() > 0.99) {
                    drops[i] = 0;
                }
                drops[i]++;
            });
        };

        animationFrameId = requestAnimationFrame(draw);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // Re-calc columns if needed
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-20 pointer-events-none w-full h-full transform-gpu" />;
};

const GlitchHeader = ({ text, subtext }) => {
    const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });
    const scrambled = useScrambleText(text, isIntersecting);

    return (
        <div ref={ref} className="mb-12 relative z-10 text-center will-change-transform">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 animate-glitch inline-block" data-text={text}>
                    {scrambled}
                </span>
            </h2>
            {subtext && <p className="text-primary font-mono text-sm tracking-[0.3em] uppercase opacity-80">{subtext}</p>}
        </div>
    );
};

const TypewriterEffect = ({ sequence }) => {
    const [lines, setLines] = useState([]);

    useEffect(() => {
        let timeouts = [];
        sequence.forEach(({ text, delay, className }) => {
            const timeout = setTimeout(() => {
                setLines(prev => [...prev, { text, className }]);
            }, delay);
            timeouts.push(timeout);
        });

        return () => timeouts.forEach(clearTimeout);
    }, [sequence]);

    return (
        <>
            {lines.map((line, i) => (
                <div key={`${line.text}-${i}`} className={`${line.className} font-mono animate-typing flex items-start gap-2`}>
                    <span className="text-primary opacity-50 select-none">#</span>
                    {line.text}
                </div>
            ))}
            <span className="inline-block w-2 h-4 bg-primary animate-blink align-middle ml-1" />
        </>
    );
};

const HUDElement = ({ label, value, className = "" }) => (
    <div className={`font-mono text-[10px] uppercase tracking-tighter ${className}`}>
        <span className="opacity-40">{label}:</span> <span className="text-primary animate-flicker">{value}</span>
    </div>
);

const DataCore = () => (
    <div className="relative w-48 h-48 md:w-80 md:h-80 mx-auto mb-10 animate-float-rotate pointer-events-none select-none">
        {/* Dynamic Rings */}
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed"></div>
        <div className="absolute inset-8 border-2 border-primary/10 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>

        {/* Central Orb */}
        <div className="absolute inset-[35%] bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute inset-[40%] border-2 border-primary flex items-center justify-center rounded-full bg-black shadow-[0_0_30px_rgba(6,249,67,0.4)]">
            <MdSecurity className="text-4xl md:text-5xl text-primary animate-pulse" />
        </div>

        {/* Floating Data Points */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-black/80 border border-primary/30 px-3 py-1 rounded font-mono text-[8px] text-primary whitespace-nowrap">
            CORE_SYNC: ACTIVE
        </div>
        <div className="absolute bottom-4 -right-8 bg-black/80 border border-primary/30 px-3 py-1 rounded font-mono text-[8px] text-primary whitespace-nowrap">
            LATENCY: 12ms
        </div>
    </div>
);

const TechnicalSpecs = () => {
    const specs = [
        { label: 'ENCRYPTION', value: 'AES-256-GCM', icon: MdSecurity, desc: 'Military-grade end-to-end data obfuscation' },
        { label: 'BACKEND', value: 'DISTRIBUTED_CELERY', icon: MdLayers, desc: 'Highly scalable worker pool architecture' },
        { label: 'PRIVACY', value: 'NO_LOGS_POLICY', icon: MdFingerprint, desc: 'Session-based isolation, no persistent tracking' },
        { label: 'UPLINK', value: 'REAL_TIME_SOCKETS', icon: MdNetworkCheck, desc: 'Zero-latency live results streaming' }
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-black/40 border-y border-white/5">
            <div className="absolute inset-0 data-stream opacity-20 pointer-events-none"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-2xl font-bold font-mono tracking-[0.3em] uppercase text-white mb-2">Technical_Inventory</h2>
                    <div className="h-1 w-24 bg-primary mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {specs.map((spec, i) => (
                        <div key={i} className="hud-border p-6 group hover:border-primary/50 transition-colors">
                            <spec.icon className="text-3xl text-primary/50 mb-4 group-hover:text-primary transition-colors animate-pulse" />
                            <h4 className="font-mono text-[10px] text-primary mb-1 uppercase tracking-widest">{spec.label}</h4>
                            <div className="text-white font-bold mb-3 font-mono text-xs">{spec.value}</div>
                            <p className="text-gray-500 text-[10px] leading-relaxed">{spec.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const IntelligenceFeed = () => {
    const [feed, setFeed] = useState([
        { id: 1, type: 'CRITICAL', msg: 'Unauthorized access attempt detected in Subnet_82', time: '02:44:12', icon: MdSecurity },
        { id: 2, type: 'INFO', msg: 'Nmap Scan [ID_224] completed on target: 192.168.1.1', time: '02:43:08', icon: MdRadar },
        { id: 3, type: 'DATA', msg: 'New subdomain discovery: dev.private-pi.xyz', time: '02:42:55', icon: MdLayers },
    ]);

    useEffect(() => {
        const items = [
            { type: 'CRITICAL', msg: 'Firewall breach attempt blocked at IP: 45.32.11.90', icon: MdSecurity },
            { type: 'SUCCESS', msg: 'Credential leak found in DB_SHARD_3', icon: MdFingerprint },
            { type: 'RECON', msg: 'Active OSINT survey running on target domain', icon: MdRadar },
            { type: 'SYSTEM', msg: 'Core kernel sync [v2.4.1] initialized', icon: MdLayers }
        ];

        const interval = setInterval(() => {
            const newItem = {
                id: Date.now(),
                ...items[Math.floor(Math.random() * items.length)],
                time: new Date().toLocaleTimeString()
            };
            setFeed(prev => [newItem, ...prev.slice(0, 4)]);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 relative overflow-hidden contain-layout">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/50 shadow-[0_0_20px_rgba(6,249,67,0.2)]">
                            <MdRadar className="text-2xl text-primary animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-mono tracking-widest text-white uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                                Live_Intel_Stream
                            </h2>
                            <p className="text-primary/50 text-[10px] font-mono uppercase tracking-[0.2em]">Neural Link Status: Synchronized</p>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-8 font-mono text-[10px] text-gray-500">
                        <div className="flex flex-col"><span className="text-primary">824 TB</span><span>DATA_PROCESSED</span></div>
                        <div className="flex flex-col"><span className="text-primary">12ms</span><span>LATENCY</span></div>
                    </div>
                </div>

                <div className="grid gap-4">
                    {feed.map(item => (
                        <div key={item.id} className="glass-card group flex items-center gap-4 p-5 rounded-xl border border-white/5 hover:border-primary/40 transition-smooth hover:translate-x-2 relative overflow-hidden">
                            <div className="absolute left-0 top-0 w-1 h-full bg-primary/40"></div>
                            <item.icon className={`text-xl ${item.type === 'CRITICAL' ? 'text-red-500' : 'text-primary'}`} />
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-mono text-gray-600">{item.time}</span>
                                    <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold font-mono tracking-tighter ${item.type === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                        item.type === 'SUCCESS' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                                            'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                        }`}>{item.type}</span>
                                </div>
                                <p className="text-gray-300 text-xs sm:text-sm font-mono group-hover:text-white transition-colors">&gt; {item.msg}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MdArrowForward className="text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const GlobalMap = () => {
    return (
        <section className="py-32 relative bg-[#020503] overflow-hidden contain-layout">
            <div className="absolute inset-0 dot-grid opacity-10"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight font-mono">GLOBAL_RECON_NETWORK</h2>
                    <p className="text-primary/40 font-mono text-sm uppercase tracking-[0.3em]">42 ACTIVE NODES // 18 LATENCY PEAKS</p>
                </div>

                <div className="relative max-w-5xl mx-auto aspect-[16/9] bg-black border border-primary/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,249,67,0.1)] group">
                    {/* Map Background with Noise */}
                    <div className="absolute inset-x-0 top-0 h-full w-full opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                    {/* Simulated Map Lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                        <path d="M 200 100 Q 400 50 600 200" stroke="#06f943" fill="transparent" strokeWidth="0.5" className="animate-pulse" />
                        <path d="M 100 300 Q 300 250 500 400" stroke="#06f943" fill="transparent" strokeWidth="0.5" />
                        <path d="M 700 100 Q 800 200 900 150" stroke="#06f943" fill="transparent" strokeWidth="0.5" className="animate-pulse" />
                    </svg>

                    {/* Target Nodes */}
                    <div className="absolute top-[20%] left-[30%] w-3 h-3 bg-primary rounded-full animate-ping"></div>
                    <div className="absolute top-[45%] left-[60%] w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(6,249,67,1)]"></div>
                    <div className="absolute top-[15%] left-[75%] w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(6,249,67,1)]"></div>
                    <div className="absolute top-[70%] left-[15%] w-3 h-3 bg-red-500 rounded-full animate-ping opacity-60"></div>
                    <div className="absolute top-[60%] left-[45%] w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="absolute top-[35%] right-[20%] w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(6,249,67,1)]"></div>

                    {/* HUD Telemetry Overlay */}
                    <div className="absolute top-8 left-8 space-y-2 pointer-events-none">
                        <HUDElement label="REGION" value="NORAM_ALPHA" className="opacity-80" />
                        <HUDElement label="THREAT_LVL" value="LOW" className="opacity-80" />
                    </div>

                    <div className="absolute top-8 right-8 font-mono text-[10px] text-primary/40 text-right pointer-events-none">
                        <div>TX: 1.4 GB/S</div>
                        <div>RX: 0.9 GB/S</div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-8 flex justify-between items-end bg-gradient-to-t from-black via-black/80 to-transparent border-t border-white/5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <HUDElement label="NETWORK_STATUS" value="OPERATIONAL" />
                            </div>
                            <div className="flex gap-4">
                                <span className="text-[10px] font-mono text-gray-600">UPTIME: 99.9%</span>
                                <span className="text-[10px] font-mono text-gray-600">NODES: 42/42</span>
                            </div>
                        </div>
                        <div className="flex gap-2 text-primary font-mono text-xl opacity-20">
                            [ + . + ] [ + . + ]
                        </div>
                    </div>

                    {/* Scanning Overlay Effect */}
                    <div className="scanning-line"></div>
                </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full animate-pulse pointer-events-none"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
        </section>
    );
};

const PlatformPreview = () => {
    return (
        <section className="py-32 relative overflow-hidden contain-layout">
            <div className="absolute inset-0 dot-grid opacity-10"></div>
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            {/* Visual Glow behind window */}
                            <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full"></div>

                            <div className="relative group">
                                {/* Chrome Window Mockup */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/5 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative bg-[#0d1117] border border-white/10 rounded-2xl overflow-x-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                                    <div className="bg-[#161b22] px-4 py-3 flex justify-between items-center border-b border-white/5">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-500 tracking-widest">PRIVATE_PI_CONSOLEX_v4.2</div>
                                        <div className="w-10"></div>
                                    </div>

                                    <div className="flex h-[400px]">
                                        {/* Mock Sidebar */}
                                        <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-black/20">
                                            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center"><MdRadar className="text-primary" /></div>
                                            <div className="w-8 h-8 rounded hover:bg-white/5 transition-colors flex items-center justify-center opacity-30"><MdStorage /></div>
                                            <div className="w-8 h-8 rounded hover:bg-white/5 transition-colors flex items-center justify-center opacity-30"><MdGroup /></div>
                                            <div className="w-8 h-8 rounded hover:bg-white/5 transition-colors flex items-center justify-center opacity-30"><MdSettings /></div>
                                        </div>

                                        <div className="flex-1 p-6 space-y-6 overflow-hidden data-stream opacity-40">
                                            {/* Top Banner */}
                                            <div className="flex justify-between items-center">
                                                <div className="space-y-1">
                                                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                                                    <div className="h-2 w-16 bg-primary/20 rounded"></div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="h-6 w-12 bg-primary/20 border border-primary/30 rounded flex items-center justify-center text-[8px] font-mono text-primary">LIVE</div>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-3 gap-4">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-24 bg-black/40 rounded-xl border border-white/5 p-4 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-2 opacity-20"><MdCheckCircle className="text-primary text-xs" /></div>
                                                        <div className="h-2 w-8 bg-white/5 rounded mb-3"></div>
                                                        <div className="h-6 w-12 bg-white/10 rounded"></div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Main Chart Area Mock */}
                                            <div className="h-full bg-black/40 rounded-xl border border-primary/20 p-4 relative flex flex-col justify-end">
                                                <div className="absolute top-4 left-4 font-mono text-[10px] text-primary italic">&gt; Scanning Network Segments...</div>
                                                <div className="flex items-end gap-1 h-20">
                                                    {Array.from({ length: 20 }).map((_, i) => (
                                                        <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${Math.random() * 100}%` }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded text-[10px] font-mono text-primary uppercase mb-6 tracking-widest">Operations_Console</div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">UNIFIED COMMAND <br /><span className="text-primary italic">FOR THE MODERN RESEARCHER.</span></h2>
                            <p className="text-gray-400 text-lg mb-10 leading-relaxed font-mono text-sm">
                                Stop juggling dozens of open terminal windows. Private PI centralizes your entire offensive toolkit into a single, high-performance viewport.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-8">
                                {[
                                    { label: 'Multi-Cloud', desc: 'Execute tools seamlessly across distributed infrastructure pods.' },
                                    { label: 'Unified API', desc: 'Programmatic access to every module via standardized JSON endpoints.' },
                                    { label: 'Real-time Pipe', desc: 'Websocket streams bring tool outputs to your screen instantly.' },
                                    { label: 'Secure Vault', desc: 'Industry-standard encryption for all scan history and asset metadata.' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <h4 className="font-bold text-white font-mono text-xs flex items-center gap-2">
                                            <span className="w-1 h-1 bg-primary rounded-full"></span>
                                            {item.label.toUpperCase()}
                                        </h4>
                                        <p className="text-[12px] text-gray-500 leading-snug">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ServiceCard = ({ icon: Icon, title, desc, delay }) => {
    const [ref, , hasIntersected] = useIntersectionObserver({ threshold: 0.2 });

    return (
        <div
            ref={ref}
            className={`
                group relative bg-[#040905]/60 border border-white/5 p-8 rounded-xl overflow-hidden
                transition-smooth hover:-translate-y-2 hover:border-primary/50
                ${hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
            `}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>

            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/50 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/50 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/50 opacity-0 group-hover:opacity-100 transition-all duration-300" />

            {/* Technical Meta Tag */}
            <div className="absolute top-4 right-4 font-mono text-[8px] text-primary/30 group-hover:text-primary transition-colors flex flex-col items-end">
                <span>UID: PR-{Math.floor(Math.random() * 9000) + 1000}</span>
                <span>VER: 4.2.0</span>
            </div>

            <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors border border-primary/20 relative">
                    <Icon className="text-3xl text-primary group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-bold mb-3 font-mono text-white group-hover:text-primary transition-colors uppercase tracking-tight">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{desc}</p>

                <div className="flex items-center gap-2 font-mono text-[10px] text-primary/60 border-t border-white/5 pt-4">
                    <span className="flex items-center gap-1"><span className="w-1 h-1 bg-primary rounded-full"></span> AGENT_READY</span>
                    <span className="w-px h-2 bg-gray-800"></span>
                    <span>128-BIT_SYNC</span>
                </div>
            </div>
        </div>
    );
};

const FieldManual = () => {
    const [activeTab, setActiveTab] = useState(0);
    const faqs = [
        { q: "Is Private PI anonymous?", a: "Yes. All scans are routed through a distributed pool of proxy-nodes. Your local IP address is never exposed to the target." },
        { q: "Are scans legal?", a: "Private PI is a tool for security professionals. Users are responsible for ensuring they have authorization for target assets." },
        { q: "Can I use it for free?", a: "The community tier includes limited daily scans for OSINT and network mapping. Premium tiers allow deep vulnerability scanning." }
    ];

    return (
        <section className="py-32 relative bg-black/50 border-y border-white/5">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20">
                    <div>
                        <h2 className="text-4xl font-bold mb-8 font-mono text-white">FIELD_MANUAL.pdf</h2>
                        <p className="text-gray-500 mb-12 font-mono text-sm leading-relaxed">
                            Technical documentation and operational protocols for Private PI Engine deployments.
                        </p>

                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(i)}
                                    className={`w-full text-left p-6 rounded-lg border transition-all ${activeTab === i ? 'bg-primary/10 border-primary/50 border-l-4' : 'bg-white/5 border-white/5 border-l-4 border-l-transparent hover:border-white/20'
                                        }`}
                                >
                                    <h4 className={`font-bold font-mono text-sm mb-2 ${activeTab === i ? 'text-primary' : 'text-gray-300'}`}>
                                        &gt; {faq.q}
                                    </h4>
                                    {activeTab === i && (
                                        <p className="text-gray-400 text-xs font-mono animate-typing">
                                            {faq.a}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="hud-border p-8 h-full flex flex-col items-center justify-center bg-black/40">
                            <div className="w-24 h-24 mb-6 border-4 border-primary/20 rounded-full flex items-center justify-center animate-pulse">
                                <MdDataObject className="text-5xl text-primary" />
                            </div>
                            <div className="text-[10px] font-mono text-primary/50 text-center space-y-2 uppercase tracking-[0.2em]">
                                <p>Operational Security: LEVEL_4</p>
                                <p>Authorization: VERIFIED</p>
                                <p>Manual Version: 1.0.8</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

const LandingPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    // Boot Sequence State
    const [bootComplete, setBootComplete] = useState(false);
    const [logs, setLogs] = useState([]);

    // Boot Logic
    useEffect(() => {
        const bootText = [
            `> INITIALIZING KERNEL...`,
            `> LOADING MODULES: [NET, CRYPTO, OSINT]`,
            `> CONNECTING TO SECURE GATEWAY...`,
            `> ESTABLISHING UPLINK...`,
            `> ACCESS GRANTED.`
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < bootText.length) {
                setLogs(prev => [...prev, bootText[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setBootComplete(true), 800);
            }
        }, 150);

        return () => clearInterval(interval);
    }, []);

    // Scroll Listener with Throttling
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 50);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!bootComplete) {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center font-mono text-sm p-4">
                <div className="max-w-md w-full relative">
                    <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full"></div>
                    {logs.map((log, i) => (
                        <div key={i} className="text-primary mb-1 animate-matrix-fade">
                            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                        </div>
                    ))}
                    <div className="h-4 w-2 bg-primary animate-blink mt-2" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#050a06] text-white font-display relative selection:bg-primary/30 selection:text-primary w-full min-h-screen">

            {/* Global Visuals */}
            <MatrixCanvas />
            <div className="fixed inset-0 z-[100] pointer-events-none crt-overlay opacity-30 mix-blend-overlay"></div>
            <div className="fixed inset-0 z-[100] pointer-events-none animate-scanline opacity-20"></div>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/95 border-b border-primary/20' : 'bg-transparent border-transparent'}`}>
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <MdSecurity className="text-3xl text-primary animate-pulse group-hover:rotate-12 transition-transform" />
                        <span className="text-xl font-bold tracking-[0.2em] font-mono">PRIVATE<span className="text-primary">_</span>PI</span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-6">
                        {!currentUser ? (
                            <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-white/10 transition-all font-mono"
                                >
                                    LOGIN
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-4 md:px-6 py-2 rounded-full bg-primary text-black text-xs md:text-sm font-bold hover:bg-white hover:text-black transition-all shadow-[0_0_15px_rgba(6,249,67,0.4)] font-mono flex items-center gap-2"
                                >
                                    <span className="hidden sm:inline">INITIALIZE</span>
                                    <span className="sm:hidden">START</span>
                                    <MdArrowForward />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 md:px-8 py-2 md:py-3 bg-primary/10 border border-primary/50 text-primary hover:bg-primary hover:text-black transition-all font-mono rounded font-bold text-xs md:text-sm"
                            >
                                SYSTEM READY &gt;&gt;
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative min-h-screen flex flex-col justify-center pt-32 pb-40 overflow-hidden contain-layout">
                {/* HUD Elements */}
                <div className="absolute top-32 left-10 hidden xl:block animate-in fade-in duration-1000">
                    <div className="p-4 border-l border-primary/30 space-y-4">
                        <HUDElement label="SYSTEM_COORD" value="40.7128N, 74.0060W" />
                        <HUDElement label="CORE_LOAD" value="12.4%" />
                        <HUDElement label="MEMORY" value="8.1 GB" />
                    </div>
                </div>
                <div className="absolute bottom-32 right-10 hidden xl:block animate-in fade-in duration-1000 z-30">
                    <div className="p-4 border-r border-primary/30 text-right space-y-4">
                        <HUDElement label="UPLINK" value="STABLE" />
                        <HUDElement label="PACKETS" value="2,401/s" />
                        <HUDElement label="THREATS" value="ZERO" />
                    </div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">

                    <DataCore />

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 mb-8 animate-in slide-in-from-bottom-5 fade-in duration-700 hover:bg-primary/10 transition-colors cursor-default relative">
                        {/* Corner markers for badge */}
                        <div className="hud-corner hud-corner-tl !border-primary/50"></div>
                        <div className="hud-corner hud-corner-br !border-primary/50"></div>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-mono text-primary tracking-widest uppercase">Uplink Stable // v2.4.0</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter leading-[0.95] md:leading-[0.85]">
                        <span className="block animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
                            PRIVATE
                        </span>
                        <span className="block text-primary text-shadow-glow animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
                            PI ENGINE
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 font-mono leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                        Gather intelligence. Detect vulnerabilities. Secure your perimeter.
                        <br />
                        <span className="text-xs opacity-50 block mt-4 tracking-widest uppercase">Distributed Offensive Intelligence Network</span>
                    </p>

                    <div className="relative z-30 flex flex-col md:flex-row gap-6 justify-center items-center animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500 pb-12">
                        <button
                            onClick={() => navigate(currentUser ? '/dashboard' : '/register')}
                            className="group relative px-10 py-5 bg-primary text-black font-bold text-lg rounded overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,249,67,0.6)]"
                        >
                            {/* Scanning line for button */}
                            <div className="absolute inset-x-0 h-[2px] bg-white opacity-40 animate-scan-ray pointer-events-none"></div>
                            <span className="relative z-10 flex items-center gap-3 tracking-widest uppercase">
                                <MdTerminal className="text-xl" />
                                {currentUser ? 'ACCESS CONSOLE' : 'INITIALIZE SYSTEM'}
                            </span>
                        </button>

                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                            <span className="flex items-center gap-1"><MdCheckCircle className="text-primary" /> ENCRYPTED</span>
                            <span className="w-px h-4 bg-gray-800"></span>
                            <span className="flex items-center gap-1"><MdCheckCircle className="text-primary" /> ANONYMOUS</span>
                        </div>
                    </div>
                </div>

                {/* Hero Bottom Fade */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#050a06] to-transparent z-20 pointer-events-none"></div>
            </section>

            <TechnicalSpecs />

            <IntelligenceFeed />

            {/* TERMINAL TRANSITION SECTION - VISUAL UPDATE */}
            <section className="py-20 relative z-0 contain-layout">
                <div className="container mx-auto px-6">
                    <div className="glass-panel max-w-4xl mx-auto rounded-lg overflow-hidden border border-primary/20 shadow-[0_0_100px_rgba(6,249,67,0.15)] transform hover:scale-[1.01] transition-transform duration-500 bg-black/95">
                        {/* Terminal Header */}
                        <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                            </div>
                            <div className="flex-1 text-center text-[10px] sm:text-xs text-gray-500 font-mono">
                                root@private-pi:~/modules
                            </div>
                        </div>
                        {/* Terminal Body */}
                        <div className="bg-black/90 p-6 font-mono text-sm h-64 overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                            <div className="space-y-1 text-gray-300 font-mono text-xs sm:text-sm">
                                <TypewriterEffect
                                    sequence={[
                                        { text: 'root@private-pi:~/modules# init_sequence --verbose', delay: 500, className: 'text-white' },
                                        { text: '[+] Loading core modules... DONE', delay: 1500, className: 'text-gray-400' },
                                        { text: '[+] Establishing secure uplink... CONNECTED', delay: 2500, className: 'text-gray-400' },
                                        { text: '[+] Syncing threat intelligence feeds... UPDATED', delay: 3500, className: 'text-gray-400' },
                                        { text: 'root@private-pi:~/modules# list_capabilities', delay: 4500, className: 'text-white mt-4 block' },
                                        { text: '-> Port Scanning [ACTIVE]', delay: 5500, className: 'text-primary/80 ml-4' },
                                        { text: '-> CVE Detection [ACTIVE]', delay: 5700, className: 'text-primary/80 ml-4' },
                                        { text: '-> Subdomain Enum [ACTIVE]', delay: 5900, className: 'text-primary/80 ml-4' },
                                        { text: '-> OSINT Recon [ACTIVE]', delay: 6100, className: 'text-primary/80 ml-4' },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section id="features" className="py-32 relative contain-layout">
                <div className="container mx-auto px-6">
                    <GlitchHeader text="T.O.O.L._F.R.A.M.E.W.O.R.K" subtext="Integrated Scanning Modules" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ServiceCard
                            icon={MdRadar}
                            title="Network Mapping"
                            desc="Deep packet inspection and port discovery using Nmap. Identify open ports, running services, and OS fingerprints with precision."
                            delay={0}
                        />
                        <ServiceCard
                            icon={MdBolt}
                            title="Vuln Scanning"
                            desc="Automated CVE detection via Nuclei templates. Find security holes in web applications before attackers do."
                            delay={100}
                        />
                        <ServiceCard
                            icon={MdGroup}
                            title="User Hunting"
                            desc="Track targets across 400+ social media platforms using Sherlock. Correlate identities and find digital footprints."
                            delay={200}
                        />
                        <ServiceCard
                            icon={MdGpsFixed}
                            title="Subdomain Enum"
                            desc="Passive reconnaissance to find hidden subdomains and expanding your attack surface visibility using Sublist3r."
                            delay={300}
                        />
                        <ServiceCard
                            icon={MdCode}
                            title="Tech Stack Detect"
                            desc="Analyze web technologies, CMS versions, and frameworks using WhatWeb logic to better understand your target."
                            delay={400}
                        />
                        <ServiceCard
                            icon={MdFingerprint}
                            title="Asset Fingerprint"
                            desc="Generate unique fingerprints for assets to track changes over time and alert on suspicious modifications."
                            delay={500}
                        />
                    </div>
                </div>
            </section>

            <PlatformPreview />

            {/* ARCHITECTURE FLOW */}
            <section className="py-32 bg-black/50 border-y border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0a0f0b]"></div>
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1">
                            <h2 className="text-4xl font-bold mb-6 font-mono text-primary">&lt;SYSTEM_FLOW /&gt;</h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                Private PI leverages a distributed, event-driven architecture. Requests are queued via <span className="text-white">Redis</span> and processed asynchronously by scalable <span className="text-white">Celery Workers</span>, ensuring the UI remains snappy even during intense scans.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded border border-white/5">
                                    <div className="p-2 bg-blue-500/20 rounded text-blue-400"><MdPublic /></div>
                                    <div>
                                        <h4 className="font-bold text-white">Frontend Client</h4>
                                        <p className="text-xs text-gray-400">React + Vite SPA</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded border border-white/5">
                                    <div className="p-2 bg-green-500/20 rounded text-green-400"><MdStorage /></div>
                                    <div>
                                        <h4 className="font-bold text-white">Message Broker</h4>
                                        <p className="text-xs text-gray-400">Redis In-Memory Queue</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded border border-white/5">
                                    <div className="p-2 bg-orange-500/20 rounded text-orange-400"><MdLayers /></div>
                                    <div>
                                        <h4 className="font-bold text-white">Analysis Engine</h4>
                                        <p className="text-xs text-gray-400">Python/Celery Workers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            {/* Diagram Representation */}
                            <div className="relative aspect-video bg-black/80 rounded-xl border border-primary/30 p-8 shadow-[0_0_50px_rgba(6,249,67,0.1)] flex items-center justify-center overflow-x-auto">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>

                                <div className="flex items-center gap-4 relative z-10 w-full justify-between">
                                    {/* Nodes */}
                                    <div className="flex flex-col items-center gap-2 group/node">
                                        <div className="w-16 h-16 rounded-xl bg-black border border-primary/20 flex items-center justify-center animate-float will-change-transform transform-gpu group-hover/node:border-primary/60 transition-colors">
                                            <MdPublic className="text-3xl text-white group-hover/node:text-primary transition-colors" />
                                            <div className="hud-corner hud-corner-tl !w-1 !h-1"></div>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Client_Link</div>
                                    </div>

                                    {/* Connection 1 */}
                                    <div className="h-0.5 flex-1 bg-white/5 relative mx-2">
                                        <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-[ping_1.5s_infinite] opacity-50"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent animate-progress origin-left"></div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 group/node">
                                        <div className="w-20 h-20 rounded-2xl bg-black border-2 border-primary shadow-[0_0_30px_rgba(6,249,67,0.2)] flex items-center justify-center relative group-hover/node:shadow-[0_0_50px_rgba(6,249,67,0.4)] transition-all">
                                            <MdStorage className="text-4xl text-primary animate-flicker" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                            <div className="hud-corner hud-corner-tr !w-2 !h-2"></div>
                                        </div>
                                        <div className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">Core_Redis</div>
                                    </div>

                                    {/* Connection 2 */}
                                    <div className="h-0.5 flex-1 bg-white/5 relative mx-2">
                                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-[ping_2s_infinite] opacity-50"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent animate-progress origin-left" style={{ animationDelay: '0.8s' }}></div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 group/node">
                                        <div className="w-16 h-16 rounded-xl bg-black border border-primary/20 flex items-center justify-center animate-float will-change-transform transform-gpu group-hover/node:border-primary/60 transition-colors" style={{ animationDelay: '1.2s' }}>
                                            <MdLayers className="text-3xl text-white group-hover/node:text-primary transition-colors" />
                                            <div className="hud-corner hud-corner-br !w-1 !h-1"></div>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Worker_Pool</div>
                                    </div>
                                </div>

                                <div className="absolute bottom-4 left-0 w-full text-center flex justify-center gap-8">
                                    <span className="text-[9px] font-mono text-primary/40 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                                        Real_time_Uplink
                                    </span>
                                    <span className="text-[9px] font-mono text-primary/40 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                                        Secure_Sandbox
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WORKFLOW STEPS */}
            <section className="py-32 relative contain-layout">
                <div className="container mx-auto px-6">
                    <GlitchHeader text="M.I.S.S.I.O.N___P.R.O.T.O.C.O.L" subtext="Operational Workflow" />

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            {[
                                { step: "01", title: "Target Acq", desc: "Define scope (IP/Domain).", icon: MdGpsFixed },
                                { step: "02", title: "Select Modules", desc: "Toggle Nmap, Nuclei, Sherlock.", icon: MdDataObject },
                                { step: "03", title: "Launch Scan", desc: "Async execution via Celery.", icon: MdNetworkCheck },
                                { step: "04", title: "Intel Report", desc: "View results & PDF export.", icon: MdDataUsage },
                            ].map((item, i) => (
                                <div key={i} className="group relative bg-[#0a0f0b] border border-white/10 p-6 rounded-xl hover:border-primary/50 transition-smooth hover:-translate-y-2">
                                    <div className="hud-corner hud-corner-tl !w-1 !h-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="hud-corner hud-corner-br !w-1 !h-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute -top-3 left-6 bg-primary text-black font-bold font-mono text-[10px] px-2 py-0.5 rounded tracking-tighter shadow-lg shadow-primary/20">
                                        PROTOCOL_{item.step}
                                    </div>
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-black transition-colors transform group-hover:rotate-[360deg] duration-700">
                                        <item.icon className="text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-white font-mono uppercase tracking-tight">{item.title}</h3>
                                    <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <GlobalMap />

            <FieldManual />

            {/* FOOTER CTA */}
            <section className="py-32 relative text-center overflow-hidden border-t border-white/5">
                <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="mb-8 inline-block px-4 py-1 rounded bg-primary/10 border border-primary/20 font-mono text-xs text-primary animate-pulse uppercase tracking-[0.3em]">
                        Operational Deployment Node
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter">READY TO <span className="text-primary italic text-shadow-glow">DEPLOY?</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg font-mono text-sm leading-relaxed">
                        Initialize your personal instance of Private PI today. Standardized offensive tools, unified command, and distributed execution.
                    </p>
                    <button
                        onClick={() => navigate(currentUser ? '/dashboard' : '/register')}
                        className="group relative px-12 py-5 bg-primary text-black font-bold text-xl rounded transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(6,249,67,0.5)] font-mono uppercase tracking-widest"
                    >
                        <div className="absolute inset-x-0 h-px bottom-0 bg-white/40 animate-scan-ray"></div>
                        {currentUser ? 'ACCESS CONSOLE' : 'INITIALIZE SYSTEM'}
                    </button>
                </div>
            </section>

            <footer className="bg-black pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 data-stream opacity-10"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                        <div className="col-span-1 md:col-span-2 space-y-8">
                            <div className="flex items-center gap-3">
                                <MdSecurity className="text-4xl text-primary animate-pulse" />
                                <span className="text-2xl font-bold tracking-[0.3em] font-mono">PRIVATE<span className="text-primary">_</span>PI</span>
                            </div>
                            <p className="text-gray-500 max-w-sm font-mono text-xs leading-relaxed uppercase">
                                Integrated Intelligence Operating System. <br />
                                Authorized personnel only. All access is logged and encrypted via AES-256-GCM protocols.
                            </p>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer group">
                                    <MdTerminal className="text-gray-500 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer group">
                                    <MdCode className="text-gray-500 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold font-mono text-sm text-white mb-6 uppercase tracking-widest border-l-2 border-primary pl-3">Protocols</h4>
                            <ul className="space-y-4 font-mono text-[10px] text-gray-500 uppercase">
                                <li onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Network Mapping</li>
                                <li onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Asset Discovery</li>
                                <li onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Vuln Scanning</li>
                                <li onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Identity OSINT</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold font-mono text-sm text-white mb-6 uppercase tracking-widest border-l-2 border-primary pl-3">Legal.sh</h4>
                            <ul className="space-y-4 font-mono text-[10px] text-gray-500 uppercase">
                                <li onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Privacy Policy</li>
                                <li onClick={() => navigate('/terms')} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Terms of Engagement</li>
                                <li onClick={() => navigate('/ethics')} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1 h-1 bg-white/20 rounded-full"></span> Ethical Framework</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-6">
                        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                            © 2026 PRIVATE_PI_SYSTEMS // [ SESSION_ID: {Math.random().toString(16).substring(2, 10).toUpperCase()} ]
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-mono text-primary uppercase">Heartbeat Stable</span>
                            </div>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors uppercase border border-white/10 px-3 py-1 rounded hover:border-primary/50"
                            >
                                [ BACK_TO_TOP ]
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
