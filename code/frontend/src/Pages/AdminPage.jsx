import { useEffect, useState } from "react";
import axios from "axios";

const AdminPage = () => {
    const [teachers, setTeachers] = useState([]);
    const [message, setMessage] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "admin") {
            console.error("Unauthorized access. Redirecting...");
            return;
        }
        fetchUnverifiedTeachers();
    }, []);

    const fetchUnverifiedTeachers = async () => {
        let token = localStorage.getItem("access_token");  // ✅ Retrieve token before request
        console.log("Sending Token:", localStorage.getItem("access_token"));

        if (!token) {
            console.error("No access token found. Redirecting to login...");
            return;
        }
    
        try {
            const response = await axios.get("http://127.0.0.1:8000/unverified-teachers/", {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
    
            console.log("Request Headers Sent:", response.config.headers);
            setTeachers(response.data);
        } catch (error) {
            console.error("Error fetching teachers:", error.response?.data || error);
    
            // If token is invalid or expired, try refreshing it
            if (error.response?.data?.code === "token_not_valid") {
                await refreshToken();
                fetchUnverifiedTeachers();  // Retry after refreshing token
            }
        }
    };
    
    
    

    const approveTeacher = async (teacherId) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/approve-teacher/${teacherId}/`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Teacher approved successfully!");
            fetchUnverifiedTeachers(); // Refresh the list
        } catch (error) {
            console.error("Error approving teacher:", error);
        }
    };

    return (
        <div>
            <h2>Admin Panel - Approve Teachers</h2>
            {message && <p style={{ color: "green" }}>{message}</p>}
            <ul>
                {teachers.length === 0 ? <p>No unverified teachers.</p> : teachers.map((teacher) => (
                    <li key={teacher.id}>
                        {teacher.email} 
                        <button onClick={() => approveTeacher(teacher.id)}>Approve</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminPage;
