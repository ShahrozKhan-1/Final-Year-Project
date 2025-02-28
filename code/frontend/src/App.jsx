import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import StudentPage from "./Pages/StudentPage";
import TeacherPage from "./Pages/TeacherPage";
import ProtectedRoute from "./Components/ProtectedRoutes";

function App() {
  // const [currentUser, setCurrentUser] = useState(null);
  // const [authToken, setAuthToken] = useState(null);

  // useEffect(() => {
  //   const storedUser = localStorage.getItem("user");
  //   const storedToken = localStorage.getItem("token"); // ✅ Get token

  //   if (storedUser && storedToken) {
  //     setCurrentUser(JSON.parse(storedUser));
  //     setAuthToken(storedToken);
  //   }
  // }, []);

  return (
    <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/student-dashboard" element={<StudentPage />} />
                <Route path="/teacher-dashboard" element={<TeacherPage />} />
                <Route path="/" element={<Login />} />
            </Routes>
        </Router>
  );
}

export default App;
