import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSecurity, MdArrowBack } from 'react-icons/md';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050a06] text-white font-mono p-8 selection:bg-primary/30 selection:text-primary relative overflow-hidden">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            <div className="max-w-4xl mx-auto relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-primary/50 hover:text-primary transition-colors mb-12 uppercase tracking-widest text-xs"
                >
                    <MdArrowBack /> Return to Base
                </button>

                <div className="mb-12 border-b border-primary/20 pb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                        <MdSecurity className="text-4xl text-primary animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">PRIVACY_POLICY<span className="text-primary">.sh</span></h1>
                    <p className="text-gray-500 uppercase tracking-widest text-xs">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="space-y-12 text-gray-300 leading-relaxed font-sans text-sm md:text-base border-l border-white/5 pl-8 md:pl-12">
                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">01.</span> DATA COLLECTION
                        </h2>
                        <p className="mb-4">
                            Private PI operates on a strict <span className="text-white font-bold">No-Logs Policy</span> regarding scan targets. We do not persistently store:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-primary">
                            <li>Target IP addresses or domains post-session.</li>
                            <li>Vulnerability scan results (stored temporarily in volatile Redis cache only).</li>
                            <li>User keystrokes or behavioral analytics.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">02.</span> INFRASTRUCTURE
                        </h2>
                        <p>
                            All interactions are routed through ephemeral containers. Once a session is terminated or a report is generated, the container is destroyed, wiping all localized data. Metadata required for billing (API usage counts) is stored in encrypted, hashed formats.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">03.</span> THIRD_PARTY_COMMS
                        </h2>
                        <p>
                            We utilize custom JWT-based authentication. Your password is hashed with bcrypt and never stored in plaintext. No scan data is ever shared with third parties, law enforcement, or advertisers unless compelled by a verified court order.
                        </p>
                    </section>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-mono">
                        End of File // Encryption: AES-256
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
