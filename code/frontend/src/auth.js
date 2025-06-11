import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const getRoleFromToken = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded);

      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) {
        // Token has expired
        localStorage.removeItem("access_token");
        return null;
      }

      setIsTokenValid(true);
      return decoded.role || null;
    } catch (error) {
      console.error("Token decode error:", error);
      localStorage.removeItem("access_token");
      return null;
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const currentRole = getRoleFromToken();
      setRole(currentRole);
      setLoading(false);
      setIsTokenValid(!!currentRole);
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === "access_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getRoleFromToken]);

  return { role, loading, isTokenValid };
};
