// Auth state for the dashboard: holds the API token and exposes login/logout.
//
// The token is mirrored into a cookie (see ./token) so it survives reloads. The
// `token` value here drives whether the app shows the login screen or the
// dashboard — when it is null, the cookie was empty and the user must sign in.

import React, {createContext, useCallback, useContext, useMemo, useState} from "react";

import {clearToken, getToken, setToken} from "./token";

interface AuthContextValue {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    // Seed from the cookie so a returning user skips the login screen.
    const [token, setTokenState] = useState<string | null>(() => getToken());

    const login = useCallback((next: string) => {
        const trimmed = next.trim();
        setToken(trimmed);
        setTokenState(trimmed);
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setTokenState(null);
    }, []);

    const value = useMemo(() => ({token, login, logout}), [token, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}
