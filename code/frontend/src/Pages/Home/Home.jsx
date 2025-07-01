import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css"
import "./custom-style.css"
import {
  BookOpen,
  Users,
  BarChart2,
  Clock,
  CheckCircle,
  Award,
  Calendar,
  Settings,
  User,
  Star,
  Plus,
  ExternalLink,
} from "lucide-react"

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate();
  

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const floatAnimation = {
    initial: { y: 0 },
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  const pulseAnimation = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className="smart-assess-wrapper min-vh-100">
      {/* Animated background elements */}
      <div className="position-absolute w-100 h-100 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="position-absolute rounded-circle bg-white-transparent"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="position-relative py-3 px-4 d-flex justify-content-between align-items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="d-flex align-items-center gap-2"
        >
          <div className="bg-white rounded p-2">
            <CheckCircle className="icon-lg text-primary" />
          </div>
          <span className="fs-4 fw-bold text-gradient">SmartAssess</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="d-none d-md-flex gap-4"
        >
          <a href="#features" className="nav-link">
            <span className="d-flex align-items-center gap-1">
              <CheckCircle size={16} />
              Features
            </span>
          </a>
          <a href="#roles" className="nav-link">
            <span className="d-flex align-items-center gap-1">
              <Users size={16} />
              Solutions
            </span>
          </a>
          <a href="#testimonials" className="nav-link">
            <span className="d-flex align-items-center gap-1">
              <Star size={16} />
              Testimonials
            </span>
          </a>
          <a href="#contact" className="nav-link">
            <span className="d-flex align-items-center gap-1">
              <ExternalLink size={16} />
              Contact
            </span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="d-flex gap-2"
        >
          <button className="btn btn-outline-light d-flex align-items-center gap-1" onClick={() => navigate('/login')} >
            <User size={16} />
            Login
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-1" onClick={() => navigate('/register')}>
            <Plus size={16} />
            Sign Up
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="position-relative py-5 py-md-7 container">
        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={staggerChildren}
          className="row align-items-center"
        >
          <div className="col-md-6">
            <motion.h1 variants={fadeIn} className="display-4 fw-bold mb-4">
              Revolutionize <span className="text-gradient">Assessment</span> with AI
            </motion.h1>

            <motion.p variants={fadeIn} className="fs-5 text-light-teal mb-4">
              SmartAssess helps educators create, manage, and grade assessments with the power of artificial
              intelligence. Save time, gain insights, and improve learning outcomes.
            </motion.p>

            <motion.div variants={fadeIn} className="d-flex flex-wrap gap-3 mb-5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-lg btn-primary shadow-lg d-flex align-items-center gap-2"
              >
                <CheckCircle size={20} />
                Get Started Free
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-lg btn-outline-light d-flex align-items-center gap-2"
              >
                <ExternalLink size={20} />
                Watch Demo
              </motion.button>
            </motion.div>

            <motion.div variants={fadeIn} className="d-flex align-items-center gap-3 mt-5">
              <div className="user-avatars">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="user-avatar">
                    <img src={`/placeholder.svg?height=40&width=40&text=${i + 1}`} alt="User" className="img-fluid" />
                  </div>
                ))}
              </div>
              <div>
                <div className="d-flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="star-icon text-warning" size={16} />
                  ))}
                </div>
                <p className="small text-light">Trusted by 1000+ educators</p>
              </div>
            </motion.div>
          </div>

          <div className="col-md-6">
            <motion.div variants={fadeIn} className="position-relative">
              <motion.div
                initial="initial"
                animate="animate"
                variants={floatAnimation}
                className="position-relative z-index-1 glass-card p-4"
              >
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex gap-2">
                    <div className="circle bg-danger"></div>
                    <div className="circle bg-warning"></div>
                    <div className="circle bg-success"></div>
                  </div>
                  <div className="small text-light d-flex align-items-center gap-1">
                    <BookOpen size={14} />
                    AI Quiz Generator
                  </div>
                </div>

                <div className="d-flex flex-column gap-3">
                  <div className="card-dark p-3">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <Plus size={18} />
                      Generate Quiz from Topic
                    </h5>
                    <div className="card-darker p-3 small">
                      <p>
                        Topic: <span className="text-teal">Photosynthesis in Plants</span>
                      </p>
                      <p>
                        Level: <span className="text-teal">High School</span>
                      </p>
                      <p>
                        Questions: <span className="text-teal">10</span>
                      </p>
                    </div>
                    <div className="mt-3 d-flex justify-content-end">
                      <button className="btn btn-sm btn-primary d-flex align-items-center gap-1">
                        <CheckCircle size={14} />
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="card-dark p-3">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <Clock size={18} />
                      Recent Assessments
                    </h5>
                    <ul className="list-unstyled small">
                      <li className="d-flex justify-content-between mb-2">
                        <span className="d-flex align-items-center gap-1">
                          <BookOpen size={14} />
                          Biology Midterm
                        </span>
                        <span className="text-success">98% Complete</span>
                      </li>
                      <li className="d-flex justify-content-between mb-2">
                        <span className="d-flex align-items-center gap-1">
                          <BookOpen size={14} />
                          Chemistry Quiz
                        </span>
                        <span className="text-warning">In Progress</span>
                      </li>
                      <li className="d-flex justify-content-between">
                        <span className="d-flex align-items-center gap-1">
                          <BookOpen size={14} />
                          Physics Test
                        </span>
                        <span className="text-teal">Scheduled</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial="initial"
                animate="animate"
                variants={pulseAnimation}
                className="glow-circle glow-circle-1"
              ></motion.div>

              <motion.div
                initial="initial"
                animate="animate"
                variants={pulseAnimation}
                className="glow-circle glow-circle-2"
              ></motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="position-relative py-5 container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <h2 className="display-5 fw-bold">Powerful Features</h2>
          <p className="fs-5 text-light mx-auto" style={{ maxWidth: "700px" }}>
            SmartAssess combines AI technology with educational expertise to deliver a comprehensive assessment
            solution.
          </p>
        </motion.div>

        <div className="row row-cols-1 row-cols-md-3 g-4">
          {[
            {
              icon: <BookOpen className="icon-lg" />,
              title: "AI-Powered Quiz Generation",
              description:
                "Create comprehensive assessments in seconds by simply entering a topic or uploading course materials.",
            },
            {
              icon: <CheckCircle className="icon-lg" />,
              title: "Automatic Grading",
              description:
                "Save hours of manual grading with intelligent assessment of student responses and detailed feedback.",
            },
            {
              icon: <BarChart2 className="icon-lg" />,
              title: "Performance Analytics",
              description: "Gain insights into student performance with comprehensive analytics and visualizations.",
            },
            {
              icon: <Clock className="icon-lg" />,
              title: "Session Management",
              description: "Schedule and manage assessment sessions with customizable time limits and access controls.",
            },
            {
              icon: <Users className="icon-lg" />,
              title: "Role-Based Access",
              description: "Secure platform with dedicated interfaces for administrators, teachers, and students.",
            },
            {
              icon: <Award className="icon-lg" />,
              title: "Improvement Recommendations",
              description: "AI-generated personalized recommendations to help students improve their performance.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="col"
            >
              <div className="card h-100 feature-card">
                <div className="card-body">
                  <div className="feature-icon mb-3">{feature.icon}</div>
                  <h3 className="card-title h5 fw-bold">{feature.title}</h3>
                  <p className="card-text text-light">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="position-relative py-5 container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <h2 className="display-5 fw-bold">Solutions for Everyone</h2>
          <p className="fs-5 text-light mx-auto" style={{ maxWidth: "700px" }}>
            SmartAssess provides tailored solutions for different roles in the educational ecosystem.
          </p>
        </motion.div>

        <div className="row row-cols-1 row-cols-md-3 g-4">
          {[
            {
              role: "Administrators",
              icon: <Settings className="icon-xl" />,
              features: [
                "Institution-wide analytics dashboard",
                "User management and role assignment",
                "Curriculum oversight and alignment",
                "Security and compliance controls",
                "Integration with existing systems",
              ],
            },
            {
              role: "Teachers",
              icon: <BookOpen className="icon-xl" />,
              features: [
                "AI-powered quiz generation",
                "Automatic grading and feedback",
                "Student performance tracking",
                "Session scheduling and management",
                "Customizable assessment templates",
              ],
            },
            {
              role: "Students",
              icon: <User className="icon-xl" />,
              features: [
                "Intuitive assessment interface",
                "Immediate feedback on submissions",
                "Personalized improvement recommendations",
                "Progress tracking and analytics",
                "Study resources and practice tests",
              ],
            },
          ].map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="col"
            >
              <div className="card h-100 role-card text-center">
                <div className="card-body">
                  <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    variants={floatAnimation}
                    className="role-icon mx-auto mb-4"
                  >
                    {role.icon}
                  </motion.div>
                  <h3 className="card-title h4 fw-bold mb-4">{role.role}</h3>
                  <ul className="list-unstyled text-start">
                    {role.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="d-flex align-items-start gap-2 mb-2"
                      >
                        <CheckCircle className="check-icon text-teal flex-shrink-0 mt-1" size={16} />
                        <span className="text-light">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="position-relative py-5 container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <h2 className="display-5 fw-bold">What Our Users Say</h2>
          <p className="fs-5 text-light mx-auto" style={{ maxWidth: "700px" }}>
            Hear from educators and administrators who have transformed their assessment process with SmartAssess.
          </p>
        </motion.div>

        <div className="row row-cols-1 row-cols-md-2 g-4">
          {[
            {
              name: "Dr. Sarah Johnson",
              role: "Department Head, Biology",
              image: "/placeholder.svg?height=80&width=80&text=SJ",
              quote:
                "SmartAssess has revolutionized how we create and grade assessments. What used to take hours now takes minutes, and the insights we get are invaluable for improving our teaching methods.",
            },
            {
              name: "Prof. Michael Chen",
              role: "Computer Science Instructor",
              image: "/placeholder.svg?height=80&width=80&text=MC",
              quote:
                "The AI-generated quizzes are remarkably relevant and challenging. My students appreciate the immediate feedback, and I can focus more on teaching rather than grading.",
            },
            {
              name: "Amanda Rodriguez",
              role: "High School Principal",
              image: "/placeholder.svg?height=80&width=80&text=AR",
              quote:
                "Implementing SmartAssess across our school has improved student engagement and performance. The analytics help us identify learning gaps and address them proactively.",
            },
            {
              name: "Thomas Wright",
              role: "Corporate Training Manager",
              image: "/placeholder.svg?height=80&width=80&text=TW",
              quote:
                "We use SmartAssess for employee skill assessments and certification. The platform's flexibility and detailed reporting have made our training programs much more effective.",
            },
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="col"
            >
              <div className="card h-100 testimonial-card">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="testimonial-avatar">
                      <img
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="img-fluid rounded-circle"
                      />
                    </div>
                    <div>
                      <h4 className="h6 fw-bold mb-0">{testimonial.name}</h4>
                      <p className="small text-teal mb-0">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="card-text text-light fst-italic">"{testimonial.quote}"</p>
                  <div className="mt-3 d-flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="star-icon text-warning" size={16} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="position-relative py-5 container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="cta-card p-4 p-md-5 text-center"
        >
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={pulseAnimation}
            className="glow-circle glow-circle-3"
          ></motion.div>

          <div className="position-relative">
            <h2 className="display-5 fw-bold mb-3">Ready to Transform Your Assessment Process?</h2>
            <p className="fs-5 text-light mx-auto mb-4" style={{ maxWidth: "700px" }}>
              Join thousands of educators and institutions already using SmartAssess to save time, gain insights, and
              improve learning outcomes.
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-lg btn-primary shadow-lg d-flex align-items-center gap-2"
              >
                <CheckCircle size={20} />
                Start Free Trial
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-lg btn-outline-light d-flex align-items-center gap-2"
              >
                <Calendar size={20} />
                Schedule Demo
              </motion.button>
            </div>

            <p className="mt-4 small text-light">
              No credit card required. Free plan available for individual educators.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="contact" className="position-relative py-5 container border-top border-light border-opacity-10">
        <div className="row row-cols-1 row-cols-md-4 g-4">
          <div className="col">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-white rounded p-1">
                <CheckCircle className="icon-sm text-primary" />
              </div>
              <span className="fs-4 fw-bold">SmartAssess</span>
            </div>
            <p className="text-light mb-3">Revolutionizing assessment with artificial intelligence.</p>
            <div className="d-flex gap-3">
              {[
                { name: "twitter", icon: <ExternalLink size={16} /> },
                { name: "facebook", icon: <ExternalLink size={16} /> },
                { name: "linkedin", icon: <ExternalLink size={16} /> },
                { name: "instagram", icon: <ExternalLink size={16} /> },
              ].map((social) => (
                <a key={social.name} href={`#${social.name}`} className="social-link">
                  <div className="social-icon">{social.icon}</div>
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Case Studies", "Documentation", "API"],
            },
            {
              title: "Company",
              links: ["About Us", "Careers", "Blog", "Press", "Contact"],
            },
            {
              title: "Resources",
              links: ["Help Center", "Community", "Webinars", "Partners", "Privacy Policy"],
            },
          ].map((column, index) => (
            <div key={index} className="col">
              <h4 className="h6 fw-bold mb-3">{column.title}</h4>
              <ul className="list-unstyled">
                {column.links.map((link, i) => (
                  <li key={i} className="mb-2">
                    <a
                      href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="footer-link d-flex align-items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-top border-light border-opacity-10 text-center small text-light">
          <p>© {new Date().getFullYear()} SmartAssess. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage