import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserRole } from "../auth"; // Assuming the custom hook is in this path

const AdminPage = () => {
    const [unverifiedTeachers, setUnverifiedTeachers] = useState([]);
    const role = useUserRole(); // Use the custom hook to get the role

    // Protect the page so only admins can access it
    if (role !== "admin") {
        return <div>You are not authorized to view this page.</div>;
    }

    useEffect(() => {
        fetchUnverifiedTeachers();
    }, []);

    const fetchUnverifiedTeachers = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                console.error("No access token found");
                return;
            }
            const response = await axios.get("http://127.0.0.1:8000/unverified-teachers/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUnverifiedTeachers(response.data);
        } catch (error) {
            console.error("Error fetching unverified teachers:", error.response?.data || error.message);
        }
    };

    const approveTeacher = async (teacherId) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                console.error("No access token found");
                return;
            }
            const response = await axios.patch(
                `http://127.0.0.1:8000/approve-teacher/${teacherId}/`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log("Teacher approved:", response.data);
            fetchUnverifiedTeachers();
        } catch (error) {
            console.error("Error approving teacher:", error.response?.data || error.message);
        }
    };

    return (
        <div>
            <h2>Admin Panel - Approve Teachers</h2>
            {unverifiedTeachers.length === 0 ? (
                <p>No teachers pending approval.</p>
            ) : (
                <ul>
                    {unverifiedTeachers.map((teacher) => (
                        <li key={teacher.id}>
                            {teacher.email}
                            <button onClick={() => approveTeacher(teacher.id)}>Approve</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminPage;
