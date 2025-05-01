import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './studentprofile.css';

const StudentProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { student_id } = location.state || {}; // Get the passed student_id
  const [image, setImage] = useState(null); // Image state
  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Determine the API base URL based on the current hostname
  useEffect(() => {
    const baseUrl = 
      window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // For mobile access
    
    setApiBaseUrl(baseUrl);
  }, []);

  useEffect(() => {
    if (!student_id) {
      alert("No student data available");
      navigate("/enrolled-students");
      return;
    }

    // Fetch applicant details from the backend using the dynamic API base URL
    fetch(`${apiBaseUrl}/applicant_details.php?student_id=${student_id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setApplicantData(data.data);

          // Set applicant image if available
          if (data.data.personalinfo?.picture) {
            setImage(`data:image/jpeg;base64,${data.data.personalinfo.picture}`);
          }
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.error("Error fetching applicant details:", error))
      .finally(() => setLoading(false));
  }, [student_id, navigate, apiBaseUrl]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!applicantData) {
    return <p>No applicant data found.</p>;
  }

  return (
    <form className="studentprofile-container">
      <div className="header-sp">
      </div>
      <h2 className="studentprofile-title-sp">STUDENTS DETAILS </h2>

      <div className="image-and-form-container-sp">
        <div className="image-upload-container-sp">
          <div className="box-decoration-sp">
          {image ? (
              <img src={image} alt="Applicant" className="img-display-after-sp" />
            ) : (
              <img src="./src/assets/photo.png" alt="Placeholder" className="img-display-before-sp" />
            )}

          </div>
        </div>

        <div className="form-fields-container-sp">
          <div className="form-row-sp">
            <div className="form-group-sp">
              <label>First Name</label>
              <input type="text" value={applicantData.personalinfo?.first_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Last Name</label>
              <input type="text" value={applicantData.personalinfo?.last_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Middle Name</label>
              <input type="text" value={applicantData.personalinfo?.middle_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Suffix</label>
              <input type="text" value={applicantData.personalinfo?.extension_name || 'N/A'} readOnly />
            </div>
          </div>

          {/* Birthday and other personal details */}
          <div className="form-row-sp">
          <div className="form-group-sp">
              <label>Age</label>
              <input type="number" value={applicantData.personalinfo?.age || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Birthday</label>
              <input type="date" value={applicantData.personalinfo?.birthday || ''} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Birthplace</label>
              <input type="text" value={applicantData.personalinfo?.birthday_place || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Civil Status</label>
              <input type="text" value={applicantData.personalinfo?.civil_status || 'N/A'} readOnly />
            </div>
          </div>

          {/* Additional Details (Religion, Citizenship, Sex, etc.) */}
          <div className="form-row-sp">
            <div className="form-group-sp">
              <label>Religion</label>
              <input type="text" value={applicantData.personalinfo?.religion || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Citizenship</label>
              <input type="text" value={applicantData.personalinfo?.citizenship || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Sex</label>
              <input type="text" value={applicantData.personalinfo?.sex || 'N/A'} readOnly />
            </div>
          </div>

          <div className="form-row-sp">
            <div className="form-group-sp">
              <label>Contact Number</label>
              <input type="text" value={applicantData.personalinfo?.contact_number || 'N/A'} readOnly />
            </div>
            <div className="form-group-sp">
              <label>Email</label>
              <input type="email" value={applicantData.personalinfo?.email || 'N/A'} readOnly />
            </div>
          </div>
        </div>
      </div>

    {/* Present Address */}
<h4>Present Address</h4>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>House No./Street/Purok</label>
    <input type="text" value={applicantData.present_address?.house_no || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Barangay</label>
    <input type="text" value={applicantData.present_address?.barangay || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Municipality</label>
    <input type="text" value={applicantData.present_address?.municipality || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Province</label>
    <input type="text" value={applicantData.present_address?.province || ''} readOnly />
  </div>
</div>
{/* Permanent Address */}
<h4>Permanent Address</h4>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>House No./Street/Purok</label>
    <input type="text" value={applicantData.permanent_address?.house_no || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Barangay</label>
    <input type="text" value={applicantData.permanent_address?.barangay || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Municipality</label>
    <input type="text" value={applicantData.permanent_address?.municipality || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Province</label>
    <input type="text" value={applicantData.permanent_address?.province || ''} readOnly />
  </div>
</div>

<hr className="separator" />
<h4>Enrollment Data</h4>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Learner Reference Number</label>
    <input type="text" value={applicantData.enrollmentdata?.LRN || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Grade Level</label>
    <input type="text" value={applicantData.enrollmentdata?.grade_level || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>School Year</label>
    <input type="text" value={applicantData.enrollmentdata?.school_year || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Curriculum</label>
    <input type="text" value={applicantData.enrollmentdata?.curriculum || ''} readOnly />
  </div>
  </div>
  <div className="form-row-sp">
  <div className="form-group-sp">
    <label>Track/Strand</label>
    <input type="text" value={applicantData.enrollmentdata?.strand_track || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Campus</label>
    <input type="text" value={applicantData.enrollmentdata?.campus || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Sport/s</label>
    <input type="text" value={applicantData.enrollmentdata?.sports || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Favorite Subject/s</label>
    <input type="text" value={applicantData.enrollmentdata?.fav_subjects || ''} readOnly />
  </div>
</div>

<hr className="separator" />
<h4>Father</h4>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Father First Name</label>
    <input type="text" value={applicantData.father?.father_fname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Father Last Name</label>
    <input type="text" value={applicantData.father?.father_lname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Father Middle Name</label>
    <input type="text" value={applicantData.father?.father_midname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Father Age</label>
    <input type="number" value={applicantData.father?.father_age || ''} readOnly />
  </div>
</div>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Occupation</label>
    <input type="text" value={applicantData.father?.father_occupation || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Phone Number</label>
    <input type="text" value={applicantData.father?.father_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.father?.father_educAttainment || ''} readOnly />
  </div>
</div>

{/* Mother */}
<hr className="separator" />
<h4>Mother</h4>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Mother First Name</label>
    <input type="text" value={applicantData.mother?.mother_fname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Mother Last Name</label>
    <input type="text" value={applicantData.mother?.mother_lname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Mother Middle Name</label>
    <input type="text" value={applicantData.mother?.mother_midname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Mother Age</label>
    <input type="number" value={applicantData.mother?.mother_age || ''} readOnly />
  </div>
</div>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Occupation</label>
    <input type="text" value={applicantData.mother?.mother_occupation || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Phone Number</label>
    <input type="text" value={applicantData.mother?.mother_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.mother?.mother_educAttainment || ''} readOnly />
  </div>
</div>

{/* Guardian */}
<hr className="separator" />
<h4>Guardian</h4>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Guardian First Name</label>
    <input type="text" value={applicantData.guardian?.guardian_fname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Guardian Last Name</label>
    <input type="text" value={applicantData.guardian?.guardian_lname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Guardian Middle Name</label>
    <input type="text" value={applicantData.guardian?.guardian_midname || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Guardian Age</label>
    <input type="number" value={applicantData.guardian?.guardian_age || ''} readOnly />
  </div>
</div>
<div className="form-row-sp">
  <div className="form-group-sp">
    <label>Occupation</label>
    <input type="text" value={applicantData.guardian?.guardian_occupation || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Phone Number</label>
    <input type="text" value={applicantData.guardian?.guardian_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-sp">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.guardian?.guardian_educAttainment || ''} readOnly />
  </div>
</div>

{/* Siblings Section */}
<hr className="separator" />
<h4>Siblings (Eldest to Youngest)</h4>

{applicantData.sibling ? (
  <div className="sibling-section-sp">
    <h5>Sibling</h5>
    <div className="form-row-sp">
      <div className="form-group-sp">
        <label>First Name</label>
        <input type="text" value={applicantData.sibling.sibling_fname || ''} readOnly />
      </div>
      <div className="form-group-sp">
        <label>Last Name</label>
        <input type="text" value={applicantData.sibling.sibling_lname || ''} readOnly />
      </div>
      <div className="form-group-sp">
        <label>Middle Name</label>
        <input type="text" value={applicantData.sibling.sibling_midname || ''} readOnly />
      </div>
      <div className="form-group-sp">
        <label>Age</label>
        <input type="number" value={applicantData.sibling.sibling_age || ''} readOnly />
      </div>
    </div>

    <div className="form-row-sp">
      <div className="form-group-sp">
        <label>Occupation</label>
        <input type="text" value={applicantData.sibling.sibling_occupation || ''} readOnly />
      </div>
      <div className="form-group-sp">
        <label>Phone Number</label>
        <input type="text" value={applicantData.sibling.sibling_phoneNum || ''} readOnly />
      </div>
      <div className="form-group-sp">
        <label>Educational Attainment</label>
        <input type="text" value={applicantData.sibling.sibling_educAttainment || ''} readOnly />
      </div>
    </div>
  </div>
) : (
  <p>No siblings data available.</p>
  
)}

    </form>
  );
};

export default StudentProfile;