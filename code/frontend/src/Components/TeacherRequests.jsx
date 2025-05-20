import { useEffect, useState } from "react";
import axios from "axios";

const TeacherRequests = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("access_token");

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/sessions/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Ensure sessions have pending_students array
            const formattedSessions = response.data.map(session => ({
                ...session,
                pending_students: session.pending_students || []
            }));
            setSessions(formattedSessions);
        } catch (error) {
            console.error("Error fetching sessions:", error);
            setError("Failed to load enrollment requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (sessionId, studentId, action) => {
        try {
            await axios.patch(
                `http://127.0.0.1:8000/sessions/manage-enrollments/${sessionId}/`,
                { student_id: studentId, action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local state instead of refetching
            setSessions(prev => prev.map(session => {
                if (session.id === sessionId) {
                    return {
                        ...session,
                        pending_students: session.pending_students.filter(
                            student => student.id !== studentId
                        )
                    };
                }
                return session;
            }));
        } catch (error) {
            console.error("Error managing enrollment:", error);
            setError("Failed to process request");
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Manage Enrollments</h2>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}
            
            {loading ? (
                <div>Loading enrollment requests...</div>
            ) : sessions.length === 0 ? (
                <div>No enrollment requests available</div>
            ) : (
                sessions.map((session) => (
                    <div key={session.id} className="mb-6 p-4 bg-white rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-2">{session.session_name}</h3>
                        <div className="mb-3 text-gray-600">
                            {session.pending_students.length === 0 ? (
                                "No pending enrollments"
                            ) : (
                                <>
                                    <p className="font-medium mb-2">Pending Students:</p>
                                    <ul className="space-y-2">
                                        {session.pending_students.map((student) => (
                                            <li key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span>{student.email}</span>
                                                <div className="space-x-2">
                                                    <button
                                                        onClick={() => handleApproval(session.id, student.id, "approve")}
                                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(session.id, student.id, "reject")}
                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default TeacherRequests;