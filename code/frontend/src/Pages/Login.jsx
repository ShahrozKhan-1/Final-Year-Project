import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/login/", { email, password });
      
      // Verify the response structure
      console.log("Login response:", response.data);
      
      // Store tokens
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
  
      // Immediate redirect based on response data
      if (response.data.user?.role === "student") {
        navigate("/student-dashboard");
      } 
      else if (response.data.user?.role === "teacher") {
        navigate("/teacher-dashboard");
      }
      // Add other role checks...
      
    } catch (err) {
      console.error("Login error:", err.response?.data);
      setError(err.response?.data?.error || "Login failed");
    }
  };

  
  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;
