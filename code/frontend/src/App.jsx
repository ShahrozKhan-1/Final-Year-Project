import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import StudentPage from "./Pages/StudentPage";
import TeacherPage from "./Pages/TeacherPage";
import AdminPage from "./Pages/AdminPage";
import CreateSession from "./Components/CreateSession";
import EnrollSession from "./Components/EnrollSession";
import TeacherRequests from "./Components/TeacherRequests";
import CreateTest from "./Components/CreateTest";
import AttemptTest from "./Pages/AttemptTest";
import ProtectedRoute from "./Components/ProtectedRoutes";
import PracticeSetup from "./Components/PracticeSetup";

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-dashboard" element={<StudentPage />} />
        <Route path="/teacher-dashboard" element={<TeacherPage />} />
        <Route path="/admin-panel" element={<AdminPage />} />
        <Route path="/teacher/create-session" element={<CreateSession />} />
        <Route path="/student/enroll-session" element={<EnrollSession />} />
        <Route path="/teacher-request" element={<TeacherRequests />} />
        <Route path="/create-test/:sessionId" element={<CreateTest />} />
        <Route path="/student/practice" element={<PracticeSetup />} />
        <Route path="/student/attempt-test/:testId" element={<AttemptTest />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
