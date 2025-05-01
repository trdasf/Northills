import React, { useEffect, useState } from "react";
import "./dashboard.css";
import { FaBars } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [dashboardData, setDashboardData] = useState({
    pendingApplicants: 0,
    enrolledStudents: 0,
    subjects: 0,
    strands: 0,
    availableSlots: 0,
    faculties: 0,
    maleStudents: 0,
    femaleStudents: 0,
  });
  const [enrollmentData, setEnrollmentData] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    const apiUrl =
      window.location.hostname === "localhost"
        ? "http://mediumaquamarine-dunlin-251088.hostingersite.com/admin_dashboard.php"
        : "http://192.168.1.10:8000/admin_dashboard.php"; // Para sa mobile access

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        setDashboardData(data);
        setEnrollmentData(data.enrollmentData);
      })
      .catch((error) => console.error("Error fetching data:", error));

    return () => clearInterval(timer);
  }, []);

  const dataEnrolled = {
    labels: enrollmentData.map((entry) => entry.school_year),
    datasets: [
      {
        label: "Enrolled",
        backgroundColor: "#006400",
        data: enrollmentData.map((entry) => entry.count),
      },
    ],
  };

  const dataGender = {
    labels: ["Female", "Male"],
    datasets: [
      {
        label: "Total Students by Gender",
        backgroundColor: ["#006400", "#006400"],
        data: [dashboardData.femaleStudents, dashboardData.maleStudents],
      },
    ],
  };

  const stats = [
    { title: "No. of Applicants", value: dashboardData.pendingApplicants },
    { title: "Enrolled Students", value: dashboardData.enrolledStudents },
    { title: "No. of Subjects", value: dashboardData.subjects },
    { title: "Strands", value: dashboardData.strands },
    { title: "Available Slots", value: dashboardData.availableSlots },
    { title: "No. of Faculties", value: dashboardData.faculties },
    { title: "No. of Female Students", value: dashboardData.femaleStudents },
    { title: "No. of Male Students", value: dashboardData.maleStudents },
  ];

  return (
    <div className="dashboard-container-dh">
      <div className="dashboard-header-dh">
        <h1 className="dash-title">DASHBOARD</h1>
        <h2 className="dash-time">{currentTime}</h2>
      </div>

      {/* Stats cards */}
      <div className="stats-container-dh">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-dh">
            <div className="stat-icon-dh">
              <FaBars />
            </div>
            <div className="stat-info-dh">
              <h3 className="stattitle-dh">{stat.title}</h3>
              <h2 className="statvalue-dh">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-container-dh">
        <div className="chart-dh">
          <h3>Total Number of Enrolled</h3>
          <Bar data={dataEnrolled} options={{ responsive: true }} />
        </div>
        <div className="chart-dh">
          <h3>Total Number of Students by Gender</h3>
          <Bar data={dataGender} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
