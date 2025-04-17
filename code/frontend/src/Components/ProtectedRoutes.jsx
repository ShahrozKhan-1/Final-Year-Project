import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ role }) => {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;

  if (role && role !== userRole) {
    return <Navigate to="/" />; 
  }

  return <Outlet />;
};

export default ProtectedRoute;
