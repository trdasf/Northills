import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChartBar, FaUserAlt, FaFileAlt, FaMoneyBillWave, FaBook } from "react-icons/fa";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import "./parentsidebar.css";

const ParentSidebar = () => {
  const location = useLocation(); // Get the current path
  const studentId = location.state?.student_id; // Assume student_id is stored in the current route state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Function to check if the link is active
  const isActive = (path) => location.pathname === path;

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
    <div className="parent-sidebar-container">
            <nav className="navbar-side-ps">
              {/* Menu Toggle Button for Mobile */}
              <div className="hamburger-menu-side-ps" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <IoClose /> : <IoMenu />}
              </div>
              <div className="logo-container-side-ps">
                <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-side-ps" />
                <div className="divider-line-side-ps"></div>
                <div className="logo-text-side-ps">
                  <h1>Northills</h1>
                  <h2>College of Asia</h2>
                </div>
              </div>
            </nav>
      
      <div ref={menuRef} className={`parent-sidebar ${menuOpen ? "active" : ""}`}>
      <div className="logo-section-ps">
        <img src="./src/assets/cnalogo.png" alt="NCA Logo" className="logo-img-ps" />
        <div className="divider-line-ps"></div>
        <div className="logo-text-ps">
          <h1>Northills</h1>
          <h2>College of Asia</h2>
        </div>
      </div>
      
      <div className="sidebar-menu-ps">
      <div className="sidebar-section-1-ps">
        <h3 className="section-title-ps">PARENT</h3>
        <ul>
          <li className={isActive("/parent-dashboard") ? "active" : ""}>
            <Link 
              to="/parent-dashboard" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaChartBar className="icon-ps" /> Dashboard
            </Link>
          </li>
          <li className={isActive("/p-student-profile") ? "active" : ""}>
            <Link 
              to="/p-student-profile" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaUserAlt className="icon-ps" /> Student Profile
            </Link>
          </li>
          <li className={isActive("/p-student-enrolled-subject") ? "active" : ""}>
            <Link 
              to="/p-student-enrolled-subject" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaBook className="icon-ps" /> Enrolled Subject
            </Link>
          </li>
          <li className={isActive("/p-student-grades") ? "active" : ""}>
            <Link 
              to="/p-student-grades" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaFileAlt className="icon-ps" /> Grades
            </Link>
          </li>
          <li className={isActive("/p-student-payment-records") ? "active" : ""}>
            <Link 
              to="/p-student-payment-records" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaMoneyBillWave className="icon-ps" /> Payment Records
            </Link>
          </li>
          <li>
            <Link 
              to="/" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <IoLogOutOutline className="icon-ps" /> Logout
            </Link>
          </li>
        </ul>
      </div>
      </div>
    </div>
    </div>
  );
};

export default ParentSidebar;
