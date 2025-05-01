import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import {
  FaChartBar,
  FaUserGraduate,
  FaUserAlt,
  FaBook,
  FaBuilding,
  FaChalkboardTeacher,
  FaFileAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import "./adminsidebar.css";

const AdminSidebar = () => {
  const location = useLocation();
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
    <div className="admin-sidebar-container">
      <nav className="navbar-side">
        {/* Menu Toggle Button for Mobile */}
        <div className="hamburger-menu-side" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <IoClose /> : <IoMenu />}
        </div>
        <div className="logo-container-side">
          <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-side" />
          <div className="divider-line-side"></div>
          <div className="logo-text-side">
            <h1>Northills</h1>
            <h2>College of Asia</h2>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div ref={menuRef} className={`admin-sidebar ${menuOpen ? "active" : ""}`}>
        <div className="logo-section-as">
          <img src="/src/assets/cnalogo.png" alt="NCA Logo" className="logo-img-as" />
          <div className="divider-line-as"></div>
          <div className="logo-text-as">
            <h1>Northhills</h1>
            <h2>College of Asia</h2>
          </div>
        </div>

        <div className="sidebar-menu-side">
          <div className="sidebar-section-1">
            <h3 className="section-title">ADMINISTRATOR</h3>
            <ul>
              <li className={isActive("/dashboard") ? "active" : ""}>
                <Link to="/dashboard" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaChartBar className="icon" /> Dashboard
                </Link>
              </li>
              <li className={isActive("/applicants") ? "active" : ""}>
                <Link to="/applicants" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaUserGraduate className="icon" /> Applicants
                </Link>
              </li>
              <li className={isActive("/announcement") ? "active" : ""}>
                <Link to="/announcement" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <IoMdNotifications className="icon" /> Announcement
                </Link>
              </li>
            </ul>

            <h3 className="section-title">STUDENT SECTION</h3>
            <ul>
              <li className={isActive("/enrolled-students") ? "active" : ""}>
                <Link to="/enrolled-students" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaUserAlt className="icon" /> Enrolled Students
                </Link>
              </li>
              <li className={isActive("/subjects") ? "active" : ""}>
                <Link to="/subjects" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaBook className="icon" /> Subjects/Schedule
                </Link>
              </li>
            </ul>

            <h3 className="section-title">DEPARTMENT SECTION</h3>
            <ul>
              <li className={isActive("/strands") ? "active" : ""}>
                <Link to="/strands" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaBuilding className="icon" /> Strands
                </Link>
              </li>
              <li className={isActive("/faculty") ? "active" : ""}>
                <Link to="/faculty" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaChalkboardTeacher className="icon" /> Faculty
                </Link>
              </li>
              <li className={isActive("/student-report-lists") ? "active" : ""}>
                <Link to="/admin-report" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaFileAlt className="icon" /> Reports
                </Link>
              </li>
              <li className={isActive("/payment") ? "active" : ""}>
                <Link to="/payment" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaMoneyBillWave className="icon" /> Payment
                </Link>
              </li>
              <li>
                <Link to="/" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <IoLogOutOutline className="icon" /> Logout
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
