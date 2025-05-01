import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './parentlogin.css';

const ParentLogin = () => {
  const navigate = useNavigate();
  const [parentUserId, setParentUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    // Validate input
    if (!parentUserId || !password) {
      setErrorMessage("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/parentlogin.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent_user_id: parentUserId, parent_password: password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the student_id in localStorage (or state if preferred)
        localStorage.setItem('student_id', data.student_id);

        // Pass student_id as a state in the navigate function
        navigate('/parent-dashboard', { state: { student_id: data.student_id } });
      } else {
        setErrorMessage(data.message); // Show error message if login fails
      }
    } catch (error) {
      console.error("Login failed", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="parent-container">
      <div className="background-image-parent">
        <div className="login-box-parent">
          <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-al-parent" />
          <h2 className="system-title-parent">Northills College of Asia</h2>

          <div className="login-form-parent">
            <hr className="separator-parent" />
            <h2 className="sign-in-title-parent">PARENT PORTAL</h2>

            <input 
              type="text" 
              placeholder="Username" 
              className="input-field-parent" 
              value={parentUserId}
              onChange={(e) => setParentUserId(e.target.value)}
            />

            <div className="password-container-parent">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="password-input-parent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="view-icon-button-parent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button className="login-button-parent" onClick={handleLogin}>LOGIN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;
