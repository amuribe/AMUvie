import './styles/Login.css';
import { useState, type SubmitEvent } from "react";
import { useAuth } from '../context/auth';
import { useNavigate } from "react-router";
import { apiRequest } from '../utils/api';
import type { AuthResponse } from '../types/types';

export default function Login() {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    // If there is an error message this state will change(not equal null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    // get state and context from auth
    const { login } = useAuth();
    const navigate = useNavigate();


    const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Clear the errors from the previous submission if any occured
        setErrorMsg(null);

        try {
            // Use helper function to make the POST /users/session request in the API
            const data = await apiRequest<AuthResponse>("/users/session", "POST", { username, password });

            // Make sure an apikey and user id was returned
            if (data.api_key && data.id) {
                // Success: Log the user in and navigate to the movies page
                login(data.api_key, data.id);
                // Navigate to the movies page
                navigate('/');

            }

        } catch (error) {
            // TODO: error page maybe
            console.error("Error logging in", error);
            // If an error of type Error was thrown update state to the error message returned from the api request
            if (error instanceof Error) {
                setErrorMsg(error.message);
            }


        }

    };

    return (
        <div className='login-container'>
            <h1>Login to AMUvie</h1>
            {errorMsg && (
                <div className="error-message" >
                    {errorMsg}
                </div>
            )}
            <form onSubmit={handleLogin} className='form-component' noValidate>
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" name="submit">Login</button>
            </form>
        </div>
    );
}