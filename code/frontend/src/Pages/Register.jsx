import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "", // Added email field
    password: "",
    confirmPassword: "",
    role: "student", // Default role selection
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/register/", {
        username: formData.username,
        email: formData.email, // Send email
        password: formData.password,
        is_student: formData.role === "student",
        is_teacher: formData.role === "teacher",
      });

      alert("Registration successful! You can now log in.");
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Registration failed:", error.response?.data);
      alert("Registration failed! Please check your details and try again.");
    }
    console.log("Sending data:", {
      username: formData.username,
      password: formData.password,
      is_student: formData.role === "student",
      is_teacher: formData.role === "teacher",
    });
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />

        {/* Role Selection */}
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
