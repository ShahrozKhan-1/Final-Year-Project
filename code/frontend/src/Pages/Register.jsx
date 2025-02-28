import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
      e.preventDefault();
      try {
          const response = await axios.post("http://127.0.0.1:8000/register/", {
              username,
              email,
              password,
              role,
          });
  
          console.log("Success:", response.data);
          setMessage("Registration successful! Now login.");
          navigate("/login");
      } catch (err) {
          console.error("Error:", err.response?.data);
          setMessage(err.response?.data?.error || "Registration failed. Try again.");
      }
  };
  

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <input type="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>
                <button type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Register;
