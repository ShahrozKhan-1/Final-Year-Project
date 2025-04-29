import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const response = await axios.post("http://127.0.0.1:8000/login/", { 
                email, 
                password 
            });

            if (!response.data.access) {
                throw new Error("No access token received");
            }

            // Store tokens
            localStorage.setItem("access_token", response.data.access);
            if (response.data.refresh) {
                localStorage.setItem("refresh_token", response.data.refresh);
            }

            // Wait for storage to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            // Navigate based on role
            const decoded = jwtDecode(response.data.access);
            switch (decoded.role) {
                case "student":
                    navigate("/student-dashboard", { replace: true });
                    break;
                case "teacher":
                    navigate("/teacher-dashboard", { replace: true });
                    break;
                case "admin":
                    navigate("/admin-panel", { replace: true });
                    break;
                default:
                    navigate("/", { replace: true });
            }

        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.detail || 
                   err.response?.data?.error || 
                   "Login failed. Please try again.");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
};

export default Login;