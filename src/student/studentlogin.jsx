import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './studentlogin.css';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Determine the API base URL based on the current hostname
  useEffect(() => {
    const baseUrl = 
      window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // For mobile access
    
    setApiBaseUrl(baseUrl);
  }, []);

  const handleLogin = async () => {
    if (!userId || !password) {
      alert("Please enter both username and password");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/studentlogin.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          password: password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to the next interface with the student_id
        navigate('/student-dashboard', { state: { student_id: result.student_id } });
      } else {
        alert(result.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="admin-container">
      <div className="background-image-student">
        <div className="login-box-student">
          <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-al-student" />
          <h2 className="system-title-student">Northills College of Asia</h2>

          <div className="login-form">
            <hr className="separator-student" />
            <h2 className="sign-in-title-student">STUDENT PORTAL</h2>
            
            <input
              type="text"
              placeholder="Username"
              className="input-field-student"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <div className="password-container-student"> 
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="password-input-student"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="view-icon-button-student"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash/>}
              </button>
            </div>
            <button 
              className="login-button-student" 
              onClick={handleLogin}
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;