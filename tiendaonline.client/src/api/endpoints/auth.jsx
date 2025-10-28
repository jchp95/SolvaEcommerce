/* eslint-disable no-empty */
import { jwtDecode } from 'jwt-decode';
import apiClient from '../client';

const LS_KEYS = {
    TOKEN: 'auth_token',
    USER: 'auth_user',
};

/** Opcional: setear/limpiar auth header en el axios instance */
export const setAuthHeader = (token) => {
    try {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        console.log('[authService] setAuthHeader ->', token);
    } catch { }
};

export const clearAuthHeader = () => {
    try {
        delete apiClient.defaults.headers.common.Authorization;
        console.log('[authService] clearAuthHeader');
    } catch { }
};

export const loginUser = async (email, password) => {
    try {
        const { data } = await apiClient.post('/Auth/login', { email, password });

        console.log('[authService] Respuesta completa del login:', data);

        // ✅ CORREGIDO: El token está en data.data.token según la estructura de la respuesta
        const token = data?.data?.token;
        
        if (!token) {
            console.error('[authService] Login sin token en respuesta. Estructura completa:', data);
            throw new Error('Login sin token');
        }

        const user = getUserFromToken(token) || { email, roles: [] };
        const message = data?.message ?? 'Login exitoso';

        console.log('[authService] Usuario decodificado:', user);

        return { token, user, message };
    } catch (err) {
        console.error('[authService] Error en loginUser:', err?.response?.data || err);
        throw err; // ✅ IMPORTANTE: Re-lanzar el error para que Redux lo capture
    }
};

export const logoutUser = () => {
    try {
        localStorage.removeItem(LS_KEYS.TOKEN);
        localStorage.removeItem(LS_KEYS.USER);
    } catch (e) {
        console.warn('logoutUser: no se pudo limpiar localStorage', e);
    } finally {
        clearAuthHeader();
    }
};

export const saveSession = (token, user) => {
    try {
        localStorage.setItem(LS_KEYS.TOKEN, token);
        if (user) localStorage.setItem(LS_KEYS.USER, JSON.stringify(user));
        setAuthHeader(token);
    } catch (e) {
        console.warn('saveSession: localStorage no disponible', e);
    }
};

export const getSavedToken = () => {
    try {
        const t = localStorage.getItem(LS_KEYS.TOKEN);
        return t;
    } catch (e) {
        console.warn('getSavedToken: localStorage no disponible', e);
        return null;
    }
};

export const getSavedUser = () => {
    try {
        const s = localStorage.getItem(LS_KEYS.USER);
        const user = s ? JSON.parse(s) : null;
        return user;
    } catch (e) {
        console.warn('getSavedUser: no se pudo leer/parsear', e);
        return null;
    }
};

export const getUserFromToken = (token) => {
    try {
        const p = jwtDecode(token);
        console.log('[authService] Token decodificado:', p);
        
        // ✅ MEJORADO: Manejar múltiples formas de roles en el token
        let roles = [];
        
        // Caso 1: roles como array en claim personalizado
        if (p?.roles && typeof p.roles === 'string') {
            roles = p.roles.split(',').map(role => role.trim());
        }
        // Caso 2: role como string individual
        else if (p?.role) {
            roles = Array.isArray(p.role) ? p.role : [p.role];
        }
        // Caso 3: roles en claim estándar de .NET
        else if (p?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
            const roleClaim = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            roles = Array.isArray(roleClaim) ? roleClaim : [roleClaim];
        }

        const user = {
            id: p?.sub ?? p?.nameid ?? null,
            email: p?.email ?? p?.unique_name ?? null,
            firstName: p?.firstName ?? null,
            lastName: p?.lastName ?? null,
            roles: roles,
            isActive: p?.isActive === 'true' || p?.isActive === true
        };

        console.log('[authService] Usuario extraído del token:', user);
        return user;
    } catch (e) {
        console.error('Error al decodificar el token:', e);
        return null;
    }
};