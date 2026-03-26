import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'AUTH_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'AUTH_LOADED':
            return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
        case 'AUTH_FAILED':
            localStorage.removeItem('token');
            return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false };
        case 'LOGOUT':
            localStorage.removeItem('token');
            return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false };
        case 'UPDATE_USER':
            return { ...state, user: { ...state.user, ...action.payload } };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const refreshUser = useCallback(async () => {
        try {
            const { data } = await authAPI.getMe();
            dispatch({ type: 'AUTH_LOADED', payload: data.data.user });
        } catch {
            dispatch({ type: 'AUTH_FAILED' });
        }
    }, [dispatch]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = useCallback(async (credentials) => {
        const { data } = await authAPI.login(credentials);
        dispatch({ type: 'AUTH_SUCCESS', payload: data });
        return data;
    }, [dispatch]);

    const signup = useCallback(async (userData) => {
        const { data } = await authAPI.signup(userData);
        dispatch({ type: 'AUTH_SUCCESS', payload: data });
        return data;
    }, [dispatch]);

    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch (_) { }
        dispatch({ type: 'LOGOUT' });
    }, [dispatch]);

    const updateUser = useCallback((updates) => dispatch({ type: 'UPDATE_USER', payload: updates }), [dispatch]);

    return (
        <AuthContext.Provider value={{ ...state, login, signup, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
