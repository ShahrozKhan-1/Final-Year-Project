import React from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "../auth"; // Adjust the path if needed

const ProtectedRoute = ({ roleRequired, children }) => {
  const { role, loading, isTokenValid } = useUserRole();

  if (loading) return null; // or a loading spinner

  if (!isTokenValid || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
