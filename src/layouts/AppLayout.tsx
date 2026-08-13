import "./styles/AppLayout.css";
import { Outlet } from "react-router";
import NavBar from "../components/NavBar";

export default function AppLayout() {
    return (
        <div className="app-layout">
            <NavBar />
            <div className="main-content">
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}