import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserRole } from '../auth';
import { ArrowLeft, Clock, BookOpen, CheckCircle, Rocket, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SessionDetails() {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const token = localStorage.getItem("access_token");

  const handleAttempt = async (testId) => {
    navigate(`/student/attempt-test/${testId}`);
  };

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (roleLoading) return;
    
    if (role !== "student") {
      navigate("/login");
      return;
    }
    
    const fetchSessionAndTests = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(
          `http://127.0.0.1:8000/session/${sessionId}/detail/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) throw new Error("Failed to fetch session details");
        
        const data = await response.json();
        console.log("Session data:", data);
        setSession(data.session);
        setTests(data.unattempted_tests);
      } catch (err) {
        console.error(`Error fetching session ${sessionId}:`, err);
        setError(`Failed to load session details`);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndTests();
  }, [sessionId, role, roleLoading, navigate, token]);

  if (roleLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-xl font-semibold text-white flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Rocket className="text-blue-400" />
          </motion.div>
          Loading Session Details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 p-4">
        <div className="text-red-400 bg-gray-800 p-6 rounded-xl shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header with glowing border */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 p-4 border border-blue-500/30 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm"
        >
          <motion.button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors group"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          <motion.button
            onClick={() => navigate("/student/attempted-tests")}
            className="relative bg-gradient-to-r from-blue-900 to-blue-800 font-medium px-6 py-2.5 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            whileHover={{ scale: 1.05 }}
        >
            {/* Background layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-800" />
            
            {/* Button content */}
            <span className="relative z-10 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-200" />
                <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                    Attempted Tests
                </span>
            </span>
            
            {/* Hover effect layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>
        </motion.div>

        {/* Session Details Card */}
        {session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/60 border border-blue-500/20 rounded-xl p-8 mb-8 shadow-2xl backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 opacity-30" />
            <div className="relative z-10">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-800 to-purple-800 rounded-xl shadow-lg">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-3 bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                      {session.session_name}
                    </h1>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    {session.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/60 border border-blue-500/20 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden"
        >
          <div className="p-6 border-b border-blue-500/20">
            <h2 className="text-2xl font-bold text-black flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                🚀 Available Tests
              </span>
            </h2>
          </div>

          {tests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex flex-col items-center">
                <Rocket className="text-gray-400 mb-3 animate-float" size={32} />
                <p className="text-gray-300 text-lg font-light mb-4">
                  No tests available yet. Check back later!
                </p>
                <div className="flex justify-center space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-blue-500/20">
              {tests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-6 hover:bg-gray-750/50 transition-colors duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-black">
                        {test.title}
                      </h3>
                      <div className="flex items-center text-sm">
                        {/* <Clock className="mr-2" size={18} /> */}
                        <p className="font-bold">Created at:  </p> 
                         {test.created_at} 
                      </div>
                    </div>
                    
                    <p className="text-gray-500 mb-6">{test.description}</p>
                    
                    <div className="flex justify-end">
                      <motion.button
                        onClick={() => handleAttempt(test.id)}
                        className="relative bg-gradient-to-r p-2 bg-red-500 from-green-500 to-emerald-600 text-black px-6 py-2.5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="relative z-10 flex items-center gap-2 font-medium">
                          <span>Start Attempt</span>
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Global hover effect layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -inset-24 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
}