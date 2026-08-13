// Layout of public pages like login
import './styles/AuthLayout.css';

import { Outlet } from "react-router";

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <main>
                <Outlet />
            </main>
        </div>
    );
}