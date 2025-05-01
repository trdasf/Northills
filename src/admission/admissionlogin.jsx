import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admissionlogin.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AdmissionLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');

    try {
      // First login request
      const response = await fetch('http://localhost:8000/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Check if the email exists in the personalinfo table
        const personalInfoResponse = await fetch('http://localhost:8000/checkPersonalInfo.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const personalInfoResult = await personalInfoResponse.json();

        if (personalInfoResult.success) {
          // Navigate to officially-enrolled with student_id
          navigate('/officially-enrolled', { state: { student_id: personalInfoResult.student_id } });
        } else {
          navigate('/personalinfo', { state: { account_id: result.account_id } });
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('An error occurred. Please try again later.');
    }
  };

  const handleSignUp = () => {
    navigate('/account-registration');
  };

  return (
    <div className="admission-container">
      <div className="background-image-ads">
        <div className="login-box-ads">
          <img src="/src/assets/cnalogo.png" alt="Logo" className="logo-img-al-ads" />
          <h2 className="system-title-ads">ONLINE PRE-ADMISSION SYSTEM</h2>

          <div className="login-form">
            <hr className="separator-ads" />
            <h2 className="sign-in-title-ads">SIGN IN</h2>
            <input
              type="text"
              placeholder="Email"
              className="input-field-ads"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="password-container-ads">
                         <input
                           type={showPassword ? 'text' : 'password'}
                           placeholder="Password"
                           className="password-input-ads"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                         />
                         <button
                           type="button"
                           className="view-icon-button-ads"
                           onClick={() => setShowPassword(!showPassword)}
                         >
                           {showPassword ? <FaEye /> : <FaEyeSlash />}
                         </button>
                       </div>
            <button className="login-button-ads" onClick={handleLogin}>
              LOGIN
            </button>
            {error && <p className="error-message-ads">{error}</p>}

            <div className="options-ads">
            <span className="info">
                  For new applicants, click signup to register &nbsp;&nbsp;
                  </span>
            </div>
            <div className="sign-up-sua">
              <label className="sua">
                  <a href="#" className="sign-up" onClick={handleSignUp}>SIGN UP</a>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionLogin;
