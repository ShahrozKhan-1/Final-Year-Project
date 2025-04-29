import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserRole } from "../auth";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
    const [unverifiedTeachers, setUnverifiedTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { role, loading: roleLoading } = useUserRole(); // Destructure properly
    const navigate = useNavigate();

    useEffect(() => {
        // Don't proceed if we're still loading the role
        if (roleLoading) return;

        const token = localStorage.getItem("access_token");
        
        // If no token or role isn't admin, redirect
        if (!token || role !== "admin") {
            navigate("/login");
            return;
        }

        // Only fetch data if we have a valid admin token
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    "http://127.0.0.1:8000/unverified-teachers/",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setUnverifiedTeachers(response.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("access_token");
                    navigate("/login");
                } else {
                    setError("Failed to load teacher data");
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [role, roleLoading, navigate]);

    const approveTeacher = async (teacherId) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.patch(
                `http://127.0.0.1:8000/approve-teacher/${teacherId}/`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            // Refresh the list after approval
            const response = await axios.get(
                "http://127.0.0.1:8000/unverified-teachers/",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setUnverifiedTeachers(response.data);
        } catch (error) {
            console.error("Error approving teacher:", error);
            setError("Failed to approve teacher");
        }
    };

    if (roleLoading || loading) {
        return <div>Loading admin dashboard...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="admin-container">
            <h2>Admin Panel - Approve Teachers</h2>
            {unverifiedTeachers.length === 0 ? (
                <p>No teachers pending approval.</p>
            ) : (
                <ul className="teacher-list">
                    {unverifiedTeachers.map((teacher) => (
                        <li key={teacher.id} className="teacher-item">
                            <span>{teacher.email}</span>
                            <button
                                onClick={() => approveTeacher(teacher.id)}
                                className="approve-btn"
                            >
                                Approve
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminPage;