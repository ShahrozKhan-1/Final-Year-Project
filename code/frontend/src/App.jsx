import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./Pages/Home/Home";
import Login from "./Pages/LoginRegister/Login";
import Register from "./Pages/LoginRegister/Register";
import StudentPage from "./Pages/StudentDashboard/StudentPage";
import TeacherPage from "./Pages/TeacherDashboard/TeacherPage";
import AdminPage from "./Pages/AdminPage";
import CreateSession from "./Components/CreateSession";
import EnrollSession from "./Components/EnrollSession";
import TeacherRequests from "./Components/TeacherRequest/TeacherRequests";
import CreateTest from "./Components/CreateTest/CreateTest";
import AttemptTest from "./Pages/AttemptTest/AttemptTest";
import PracticeSetup from "./Components/PracticeTest/PracticeSetup";
import ResultPage from "./Pages/ResultPage/ResultPage";
import TeacherSessionPage from "./Pages/TeacherSession/TeacherSessionPage";
import TeacherTest from "./Components/TeacherTest";
import SessionDetails from "./Components/SessionDetail/SessionDetail";
import AttemptedTests from "./Pages/AttemptedTest/AttemptedTests";
import AttemptedTestDetail from "./Components/AttemptedTestDetail";
import TeacherTestAttempts from "./Pages/TeacherTestAttempts ";
import SessionResultPage from "./Pages/SessionResult/SessionResultPage";

import ProtectedRoute from "./Components/ProtectedRoutes"; // Ensure this is correct

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student Routes */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute roleRequired="student">
            <StudentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/enroll-session"
        element={
          <ProtectedRoute roleRequired="student">
            <EnrollSession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice"
        element={
          <ProtectedRoute roleRequired="student">
            <PracticeSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attempt-test/:testId"
        element={
          <ProtectedRoute roleRequired="student">
            <AttemptTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result-page/:attemptId"
        element={
          <ProtectedRoute roleRequired="student">
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/session/:sessionId"
        element={
          <ProtectedRoute roleRequired="student">
            <SessionDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attempted-tests"
        element={
          <ProtectedRoute roleRequired="student">
            <AttemptedTests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attempted-tests/:attemptId"
        element={
          <ProtectedRoute roleRequired="student">
            <AttemptedTestDetail />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute roleRequired="teacher">
            <TeacherPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/create-session"
        element={
          <ProtectedRoute roleRequired="teacher">
            <CreateSession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-test/:sessionId"
        element={
          <ProtectedRoute roleRequired="teacher">
            <CreateTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-request"
        element={
          <ProtectedRoute roleRequired="teacher">
            <TeacherRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-sessions"
        element={
          <ProtectedRoute roleRequired="teacher">
            <TeacherSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/session/:sessionId/tests"
        element={
          <ProtectedRoute roleRequired="teacher">
            <TeacherSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/test/:testId"
        element={
          <ProtectedRoute roleRequired="teacher">
            <TeacherTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/tests/:testId/attempts"
        element={
          <ProtectedRoute roleRequired="teacher">
            <TeacherTestAttempts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/session/:sessionId/results"
        element={
          <ProtectedRoute roleRequired="teacher">
            <SessionResultPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Route */}
      <Route
        path="/admin-panel"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
