
import React, { useContext, useState, useEffect } from 'react';

const AuthContext = React.createContext();

// Use relative path for production (served via nginx at same domain)
// For local dev, can override with VITE_API_URL=/api to match docker-compose routing
const API_URL = import.meta.env.VITE_API_URL || '/api/backend';

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        
        if (token && userId) {
            // Verify token is still valid by checking user endpoint
            fetch(`${API_URL}/backend/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    // Token expired or invalid
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_id');
                    setCurrentUser(null);
                }
            })
            .then(data => {
                if (data) {
                    setCurrentUser({ id: data.id, email: data.email });
                }
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_id');
                setCurrentUser(null);
            })
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    async function signup(email, password) {
        const response = await fetch(`${API_URL}/backend/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            const err = new Error(error.detail || 'Registration failed');
            err.code = error.detail;
            throw err;
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        setCurrentUser({ id: data.user_id, email });
        return data;
    }

    async function login(email, password) {
        const response = await fetch(`${API_URL}/backend/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            const err = new Error(error.detail || 'Login failed');
            err.code = error.detail;
            throw err;
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        setCurrentUser({ id: data.user_id, email });
        return data;
    }

    async function logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        setCurrentUser(null);
    }

    async function loginWithGoogle() {
        throw new Error('Google login not available. Please use email/password.');
    }

    const value = {
        currentUser,
        login,
        signup,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
