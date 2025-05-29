import { useState, useEffect } from "react"
import { Bell, X, Check, BookOpen, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const NotificationCenter = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const token = localStorage.getItem("access_token")

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/notifications/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch notifications")
      const data = await response.json()
      setNotifications(data)
      setIsError(false)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setIsError(true)
      // Mock data for demo
      setNotifications([
        {
          id: 1,
          notification_type: "new_test",
          message: "New test available: Mathematics Quiz",
          is_read: false,
          created_at: new Date().toISOString(),
          sender: { username: "Dr. Smith" },
          content_object: { id: 1, title: "Mathematics Quiz" },
        },
        {
          id: 2,
          notification_type: "enrollment_approved",
          message: "Your enrollment has been approved",
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender: { username: "Admin" },
          content_object: { id: 1, session_name: "Advanced Physics" },
        },
        {
          id: 3,
          notification_type: "test_attempt",
          message: "Student completed test",
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          sender: { username: "John Doe" },
          content_object: { id: 1 },
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!token) return

    try {
      const response = await fetch("http://127.0.0.1:8000/api/notifications/count/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch notification count")
      const data = await response.json()
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error("Error fetching notification count:", error)
      // Mock unread count
      const unread = notifications.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    fetchUnreadCount()
  }, [notifications, token])

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/${id}/mark_as_read/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error("Failed to mark notification as read")

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
      // Update local state anyway for demo
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/notifications/mark_all_read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error("Failed to mark all notifications as read")

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      // Update local state anyway for demo
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // Handle navigation based on notification type
    switch (notification.notification_type) {
      case "new_test":
        window.location.href = `/student/test/${notification.content_object.id}/attempt`
        break
      case "enrollment_approved":
        window.location.href = `/student/session/${notification.content_object.id}`
        break
      case "test_attempt":
        window.location.href = `/teacher/session/${notification.content_object.id}/results`
        break
      case "enrollment_request":
        window.location.href = `/teacher-request`
        break
      default:
        setIsOpen(false)
    }
  }

  // Filter notifications by user role
  const filteredNotifications = notifications.filter((notification) => {
    if (userRole === "student") {
      return ["new_test", "enrollment_approved"].includes(notification.notification_type)
    } else if (userRole === "teacher") {
      return ["enrollment_request", "test_attempt"].includes(notification.notification_type)
    }
    return false
  })

  // Render notification icon based on type
  const renderNotificationIcon = (type) => {
    const iconClass = "w-5 h-5"

    switch (type) {
      case "new_test":
        return <BookOpen className={`${iconClass} text-blue-500`} />
      case "enrollment_approved":
        return <Check className={`${iconClass} text-green-500`} />
      case "enrollment_request":
        return <User className={`${iconClass} text-yellow-500`} />
      case "test_attempt":
        return <BookOpen className={`${iconClass} text-purple-500`} />
      default:
        return <Bell className={`${iconClass} text-gray-500`} />
    }
  }

  // Render notification text based on type
  const renderNotificationText = (notification) => {
    switch (notification.notification_type) {
      case "new_test":
        return `New test: ${notification.content_object?.title || "Available"}`
      case "enrollment_approved":
        return `Enrollment approved: ${notification.content_object?.session_name || "Session"}`
      case "enrollment_request":
        return `${notification.sender?.username || "Student"} requested enrollment`
      case "test_attempt":
        return `${notification.sender?.username || "Student"} attempted a test`
      default:
        return notification.message
    }
  }

  // Format time difference
  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffSeconds = Math.floor((now - date) / 1000)

    if (diffSeconds < 60) return "Just now"
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
    return `${Math.floor(diffSeconds / 86400)}d ago`
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="nav-item d-flex align-items-center gap-2 position-relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell size={18} />
        <span className="d-none d-md-inline">Notifications</span>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100"
              style={{ zIndex: 1040 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Panel */}
            <motion.div
              className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border"
              style={{
                width: "380px",
                maxHeight: "500px",
                zIndex: 1050,
                backdropFilter: "blur(20px)",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
              }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50 rounded-top">
                <h5 className="mb-0 fw-bold text-dark">Notifications</h5>
                <div className="d-flex gap-2">
                  {filteredNotifications.some((n) => !n.is_read) && (
                    <motion.button
                      onClick={markAllAsRead}
                      className="btn btn-sm btn-outline-primary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Mark all read
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-sm btn-light rounded-circle p-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-auto" style={{ maxHeight: "350px" }}>
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mb-0">Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-5 text-center">
                    <Bell size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No notifications</h6>
                    <p className="text-muted small mb-0">You're all caught up!</p>
                  </div>
                ) : (
                  <div>
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        className={`p-3 border-bottom cursor-pointer notification-item ${
                          !notification.is_read ? "bg-primary bg-opacity-10" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleNotificationClick(notification)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(0, 123, 255, 0.05)" }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div className="flex-shrink-0 pt-1">
                            {renderNotificationIcon(notification.notification_type)}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <p className="mb-1 fw-medium text-dark small">{renderNotificationText(notification)}</p>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {!notification.is_read && (
                                <span className="badge bg-primary" style={{ fontSize: "0.6rem" }}>
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredNotifications.length > 0 && (
                <div className="p-3 border-top bg-light bg-opacity-50 text-center rounded-bottom">
                  <a href="/notifications" className="text-decoration-none fw-medium text-primary small">
                    View all notifications
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
