import { useState, useMemo, useCallback, type ReactNode } from "react";
import { AuthContext } from "./auth";

// All children who want to access the state and context of this Auth needs to be wrapped in the AuthProvider component
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    // User state (when state is null it means not logged in or invalid)
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    const login = useCallback((apikey: string, id: number) => {
        setApiKey(apikey);
        setUserId(id);
    }, []);

    const logout = useCallback(() => {
        setApiKey(null);
        setUserId(null);
    }, []);

    // Memoize the context to prevent unnescesarry re-renders
    const contextValue = useMemo(() => ({
        apiKey,
        userId,
        login,
        logout
    }), [apiKey, userId, login, logout]);

    // Return all the children in AuthContext Component
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

