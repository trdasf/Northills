import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import {
  FaChartBar,
  FaUserAlt,
  FaFileAlt,
  FaMoneyBillWave,
  FaBook,
} from "react-icons/fa";
import "./studentsidebar.css";

const StudentSidebar = () => {
  const location = useLocation();
  const studentId = location.state?.student_id;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="student-sidebar-container">
      <nav className="navbar-side-ss">
        {/* Menu Toggle Button for Mobile */}
        <div className="hamburger-menu-side-ss" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <IoClose /> : <IoMenu />}
        </div>
        <div className="logo-container-side-ss">
          <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-side-ss" />
          <div className="divider-line-side-ss"></div>
          <div className="logo-text-side-ss">
            <h1>Northills</h1>
            <h2>College of Asia</h2>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div ref={menuRef} className={`student-sidebar ${menuOpen ? "active" : ""}`}>
        <div className="logo-section-ss">
          <img src="/src/assets/cnalogo.png" alt="NCA Logo" className="logo-img-sss" />
          <div className="divider-line-ss"></div>
          <div className="logo-text-ss">
            <h1>Northills</h1>
            <h2>College of Asia</h2>
          </div>
        </div>

        <div className="sidebar-menu-side-ss">
          <div className="sidebar-section-1-ss">
            <h3 className="section-title-ssss">STUDENT</h3>
            <ul>
              <li className={isActive("/student-dashboard") ? "active" : ""}>
                <Link 
                  to="/student-dashboard" 
                  className="menu-link-ss" 
                  state={{ student_id: studentId }}
                  onClick={() => setMenuOpen(false)}
                >
                  <FaChartBar className="icon-ss" /> Dashboard
                </Link>
              </li>
              <li className={isActive("/student-profile") ? "active" : ""}>
                <Link 
                  to="/student-profile" 
                  className="menu-link-ss"
                  state={{ student_id: studentId }}
                  onClick={() => setMenuOpen(false)}
                >
                  <FaUserAlt className="icon-ss" /> Student Profile
                </Link>
              </li>
              <li className={isActive("/student-enrolled-subject") ? "active" : ""}>
                <Link 
                  to="/student-enrolled-subject" 
                  className="menu-link-ss"
                  state={{ student_id: studentId }}
                  onClick={() => setMenuOpen(false)}
                >
                  <FaBook className="icon-ss" /> Enrolled Subject
                </Link>
              </li>
              <li className={isActive("/student-grades") ? "active" : ""}>
                <Link 
                  to="/student-grades" 
                  className="menu-link-ss"
                  state={{ student_id: studentId }}
                  onClick={() => setMenuOpen(false)}
                >
                  <FaFileAlt className="icon-ss" /> Grades
                </Link>
              </li>
              <li className={isActive("/student-payment-records") ? "active" : ""}>
                <Link 
                  to="/student-payment-records" 
                  className="menu-link-ss"
                  state={{ student_id: studentId }}
                  onClick={() => setMenuOpen(false)}
                >
                  <FaMoneyBillWave className="icon-ss" /> Payment Records
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  className="menu-link-ss"
                  onClick={() => setMenuOpen(false)}
                >
                  <IoLogOutOutline className="icon-ss" /> Logout
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSidebar;