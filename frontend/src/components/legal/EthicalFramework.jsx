import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdVerifiedUser, MdArrowBack } from 'react-icons/md';

const EthicalFramework = () => {
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
                        <MdVerifiedUser className="text-4xl text-primary animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">ETHICAL_FRAMEWORK<span className="text-primary">.md</span></h1>
                    <p className="text-gray-500 uppercase tracking-widest text-xs">Mission Protocols</p>
                </div>

                <div className="space-y-12 text-gray-300 leading-relaxed font-sans text-sm md:text-base border-l border-white/5 pl-8 md:pl-12">
                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">/01/</span> DEFENSIVE INTENT
                        </h2>
                        <p>
                            Private PI is built for <span className="text-white font-bold">Defensive Security (Blue/Purple Teaming)</span>. Our tools are designed to identify weaknesses so they can be patched, not exploited. We actively discourage and block attempts to use this platform for black-hat activities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">/02/</span> RESPONSIBLE DISCLOSURE
                        </h2>
                        <p>
                            If you discover a vulnerability spread across public infrastructure using our tools, we advocate for Responsible Disclosure. Contact the vendor, provide reproduction steps, and allow reasonable time for remediation before any public release.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-3">
                            <span className="text-primary">/03/</span> COMMUNITY STANDARD
                        </h2>
                        <p>
                            We support open-source intelligence sharing. We contribute anonymized threat signatures back to the community to improve global detection rates, while protecting specific target identities.
                        </p>
                    </section>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-mono">
                        End of File // Integrity Check Passed
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EthicalFramework;
