import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useUserRole } from "../auth"; // Your custom hook for user role

// ProtectedRoute Component
const ProtectedRoute = ({ roleRequired, children }) => {
  const userRole = useUserRole(); // Get user role from custom hook

  if (userRole === null) {
    // If no token or invalid token, redirect to login
    return <Navigate to="/login" />;
  }

  if (userRole !== roleRequired) {
    // If the user does not have the required role, redirect to home or some other page
    return <Navigate to="/" />;
  }

  return children; // Allow access to the protected component
};

// Your Pages
const StudentPage = () => <div>Student Dashboard</div>;
const TeacherPage = () => <div>Teacher Dashboard</div>;
const AdminPage = () => <div>Admin Dashboard</div>;
const Login = () => <div>Login Page</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute roleRequired="student">
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute roleRequired="teacher">
              <TeacherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
