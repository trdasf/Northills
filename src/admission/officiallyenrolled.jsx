import React, { useEffect, useState } from "react";
import "./officiallyenrolled.css";
import { useNavigate, useLocation } from "react-router-dom";

const OfficiallyEnrolled = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.student_id || "N/A";

  const [studentInfo, setStudentInfo] = useState({
    last_name: "N/A",
    first_name: "N/A",
    status: "PENDING", // Default to PENDING
    strand_track: "",
    strand_description: "", // Adding the strand description
    user_id: "",
    password: "",
    parent_user_id: "",
    parent_password: "",
  });

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await fetch("http://localhost:8000/getStudentDetails.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ student_id: studentId }),
        });
  
        const result = await response.json();
  
        if (result.success) {
          if (result.status === "PENDING") {
            // Display the "Pending" message
            setStudentInfo((prev) => ({
              ...prev,
              status: "PENDING",
              first_name: result.first_name, // Set first_name for pending
              last_name: result.last_name, // Set last_name for pending
            }));
          } else if (result.status === "APPROVE") {
            // Display the "Approve" message and credentials
            setStudentInfo((prev) => ({
              ...prev,
              status: "APPROVE",
              first_name: result.first_name,
              last_name: result.last_name,
              strand_track: result.strand_track,
              strand_description: result.strand_description, // Adding strand description here
              user_id: result.user_id,
              password: result.password,
              parent_user_id: result.parent_user_id,
              parent_password: result.parent_password, // Add parent_password here
            }));
          }
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    };
  
    if (studentId !== "N/A") {
      fetchStudentDetails();
    }
  }, [studentId]);

  const saveStudentCredentials = async (user_id, password, parent_user_id, parent_password) => {
    try {
      const response = await fetch("http://localhost:8000/saveCredentials.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          password,
          parent_user_id,
          parent_password,
          student_id: location.state?.student_id || 1, // Ensure student_id is sent
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        console.log("Credentials saved successfully");
        navigate("/student-login"); // Navigate to the next interface
      } else if (result.message.includes("already exists")) {
        console.warn("Student already enrolled. Proceeding to the next interface.");
        navigate("/student-login"); // Allow navigation even if the student is already enrolled
      } else {
        console.error("Error:", result.message);
        alert(result.message); // Handle other errors
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      alert("An error occurred while processing your request.");
    }
  };
  

  return (
    <div className="officially-enrolled-container">
      <div className="banner">
        <img
          src="/src/assets/cnalogo.png"
          alt="Northhills College Logo"
          className="college-logo"
        />
        <h1 className="welcome-message">WELCOME</h1>
        <h2 className="highlight">
          {studentInfo.status === "PENDING" ? (
            <>{studentInfo.first_name} {studentInfo.last_name}</>
          ) : (
            <>{studentInfo.last_name.toUpperCase()}, {studentInfo.first_name.toUpperCase()}</>
          )}
        </h2>
      </div>
      <div className="enrollment-details">
        {studentInfo.status === "APPROVE" ? (
          <>
            <p>
              Congratulations! You are now <strong>OFFICIALLY ENROLLED</strong> at
              Northhills College of Asia in the <strong>{studentInfo.strand_track}  ({studentInfo.strand_description})</strong> program, 
            </p>
            <p>You can access your student portal using the credentials below:</p>
            <ul className="credentials-list">
              <li>
                <strong>User ID:</strong> {studentInfo.user_id}
              </li>
              <li>
                <strong>Password:</strong> {studentInfo.password}
              </li>
            </ul>
            <p>Additionally, here are the credentials for your parent portal account:</p>
            <ul className="credentials-list">
              <li>
                <strong>User ID:</strong> {studentInfo.parent_user_id}
              </li>
              <li>
                <strong>Password:</strong> {studentInfo.parent_password}
              </li>
            </ul>
            <button
              className="portal-button"
              onClick={async () => {
                await saveStudentCredentials(
                  studentInfo.user_id,
                  studentInfo.password,
                  studentInfo.parent_user_id,
                  studentInfo.parent_password
                );
                navigate("/student-login");
              }}
            >
              PROCEED TO STUDENT PORTAL
            </button>
          </>
        ) : (
          <>
            <p>
              Your application is currently <strong>PENDING</strong>. Please wait for further updates
              regarding the approval of your enrollment at Northills College of Asia.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OfficiallyEnrolled;
