import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ role }) => {
  const token = localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("userRole");

  if (!token) return <Navigate to="/login" />;

  if (role && role !== userRole) {
    return <Navigate to="/" />; // Redirect to home if role doesn't match
  }

  return <Outlet />;
};

export default ProtectedRoute;
