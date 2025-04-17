import { useEffect, useState } from "react";
import axios from "axios";

const TeacherRequests = () => {
    const [sessions, setSessions] = useState([]);
    const token = localStorage.getItem("access_token");

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/sessions/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSessions(response.data);
        } catch (error) {
            console.error("Error fetching sessions:", error.response?.data || error);
        }
    };

    const handleApproval = async (sessionId, studentId, action) => {
        try {
            await axios.patch(
                `http://127.0.0.1:8000/sessions/manage-enrollments/${sessionId}/`,
                { student_id: studentId, action },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSessions([]); // clear old data to force re-render
            fetchSessions(); 
        } catch (error) {
            console.error("Error managing enrollment:", error.response?.data || error);
        }
    };
    

    return (
        <div>
            <h2>Manage Enrollments</h2>
            {sessions.map((session) => (
                <div key={session.id}>
                    <h3>{session.session_name}</h3>
                    <p>Pending Students:</p>
                    <ul>
                        {session.pending_students.map((student) => (
                            <li key={student.id}>
                                {student.email}
                                <button onClick={() => handleApproval(session.id, student.id, "approve")}>Approve</button>
                                <button onClick={() => handleApproval(session.id, student.id, "reject")}>Reject</button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default TeacherRequests;
