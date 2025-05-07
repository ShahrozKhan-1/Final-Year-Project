import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";
import axios from "axios";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

const SessionResultChart = ({ sessionId }) => {
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/teacher/session/${sessionId}/results/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setResultData(response.data);
      } catch (error) {
        console.error("Error fetching session result:", error);
      }
    };

    fetchResult();
  }, [sessionId]);

  if (!resultData) return <p>Loading session results...</p>;

  // Safe check: Ensure resultData.students exists and is an array
  const students = Array.isArray(resultData.students) ? resultData.students : [];

  // Bar chart data: Avg score per student
  const barData = students.map((student) => ({
    name: student.name,
    avgScore: student.average_score,
  }));

  // Pie chart data: Attempted vs Not Attempted
  const attemptedCount = students.filter(s => s.tests_attempted > 0).length;
  const notAttemptedCount = resultData.total_students - attemptedCount;

  const pieData = [
    { name: "Attempted", value: attemptedCount },
    { name: "Not Attempted", value: notAttemptedCount },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
      {/* Chart Section */}
      <div className="shadow-lg p-4 rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-4">Average Score Per Student</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgScore" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="shadow-lg p-4 rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-4">Test Participation</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Data Section */}
      <div className="shadow-lg p-4 rounded-lg bg-white col-span-1 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Session Overview</h2>
        <p><strong>Total Students:</strong> {resultData.total_students}</p>
        <p><strong>Students Attempted Test:</strong> {attemptedCount}</p>
        <p><strong>Students Not Attempted Test:</strong> {notAttemptedCount}</p>
      </div>

      {/* Student List Section */}
      <div className="shadow-lg p-4 rounded-lg bg-white col-span-1 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Student Scores</h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Student Name</th>
              <th className="px-4 py-2 text-left">Average Score</th>
              <th className="px-4 py-2 text-left">Tests Attempted</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">{student.name}</td>
                <td className="px-4 py-2">{student.average_score}</td>
                <td className="px-4 py-2">{student.tests_attempted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionResultChart;
