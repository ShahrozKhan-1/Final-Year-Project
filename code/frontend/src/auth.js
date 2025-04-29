import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

export const useUserRole = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const getRoleFromToken = useCallback(() => {
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        
        try {
            const decoded = jwtDecode(token);
            console.log("Decoded token:", decoded);
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

    return { role, loading };
};