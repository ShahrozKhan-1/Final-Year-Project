import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import StudentPage from "./Pages/StudentPage";
import TeacherPage from "./Pages/TeacherPage";
import ProtectedRoute from "./Components/ProtectedRoutes";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student-dashboard" element={<StudentPage />} />
        </Route>

        <Route element={<ProtectedRoute role="teacher" />}>
          <Route path="/teacher-dashboard" element={<TeacherPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
