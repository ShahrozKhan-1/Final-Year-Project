import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowPathIcon, CheckBadgeIcon, ClockIcon, CalendarIcon, ArrowLeftIcon, } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";


const EnrollSession = () => {
  const [availableSessions, setAvailableSessions] = useState([]);
  const [enrolledSessions, setEnrolledSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Step 2

  const fetchSessions = async () => {
    const token = localStorage.getItem("access_token");
    setLoading(true);
    try {
      const [allSessionsRes, enrolledRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://127.0.0.1:8000/sessions/enrolled/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const enrolledSessionIds = new Set(enrolledRes.data.map(session => session.id));
      const filteredSessions = allSessionsRes.data.filter(session => !enrolledSessionIds.has(session.id));

      setAvailableSessions(filteredSessions);
      setEnrolledSessions(enrolledRes.data);
    } catch (error) {
      console.error("Error fetching sessions:", error.response?.data || error);
      setMessage("Failed to load sessions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const requestEnrollment = async (sessionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.patch(
        `${'http://127.0.0.1:8000'}/sessions/enroll-request/${sessionId}/`, 
        {}, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(response.data.message);
      await fetchSessions();
    } catch (error) {
      setMessage("Error requesting enrollment.");
      console.error(error.response?.data || error);
    }
  };

  // Simple debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedRequestEnrollment = debounce(requestEnrollment, 300);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/student-dashboard")} // Adjust this path if needed
            className="flex items-center gap-2 text-blue-600 font-medium hover:underline"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Dashboard
          </button>
        </div>
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-gray-800 mb-6"
          >
            Available Study Sessions
          </motion.h2>
          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 rounded-lg ${
                message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              } inline-block`}
            >
              {message}
            </motion.div>
          )}
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-64"
          >
            <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin" />
          </motion.div>
        ) : (
          <motion.ul 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {availableSessions.length > 0 ? (
              availableSessions.map((session) => (
                <motion.li
                  key={session.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-lg shadow-xl hover:shadow-2xl transform transition-all duration-300"
                >
                  <div className="p-6 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg shadow-md hover:shadow-2xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <ClockIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">{session.session_name}</h3>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">{session.description}</p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        {new Date(session.start_time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{new Date(session.start_time).toLocaleTimeString()}</span>
                        <span className="mx-2">-</span>
                        <span>{new Date(session.end_time).toLocaleTimeString()}</span>
                      </div>
                      {/* Displaying time_limit_minutes */}
                      {session?.time_limit_minutes ? (
                        <div className="flex items-center text-sm">
                          <ClockIcon className="mr-2" size={18} />
                          {session.time_limit_minutes} mins
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-500">
                          No time limit
                        </div>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => debouncedRequestEnrollment(session.id)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                    >
                      <CheckBadgeIcon className="h-5 w-5" />
                      Enroll Now
                    </motion.button>
                  </div>
                </motion.li>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="inline-block p-8 bg-white rounded-lg shadow-lg">
                  <CheckBadgeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    No Available Sessions
                  </h3>
                  <p className="text-gray-600">
                    All current sessions have been enrolled. Check back later!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.ul>
        )}
      </motion.div>
    </div>
  );
};

export default EnrollSession;
      