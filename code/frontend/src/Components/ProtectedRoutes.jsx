import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useUserRole } from "../auth"; // Custom hook to get role

// ProtectedRoute Component
const ProtectedRoute = ({ roleRequired, children }) => {
  const userRole = useUserRole(); // Get role from localStorage or API

  if (userRole === null) {
    return <Navigate to="/login" />;
  }

  if (userRole !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
};

// Pages
const StudentPage = () => <div>Student Dashboard</div>;
const TeacherPage = () => <div>Teacher Dashboard</div>;
const AdminPage = () => <div>Admin Dashboard</div>;
const Login = () => <div>Login Page</div>;
const HomePage = () => <div>Welcome to SmartAssess</div>; // Add this

// App
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
