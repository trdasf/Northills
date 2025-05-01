import React, { useState, useEffect } from 'react'; 
import './applicants.css'; 
import { FaEye } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';

const Applicants = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');  // State for search query

  useEffect(() => {
    const apiUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:8000/fetch_applicants.php"
        : "http://192.168.1.10:8000/fetch_applicants.php"; // Gamitin ang IP para sa mobile access
  
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setApplicants(data.applicants);
        } else {
          alert(data.message);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching applicants:", error);
        setLoading(false);
      });
  }, []);
  

  const viewApplicant = (applicantData) => {
    // Pass the student_id to the view details page using React Router's navigate method
    navigate('/view-applicants', { state: { student_id: applicantData.student_id } });
  };

  const goToSchedule = () => {
    navigate('/schedule');
  };

  // Filter applicants based on the search query
  const filteredApplicants = applicants.filter((applicant) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      applicant.name.toLowerCase().includes(searchLower) ||
      applicant.email.toLowerCase().includes(searchLower) ||
      applicant.contact_number.toLowerCase().includes(searchLower) ||
      applicant.LRN.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="applicants-container-ap">
      <div className="header-ap">
        <h2 className="application-title-ap">Applicants List</h2>
        <p className="total-label-ap">Total: <span className="total-count-ap">{filteredApplicants.length}</span></p>
      </div>

      <div className="top-controls-applicants-ap">
        <div className="search-bar-applicants-ap">
          <input 
            type="text" 
            placeholder="Search by name, email, contact or LRN" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query on input change
          />
                 </div>
        <button className="schedule-button-ap" onClick={goToSchedule}>SCHEDULE</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="application-table-container-ap">
        <table className="application-table-ap">
          <thead>
            <tr>
              <th>NO.</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>CONTACT NUMBER</th>
              <th>LEARNER REFERENCE NUMBER (LRN)</th>
              <th>VIEW</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.map((applicant, index) => (
              <tr key={applicant.student_id}>
                <td>{index + 1}</td>
                <td>{applicant.name}</td>
                <td>{applicant.email}</td>
                <td>{applicant.contact_number}</td>
                <td>{applicant.LRN}</td>
                <td>
                  <FaEye
                    className="view-icon-ap"
                    onClick={() => viewApplicant(applicant)}  // Pass student_id to viewApplicant
                    style={{ cursor: 'pointer', color: '#006400' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default Applicants;
