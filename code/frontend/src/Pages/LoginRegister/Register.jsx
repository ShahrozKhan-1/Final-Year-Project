import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import { Mail, User, Lock, CheckCircle, AlertCircle, UserPlus, ArrowRight } from "lucide-react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./auth-styles.css"
import image from "../../../images/Signup.jpg"

const Register = () => {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("student")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Register | SmartAssess"
  }, [])

  const validateForm = () => {
    const newErrors = {}
    if (!username.trim()) newErrors.username = "Username is required"
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Valid email required"
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
    if (!passwordRegex.test(password)) newErrors.password = "8+ chars with number & special character"
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)

    try {
      await axios.post("http://127.0.0.1:8000/register/", {
        username,
        email,
        password,
        role,
      })
      setMessage("Registration successful! Redirecting...")
      setTimeout(() => navigate("/login"), 1500)
    } catch (err) {
      setMessage(err.response?.data?.error || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  }

  return (
    <div className="register-wrapper min-vh-100 d-flex align-items-center justify-content-center p-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ maxWidth: "900px", width: "100%" }}
      >
        <div className="row g-0">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="col-md-6 p-4 p-md-5">
            <motion.div variants={itemVariants} className="text-center mb-4">
              <div className="d-flex justify-content-center mb-3">
                <div className="logo-circle">
                  <CheckCircle size={32} className="text-primary" />
                </div>
              </div>
              <h1 className="fw-bold mb-2">Create Account</h1>
              <p className="text-muted">Join our SmartAssess community today</p>
            </motion.div>

            <form onSubmit={handleRegister}>
              <motion.div variants={itemVariants} className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <User size={18} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className={`form-control border-start-0 ps-0 ${errors.username ? "is-invalid" : ""}`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                {errors.username && <div className="invalid-feedback d-block">{errors.username}</div>}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Mail size={18} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className={`form-control border-start-0 ps-0 ${errors.email ? "is-invalid" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={18} className="text-muted" />
                  </span>
                  <input
                    type="password"
                    placeholder="Password"
                    className={`form-control border-start-0 ps-0 ${errors.password ? "is-invalid" : ""}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={18} className="text-muted" />
                  </span>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className={`form-control border-start-0 ps-0 ${errors.confirmPassword ? "is-invalid" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
              </motion.div>

              <motion.div variants={itemVariants} className="mb-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <User size={18} className="text-muted" />
                  </span>
                  <select
                    className="form-select border-start-0 ps-0"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-100 py-2 mb-3 d-flex align-items-center justify-content-center"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isLoading ? (
                    <span className="d-flex align-items-center">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </span>
                  ) : (
                    <span className="d-flex align-items-center">
                      <UserPlus size={18} className="me-2" />
                      Register Now
                    </span>
                  )}
                </button>
              </motion.div>
            </form>

            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`alert ${
                  message.includes("failed") ? "alert-danger" : "alert-success"
                } d-flex align-items-center mt-3`}
              >
                {message.includes("failed") ? (
                  <AlertCircle size={16} className="me-2" />
                ) : (
                  <CheckCircle size={16} className="me-2" />
                )}
                <span className="small">{message}</span>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="text-center mt-4">
              <p className="text-muted small mb-2">Already have an account?</p>
              <a href="/login" className="btn btn-outline-primary d-flex align-items-center justify-content-center">
                <span>Sign in</span>
                <ArrowRight size={16} className="ms-2" />
              </a>
            </motion.div>
          </motion.div>

          <div className="col-md-6 d-none d-md-block p-0">
            <div className="register-image-container h-100 d-flex flex-column justify-content-center align-items-center text-white p-4">
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <img
                  src={image}
                  alt="Illustration"
                  className="img-fluid mb-4"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Register
