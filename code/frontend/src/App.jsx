import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Login from "./Pages/LoginRegister/Login";
import Register from "./Pages/LoginRegister/Register";
import StudentPage from "./Pages/StudentDashboard/StudentPage";
import TeacherPage from "./Pages/TeacherDashboard/TeacherPage";
import AdminPage from "./Pages/AdminPage";
import CreateSession from "./Components/CreateSession";
import EnrollSession from "./Components/EnrollSession";
import TeacherRequests from "./Components/TeacherRequests";
import CreateTest from "./Components/CreateTest";
import AttemptTest from "./Pages/AttemptTest";
import PracticeSetup from "./Components/PracticeSetup";
import ResultPage from "./Pages/ResultPage";
import TeacherSessionPage from './Pages/TeacherSessionPage';
import TeacherTest from './Components/TeacherTest';
import SessionDetails from "./Components/SessionDetail";
import AttemptedTests from "./Pages/AttemptedTests";
import AttemptedTestDetail from "./Components/AttemptedTestDetail";
import TeacherTestAttempts from "./Pages/TeacherTestAttempts ";
import SessionResultPage from "./Pages/SessionResultPage";


function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
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
      <Route path="/result-page/:attemptId" element={<ResultPage />} />
      <Route path="/teacher-sessions" element={<TeacherSessionPage />} />
      <Route path="/teacher/session/:sessionId/tests" element={<TeacherSessionPage />} />
      <Route path="/teacher/test/:testId" element={<TeacherTest />} />
      <Route path="/student/session/:sessionId" element={<SessionDetails />} />
      <Route path="/student/attempted-tests" element={<AttemptedTests />} />
      <Route path="/student/attempted-tests/:attemptId" element={<AttemptedTestDetail />} />
      <Route path="/teacher/tests/:testId/attempts" element={<TeacherTestAttempts />} />
      <Route path="/teacher/session/:sessionId/results" element={<SessionResultPage />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;