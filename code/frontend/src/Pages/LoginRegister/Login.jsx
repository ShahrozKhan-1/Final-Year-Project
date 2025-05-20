"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import { motion } from "framer-motion"
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, CheckCircle } from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./auth-styles.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Login | SmartAssess"
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await axios.post("http://127.0.0.1:8000/login/", {
        email,
        password,
      })

      if (!response.data.access) {
        throw new Error("No access token received")
      }

      localStorage.setItem("access_token", response.data.access)
      if (response.data.refresh) {
        localStorage.setItem("refresh_token", response.data.refresh)
      }

      await new Promise((resolve) => setTimeout(resolve, 50))

      const decoded = jwtDecode(response.data.access)
      switch (decoded.role) {
        case "student":
          navigate("/student-dashboard", { replace: true })
          break
        case "teacher":
          navigate("/teacher-dashboard", { replace: true })
          break
        case "admin":
          navigate("/admin-panel", { replace: true })
          break
        default:
          navigate("/", { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || "Login failed. Please try again.")
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper min-vh-100 d-flex align-items-center justify-content-center p-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ maxWidth: "420px", width: "100%" }}
      >
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center mb-3">
              <div className="logo-circle">
                <CheckCircle size={32} className="text-primary" />
              </div>
            </div>
            <h1 className="fw-bold mb-2">Welcome Back</h1>
            <p className="text-muted">Sign in to access your SmartAssess account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="alert alert-danger d-flex align-items-center mb-4"
            >
              <AlertCircle size={16} className="me-2 flex-shrink-0" />
              <span className="small">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Mail size={18} className="text-muted" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control border-start-0 ps-0"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Password</label>
                <a href="/forgot-password" className="text-decoration-none text-primary small">
                  Forgot password?
                </a>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Lock size={18} className="text-muted" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control border-start-0 ps-0"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary w-100 py-2 mb-3 d-flex align-items-center justify-content-center"
            >
              {loading ? (
                <span className="d-flex align-items-center">
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                </span>
              ) : (
                <span className="d-flex align-items-center">
                  <LogIn size={18} className="me-2" />
                  Sign In
                </span>
              )}
            </motion.button>

            <div className="text-center mt-4">
              <p className="text-muted small mb-2">Don't have an account?</p>
              <a href="/register" className="btn btn-outline-primary d-flex align-items-center justify-content-center">
                <span>Create an account</span>
                <ArrowRight size={16} className="ms-2" />
              </a>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
