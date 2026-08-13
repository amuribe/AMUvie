import { createContext, useContext } from "react";
import type { AuthContextType } from "../types/types.ts";

// Create the auth context initialized to null
export const AuthContext = createContext<AuthContextType | null>(null);

// Handles when AuthContext's value is null
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context == null) {
        throw new Error("useAuth was called without a provided value");
    }
    return context;
}
