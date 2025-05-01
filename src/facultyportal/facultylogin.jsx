import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './facultylogin.css';

const FacultyLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/facultylogin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (result.success) {
        // Pass faculty_id to the next interface
        navigate('/faculty-dashboard', { state: { faculty_id: result.faculty_id } } );
      } else {
        alert(result.message || 'Invalid credentials');
      }
    } catch (error) {
      alert('An error occurred during login. Please try again.');
    }
  };
  

  return (
    <div className="admin-container">
      <div className="background-image-faculty">
        <div className="login-box-faculty">
          <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-al-faculty" />
          <h2 className="system-title-faculty">Northills College of Asia</h2>
          <div className="login-form-faculty">
            <hr className="separator-faculty" />
            <h2 className="sign-in-title-faculty">FACULTY PORTAL</h2>
            <input
              type="email"
              placeholder="Email"
              className="input-field-faculty"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="password-container-faculty"> 
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="password-input-faculty"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
                type="button"
                className="view-icon-button-faculty"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <button className="login-button-faculty" onClick={handleLogin}>LOGIN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
