import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/auth";
import './styles/NavBar.css';

export default function NavBar() {
    const { userId, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        // hook from auth
        logout();
        navigate("/login");
    }


    return (
        <nav className="navbar">
            {/* TODO: Add logo of sorts */}
            <NavLink to="/"> AMuvies</NavLink>
            <NavLink to="/" className="navbar-link"> Browse Movies</NavLink>
            {/* Only include watchlist links if the user is authorized */}
            {userId ?
                (<>
                    <NavLink to="/towatchlist" className="navbar-link">To-Watch List</NavLink>
                    <NavLink to="/completedwatchlist" className="navbar-link">Completed Watchlist</NavLink>
                    <NavLink to="/stats" className="navbar-link">My Statistics</NavLink>
                    <button onClick={handleLogout} className="navbar-link">Logout</button>

                </>) : (
                    <NavLink to="/login" className="navbar-link">Login</NavLink>

                )
            }

        </nav>
    );
}
