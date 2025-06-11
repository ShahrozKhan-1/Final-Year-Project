"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"

const COLORS = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

const SessionResultChart = ({ sessionId }) => {
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`http://127.0.0.1:8000/teacher/session/${sessionId}/results/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        setResultData(response.data)
      } catch (error) {
        console.error("Error fetching session result:", error)
        setError("Failed to load session results")
        // Mock data for demonstration
        setResultData({
          total_students: 25,
          session_name: "Advanced Mathematics",
          students: [
            { name: "Alice Johnson", average_score: 92, tests_attempted: 3, last_attempt: "2024-01-15" },
            { name: "Bob Smith", average_score: 87, tests_attempted: 2, last_attempt: "2024-01-14" },
            { name: "Carol Davis", average_score: 95, tests_attempted: 4, last_attempt: "2024-01-16" },
            { name: "David Wilson", average_score: 78, tests_attempted: 2, last_attempt: "2024-01-13" },
            { name: "Emma Brown", average_score: 89, tests_attempted: 3, last_attempt: "2024-01-15" },
            { name: "Frank Miller", average_score: 0, tests_attempted: 0, last_attempt: null },
            { name: "Grace Lee", average_score: 94, tests_attempted: 3, last_attempt: "2024-01-16" },
            { name: "Henry Taylor", average_score: 82, tests_attempted: 2, last_attempt: "2024-01-14" },
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error && !resultData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Results</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </motion.div>
    )
  }

  const students = Array.isArray(resultData.students) ? resultData.students : []

  // Calculate statistics
  const attemptedStudents = students.filter((s) => s.tests_attempted > 0)
  const notAttemptedStudents = students.filter((s) => s.tests_attempted === 0)
  const averageScore =
    attemptedStudents.length > 0
      ? attemptedStudents.reduce((sum, s) => sum + s.average_score, 0) / attemptedStudents.length
      : 0

  // Bar chart data: Avg score per student
  const barData = attemptedStudents.map((student) => ({
    name: student.name.split(" ")[0], // First name only for better display
    avgScore: student.average_score,
    testsAttempted: student.tests_attempted,
  }))

  // Pie chart data: Attempted vs Not Attempted
  const pieData = [
    { name: "Attempted", value: attemptedStudents.length, color: COLORS[0] },
    { name: "Not Attempted", value: notAttemptedStudents.length, color: COLORS[3] },
  ]

  // Performance distribution
  const performanceRanges = [
    { range: "90-100%", count: attemptedStudents.filter((s) => s.average_score >= 90).length, color: COLORS[1] },
    {
      range: "80-89%",
      count: attemptedStudents.filter((s) => s.average_score >= 80 && s.average_score < 90).length,
      color: COLORS[2],
    },
    {
      range: "70-79%",
      count: attemptedStudents.filter((s) => s.average_score >= 70 && s.average_score < 80).length,
      color: COLORS[3],
    },
    { range: "Below 70%", count: attemptedStudents.filter((s) => s.average_score < 70).length, color: COLORS[4] },
  ]

  // Engagement data
  const engagementData = [
    { name: "High (3+ tests)", value: students.filter((s) => s.tests_attempted >= 3).length },
    {
      name: "Medium (1-2 tests)",
      value: students.filter((s) => s.tests_attempted >= 1 && s.tests_attempted < 3).length,
    },
    { name: "Low (0 tests)", value: students.filter((s) => s.tests_attempted === 0).length },
  ]

  const StatCard = ({ title, value, subtitle, icon, color = "blue" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-4xl text-${color}-500 opacity-20`}>{icon}</div>
      </div>
    </motion.div>
  )

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        isActive ? "bg-blue-500 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
        <div className="floating-element floating-element-4"></div>
        <div className="floating-element floating-element-5"></div>
        <div className="floating-element floating-element-6"></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Session Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            {resultData.session_name || `Session ${sessionId}`} • Comprehensive Performance Analysis
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={resultData.total_students}
            subtitle="Enrolled in session"
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Active Participants"
            value={attemptedStudents.length}
            subtitle={`${((attemptedStudents.length / resultData.total_students) * 100).toFixed(1)}% participation`}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Average Score"
            value={`${averageScore.toFixed(1)}%`}
            subtitle="Among active students"
            icon="📊"
            color="purple"
          />
          <StatCard
            title="Completion Rate"
            value={`${((attemptedStudents.length / resultData.total_students) * 100).toFixed(0)}%`}
            subtitle="Students who attempted tests"
            icon="🎯"
            color="orange"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton id="overview" label="📊 Overview" isActive={activeTab === "overview"} onClick={setActiveTab} />
          <TabButton
            id="performance"
            label="🏆 Performance"
            isActive={activeTab === "performance"}
            onClick={setActiveTab}
          />
          <TabButton
            id="engagement"
            label="📈 Engagement"
            isActive={activeTab === "engagement"}
            onClick={setActiveTab}
          />
          <TabButton id="students" label="👨‍🎓 Students" isActive={activeTab === "students"} onClick={setActiveTab} />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Participation Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Test Participation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Score Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceRanges}>
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === "performance" && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-8"
            >
              {/* Student Performance Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Individual Student Performance</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "avgScore" ? `${value}%` : value,
                        name === "avgScore" ? "Average Score" : "Tests Attempted",
                      ]}
                    />
                    <Bar dataKey="avgScore" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === "engagement" && (
            <motion.div
              key="engagement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Engagement Levels */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Student Engagement Levels</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={engagementData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Engagement Metrics */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Engagement Metrics</h3>
                <div className="space-y-4">
                  {engagementData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "students" && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Student Performance Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tests Attempted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {student.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`text-sm font-semibold ${
                                student.average_score >= 90
                                  ? "text-green-600"
                                  : student.average_score >= 80
                                    ? "text-blue-600"
                                    : student.average_score >= 70
                                      ? "text-yellow-600"
                                      : student.average_score > 0
                                        ? "text-red-600"
                                        : "text-gray-400"
                              }`}
                            >
                              {student.average_score > 0 ? `${student.average_score}%` : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.tests_attempted}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.tests_attempted > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.tests_attempted > 0 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.last_attempt || "Never"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SessionResultChart
