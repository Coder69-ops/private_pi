
import React, { useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = React.createContext();

// Base API prefix is configured in `apiClient`.

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
            apiClient.get('/user')
                .then(res => {
                    if (res?.data) {
                        setCurrentUser({ id: res.data.id, email: res.data.email });
                    } else {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user_id');
                        setCurrentUser(null);
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
        const res = await apiClient.post('/register', { email, password });
        const data = res.data;
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        setCurrentUser({ id: data.user_id, email });
        return data;
    }

    async function login(email, password) {
        const res = await apiClient.post('/login', { email, password });
        const data = res.data;
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
