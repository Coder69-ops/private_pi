
import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { MdSecurity, MdLock, MdEmail, MdVpnKey } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { login, signup, loginWithGoogle } = useAuth();
    const { addToast } = useToast();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (!isLogin && passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);

            if (isLogin) {
                await login(emailRef.current.value, passwordRef.current.value);
                addToast("ACCESS GRANTED. WELCOME OPERATOR.", "success");
            } else {
                await signup(emailRef.current.value, passwordRef.current.value);
                addToast("ACCOUNT CREATED. PROCEEDING TO OPERATIONS.", "success");
            }
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            let msg = isLogin ? 'Failed to sign in.' : 'Failed to create an account.';

            // Map common Firebase errors to user-friendly messages
            if (err.code === 'auth/email-already-in-use') msg = 'Email is already registered.';
            if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
            if (err.code === 'auth/operation-not-allowed') msg = 'Email/Password login is currently disabled by administrator.';
            if (err.code === 'auth/invalid-credential') msg = 'Invalid credentials provided.';

            setError(msg);
            addToast("AUTHENTICATION FAILED.", "error");
        }
        setLoading(false);
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            addToast("IDENTITY VERIFIED. ACCESS GRANTED.", "success");
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
            setError('Failed to sign in with Google.');
            addToast("IDENTITY VERIFICATION FAILED.", "error");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020402] relative overflow-hidden font-mono px-4">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(#06f943 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scanline"></div>

            <div className="glass-panel p-8 md:p-12 rounded-xl w-full max-w-md relative z-10 border border-primary/30 shadow-[0_0_50px_rgba(6,249,67,0.1)]">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50 animate-pulse">
                        <MdSecurity className="text-4xl text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">
                        {isLogin ? 'ACCESS CONTROL' : 'NEW OPERATOR'}
                    </h2>
                    <p className="text-gray-400 text-xs uppercase tracking-[0.2em]">Restricted Personnel Only</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <MdEmail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors text-xl" />
                        <input
                            type="email"
                            ref={emailRef}
                            required
                            placeholder="OPERATOR ID (EMAIL)"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <div className="relative group">
                        <MdVpnKey className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors text-xl" />
                        <input
                            type="password"
                            ref={passwordRef}
                            required
                            placeholder="ACCESS CODE"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600"
                        />
                    </div>

                    {!isLogin && (
                        <div className="relative group">
                            <MdLock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors text-xl" />
                            <input
                                type="password"
                                ref={passwordConfirmRef}
                                required
                                placeholder="CONFIRM CODE"
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600"
                            />
                        </div>
                    )}

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(6,249,67,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>{isLogin ? <><MdLock /> AUTHENTICATE</> : <><MdSecurity /> ENLIST OPERATOR</>}</>
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs text-primary hover:text-white transition-colors uppercase tracking-widest border-b border-dashed border-primary/50 pb-1"
                        >
                            {isLogin ? "Request New Credentials" : "Back to Login"}
                        </button>
                    </div>
                </form>

                <div className="my-8 flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-gray-500 text-xs uppercase">Or Connect Via</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
                >
                    <FcGoogle className="text-xl" /> Google Identity
                </button>

                <div className="mt-8 text-center text-xs text-gray-600">
                    SECURE CONNECTION ESTABLISHED • AES-256 ENCRYPTED
                </div>
            </div>
        </div>
    );
}
