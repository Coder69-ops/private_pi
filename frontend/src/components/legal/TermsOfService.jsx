import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdGavel, MdArrowBack } from 'react-icons/md';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050a06] text-white font-mono p-8 selection:bg-primary/30 selection:text-primary relative overflow-hidden">
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
                        <MdGavel className="text-4xl text-primary animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">TERMS_OF_ENGAGEMENT<span className="text-primary">.txt</span></h1>
                    <p className="text-gray-500 uppercase tracking-widest text-xs">Agreement Protocol v2.4</p>
                </div>

                <div className="space-y-12 text-gray-300 leading-relaxed font-sans text-sm md:text-base border-l border-white/5 pl-8 md:pl-12">
                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">01.</span> AUTHORIZED USE
                        </h2>
                        <p className="mb-4">
                            By initializing the Private PI system, you agree to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-primary">
                            <li>Only scan assets for which you have explicit, written authorization.</li>
                            <li>Not use the platform for DDo, malicious payload delivery, or unauthorized extraction.</li>
                            <li>Bear full legal responsibility for any damages caused by your scans.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">02.</span> LIABILITY DISCLAIMER
                        </h2>
                        <p>
                            Private PI provides raw intelligence "AS IS". We are not liable for false positives, system outages during scans, or the consequences of acting upon the provided intelligence. You acknowledge that offensive security tools carry inherent risks to target availability.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">03.</span> ACCOUNT TERMINATION
                        </h2>
                        <p>
                            We reserve the right to terminate access immediately if:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-primary">
                            <li>Scanning of government or critical infrastructure without verified clearance is detected.</li>
                            <li>Abusive patterns (botnet-like behavior) are identified.</li>
                        </ul>
                    </section>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-mono">
                        End of File // Digital Signature Verified
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
