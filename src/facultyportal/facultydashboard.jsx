import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import './facultydashboard.css';

const FacultyDashboard = () => {
  const location = useLocation();
  const facultyId = location.state?.faculty_id;

  console.log("Faculty ID:", facultyId); // Debugging

  const [facultyName, setFacultyName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [totalSubjects, setTotalSubjects] = useState(0);  // State to store total subjects count
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);  // State to store total enrolled students

  useEffect(() => {
    // Fetch faculty details using facultyId
    const fetchFacultyDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/getFaculty.php?faculty_id=${facultyId}`);
        const result = await response.json();
        if (result.success) {
          setFacultyName(result.facultyName); // Set the faculty name
        } else {
          console.error("Error fetching faculty details:", result.message);
        }
      } catch (error) {
        console.error("Error fetching faculty details:", error);
      }
    };

    const fetchTotalSubjects = async () => {
      try {
        const response = await fetch(`http://localhost:8000/getTotalSubjects.php?faculty_id=${facultyId}`);
        const result = await response.json();
        if (result.success) {
          setTotalSubjects(result.totalSubjects); // Set the total subjects
        } else {
          console.error("Error fetching total subjects:", result.message);
        }
      } catch (error) {
        console.error("Error fetching total subjects:", error);
      }
    };

    const fetchTotalEnrolledStudents = async () => {
      try {
        const response = await fetch(`http://localhost:8000/getStudents.php?faculty_id=${facultyId}`);
        const result = await response.json();
        if (result.success) {
          setTotalEnrolledStudents(result.totalEnrolledStudents); // Set the total enrolled students
        } else {
          console.error("Error fetching total enrolled students:", result.message);
        }
      } catch (error) {
        console.error("Error fetching total enrolled students:", error);
      }
    };

    // Only fetch data if facultyId is present
    if (facultyId) {
      fetchFacultyDetails();
      fetchTotalSubjects();
      fetchTotalEnrolledStudents();
    }
  }, [facultyId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="faculty-dashboard-container">
      <div className="faculty-dashboard-header">
        <h1>
          Welcome, {facultyName || 'Loading...'}!
        </h1>
        <h2>{currentTime}</h2>
      </div>

      {/* Stats Cards */}
      <div className="faculty-stats-container">
        <div className="faculty-stat-card">
          <FaBars size={30} className="stat-icon" />
          <div className="stat-content">
            <h4>Subjects</h4>
            <h2>{totalSubjects}</h2>
          </div>
        </div>
        <div className="faculty-stat-card">
          <FaBars size={30} className="stat-icon" />
          <div className="stat-content">
            <h4>Enrolled Students</h4>
            <h2>{totalEnrolledStudents}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
