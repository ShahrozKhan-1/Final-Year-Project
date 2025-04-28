import { useState, useEffect, useCallback } from "react";  // Add this line
import { jwtDecode } from "jwt-decode";


export const useUserRole = () => {
  const [role, setRole] = useState(null);

  const getRoleFromToken = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    
    try {
      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded); // DEBUG
      return decoded.role || null;
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  };

  useEffect(() => {
    // Initial check
    const initialRole = getRoleFromToken();
    setRole(initialRole);

    // Listen for storage changes
    const handleStorageChange = () => {
      const newRole = getRoleFromToken();
      setRole(newRole);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return role;
};