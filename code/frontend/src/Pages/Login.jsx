import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });  // Use email instead of username
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login/", formData);
      console.log("Login successful:", response.data);

      const { access, refresh, user } = response.data;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("userRole", user.is_student ? "student" : "teacher");
      localStorage.setItem("username", user.username);  // Store username for frontend use

      if (user.is_student) {
        navigate("/student-dashboard");
      } else if (user.is_teacher) {
        navigate("/teacher-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data);
      alert(error.response?.data?.detail || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
