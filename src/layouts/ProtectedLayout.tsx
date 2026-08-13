import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/auth";

export default function ProtectedLayout() {
    const { apiKey } = useAuth();
    const location =  useLocation();

    // If the user is not authorized redirect to the login page
    // replace prevents user from accessing page by pressing back button
    if (!apiKey) {
        return (
            <Navigate
                to="/login"
                replace
                state={{from: location}}
            />
        );
    }

    return <Outlet />;
};