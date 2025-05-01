import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaChartBar,
  FaUserAlt,
  FaBook,
} from "react-icons/fa";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import "./facultysidebar.css";

const FacultySidebar = () => {
  const location = useLocation(); // Get the current path
  const facultyId = location.state?.faculty_id; // Get the faculty_id from the current route state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isActive = (path) => location.pathname === path; // Check if the link is active

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
     <div className="faculty-sidebar-container">
                <nav className="navbar-side-fside">
                  {/* Menu Toggle Button for Mobile */}
                  <div className="hamburger-menu-side-fside" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <IoClose /> : <IoMenu />}
                  </div>
                  <div className="logo-container-side-fside">
                    <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-side-fside" />
                    <div className="divider-line-side-fside"></div>
                    <div className="logo-text-side-fside">
                      <h1>Northills</h1>
                      <h2>College of Asia</h2>
                    </div>
                  </div>
                </nav>
                
      <div ref={menuRef} className={`faculty-sidebar ${menuOpen ? "active" : ""}`}>
      <div className="logo-section-fside">
        <img src="./src/assets/cnalogo.png" alt="NCA Logo" className="logo-img-fside" />
        <div className="divider-line-fside"></div>
        <div className="logo-text-fside">
          <h1>Northills</h1>
          <h2>College of Asia</h2>
        </div>
      </div>
      <div className="sidebar-menu-fside">
        <h3 className="section-title-fside">FACULTY</h3>
        <ul>
          <li className={isActive("/faculty-dashboard") ? "active" : ""}>
            <Link 
              to="/faculty-dashboard" 
              className="menu-link-fside"
              state={{ faculty_id: facultyId }} // Pass faculty_id in the state
              onClick={() => setMenuOpen(false)}
            >
              <FaChartBar className="icon-fside" /> Dashboard
            </Link>
          </li>
          <li className={isActive("/faculty-profile") ? "active" : ""}>
            <Link 
              to="/faculty-profile" 
              className="menu-link-fside"
              state={{ faculty_id: facultyId }} // Pass faculty_id in the state
              onClick={() => setMenuOpen(false)}
            > 
              <FaUserAlt className="icon-fside" /> Faculty Profile
            </Link>
          </li>
          <li className={isActive("/subject-schedule") ? "active" : ""}>
            <Link 
              to="/subject-schedule" 
              className="menu-link-fside"
              onClick={() => setMenuOpen(false)}
              state={{ faculty_id: facultyId }} // Pass faculty_id in the state
            >
              <FaBook className="icon-fside" /> Subjects Schedule
            </Link>
          </li>
          <li>
            <Link 
              to="/" 
              className="menu-link-fside"
              state={{ faculty_id: facultyId }} // Optionally pass faculty_id if needed
            >
              <IoLogOutOutline className="icon-fside" /> Logout
            </Link>
          </li>
        </ul>
      </div>
      </div>
    </div>
  );
};

export default FacultySidebar;
