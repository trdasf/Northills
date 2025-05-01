import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './viewapplicants.css';

const ViewApplicants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const student_id = location.state?.student_id || sessionStorage.getItem('student_id');

  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null); // Image state
  const [showModal, setShowModal] = useState(false); // Show/Hide confirmation modal
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal
  const [action, setAction] = useState(""); // Action: approve or reject
  const [time, setTime] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [requirementsStatus, setRequirementsStatus] = useState({});
  const [section, setSection] = useState(""); // Ensure section state is initialized
  const [sections, setSections] = useState([]); // Sections for the dropdown
  const [selectedSection, setSelectedSection] = useState(""); // Selected section
  

   // Array of display labels for the requirements
   const requirements = [
    'Birth Certificate',
    'Certificate of Good Moral Character',
    'High School Diploma',
    'Transcript of Records',
    'ID Picture',
  ];

  // Mapping from display labels to shortened keys
  const requirementKeys = {
    'Birth Certificate': 'birth_certificate',
    'Certificate of Good Moral Character': 'good_moral',
    'High School Diploma': 'highschool_diploma',
    'Transcript of Records': 'TOR',
    'ID Picture': 'id_picture',
  };

  useEffect(() => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    fetch(`${baseUrl}/applicant_details.php?student_id=${student_id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setApplicantData(data.data);

          // Set image if available
          if (data.data.personalinfo?.picture) {
            setImage(`data:image/jpeg;base64,${data.data.personalinfo.picture}`);
          }

          // Initialize requirements status
          const initialStatus = {};
          for (const [label, key] of Object.entries(requirementKeys)) {
            initialStatus[label] = data.data.finalstep?.[key] || "NOT_SUBMITTED";
          }
          setRequirementsStatus(initialStatus);

          setRemark(data.data.finalstep?.status || "PENDING");
          setSection(data.data.enrollmentdata?.section || ""); // Initialize section from data

          // Fetch sections based on student's strand and grade
          fetch(`${baseUrl}/fetch_strandSection.php?student_id=${student_id}`)
            .then((response) => response.json())
            .then((sectionData) => {
              if (sectionData.success) {
                setSections(sectionData.sections); // Update sections dropdown
                setSelectedSection(data.data.enrollmentdata?.section || ""); // Pre-fill selected section if available
              } else {
                console.error("Error fetching sections:", sectionData.message);
              }
            })
            .catch((error) => console.error("Error fetching sections:", error));
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.error("Error fetching applicant details:", error))
      .finally(() => setLoading(false));
}, [student_id, navigate]);

  
  
  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const handleStatusChange = (requirement, status) => {
    setRequirementsStatus((prev) => ({
      ...prev,
      [requirement]: status,
    }));
  };

  const isAllRequirementsSubmitted = () =>
    Object.values(requirementsStatus).every((status) => status === "SUBMITTED");

  const handleApprovalChange = (e) => {
    const selectedRemark = e.target.value;
  
    if (selectedRemark === "APPROVE") {
      if (!isAllRequirementsSubmitted()) {
        alert("All requirements must be submitted to approve.");
        setRemark("PENDING");
      } else if (!selectedSection.trim()) {
        alert("Section must be provided before approval.");
        setRemark("PENDING");
      } else {
        setRemark("APPROVE");
      }
    } else {
      // Allow "PENDING" updates and other remarks.
      setRemark(selectedRemark);
    }
  };
  const handleUpdate = async () => {
    const updatedRequirements = {};
    for (const [label, key] of Object.entries(requirementKeys)) {
      updatedRequirements[key] = requirementsStatus[label];
    }
  
    try {
      const response = await fetch("http://localhost:8000/requirements.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id,
          requirements: updatedRequirements,
          remark,
          section: selectedSection.trim(),
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        alert(errorData.message || `Error: ${response.statusText} (Status: ${response.status})`);
        return;
      }
  
      const data = await response.json();
  
      if (data.success || data.message === "Requirements successfully updated.") {
        console.log("Update successful");
        if (remark === "APPROVE") {
          window.location.href = "/applicants"; // Navigate immediately
        } else {
          setShowSuccessModal(true); // Show success modal for other remarks
        }
      } else {
        alert(data.message || "An error occurred while updating.");
      }
    } catch (error) {
      console.error("Error in update:", error);
      alert("A network or server error occurred. Please try again.");
    } finally {
      setShowModal(false);
    }
  };
  
  
  
  
  // Success Modal close handler
const closeSuccessModal = () => {
  setShowSuccessModal(false);
  navigate("/applicants"); // Navigate to applicants list after closing modal
};

  
  
  
  const openModal = () => setShowModal(true); // Open confirmation modal
  const closeModal = () => setShowModal(false); // Close confirmation modal
 
  
  
  
  

  if (loading) {
    return <p>Loading...</p>;
  }
  
  if (!student_id) {
    return <p>No student selected. Please return to the applicants list.</p>;
  }
  
  if (!applicantData) {
    return <p>No applicant data found. Please try again later.</p>;
  }
  
  

  return (
    <form className="viewapplicants-container">
      <input type="hidden" name="student_id" value={student_id || ''} />

      <div className="header-vp">
        <button type="button" className="breadcrumb-button" onClick={() => navigate('/applicants')}>
          Applicants List /
        </button>  
        <span className="applicant-name">
    {applicantData.personalinfo?.first_name} {applicantData.personalinfo?.last_name}
  </span>
  </div>
      <h2 className="application-title-vp">VIEW APPLICANT DETAILS </h2>

      <div className="image-and-form-container-vp">
        <div className="image-upload-container-vp">
          <div className="box-decoration-vp">
          {image ? (
              <img src={image} alt="Applicant" className="img-display-after-vp" />
            ) : (
              <img src="./src/assets/photo.png" alt="Placeholder" className="img-display-before-vp" />
            )}

          </div>
        </div>

        <div className="form-fields-container-vp">
          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>First Name</label>
              <input type="text" value={applicantData.personalinfo?.first_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Last Name</label>
              <input type="text" value={applicantData.personalinfo?.last_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Middle Name</label>
              <input type="text" value={applicantData.personalinfo?.middle_name || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Suffix</label>
              <input type="text" value={applicantData.personalinfo?.extension_name || 'N/A'} readOnly />
            </div>
          </div>

          {/* Birthday and other personal details */}
          <div className="form-row-vp">
          <div className="form-group-vp">
              <label>Age</label>
              <input type="number" value={applicantData.personalinfo?.age || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Birthday</label>
              <input type="date" value={applicantData.personalinfo?.birthday || ''} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Birthplace</label>
              <input type="text" value={applicantData.personalinfo?.birthday_place || 'N/A'} readOnly />
            </div>
          </div>

          {/* Additional Details (Religion, Citizenship, Sex, etc.) */}
          <div className="form-row-vp">
                        <div className="form-group-vp">
              <label>Civil Status</label>
              <input type="text" value={applicantData.personalinfo?.civil_status || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Religion</label>
              <input type="text" value={applicantData.personalinfo?.religion || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Citizenship</label>
              <input type="text" value={applicantData.personalinfo?.citizenship || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Sex</label>
              <input type="text" value={applicantData.personalinfo?.sex || 'N/A'} readOnly />
            </div>
          </div>

          <div className="form-row-vp">
            <div className="form-group-vp">
              <label>Contact Number</label>
              <input type="text" value={applicantData.personalinfo?.contact_number || 'N/A'} readOnly />
            </div>
            <div className="form-group-vp">
              <label>Email</label>
              <input type="email" value={applicantData.personalinfo?.email || 'N/A'} readOnly />
            </div>
          </div>
        </div>
      </div>

    {/* Present Address */}
<h4>Present Address</h4>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>House No./Street/Purok</label>
    <input type="text" value={applicantData.present_address?.house_no || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Barangay</label>
    <input type="text" value={applicantData.present_address?.barangay || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Municipality</label>
    <input type="text" value={applicantData.present_address?.municipality || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Province</label>
    <input type="text" value={applicantData.present_address?.province || ''} readOnly />
  </div>
</div>
{/* Permanent Address */}
<h4>Permanent Address</h4>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>House No./Street/Purok</label>
    <input type="text" value={applicantData.permanent_address?.house_no || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Barangay</label>
    <input type="text" value={applicantData.permanent_address?.barangay || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Municipality</label>
    <input type="text" value={applicantData.permanent_address?.municipality || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Province</label>
    <input type="text" value={applicantData.permanent_address?.province || ''} readOnly />
  </div>
</div>

<hr className="separator" />
<h4>Enrollment Data</h4>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>LRN</label>
    <input type="text" value={applicantData.enrollmentdata?.LRN || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Grade Level</label>
    <input type="text" value={applicantData.enrollmentdata?.grade_level || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>School Year</label>
    <input type="text" value={applicantData.enrollmentdata?.school_year || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Curriculum</label>
    <input type="text" value={applicantData.enrollmentdata?.curriculum || ''} readOnly />
  </div>
  <div className="form-row-vp">
  <div className="form-group-vp">
    <label>Track/Strand</label>
    <input type="text" value={applicantData.enrollmentdata?.strand_track || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Campus</label>
    <input type="text" value={applicantData.enrollmentdata?.campus || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Sport/s</label>
    <input type="text" value={applicantData.enrollmentdata?.sports || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Favorite Subject/s</label>
    <input type="text" value={applicantData.enrollmentdata?.fav_subjects || ''} readOnly />
  </div>
  </div>
</div>

<hr className="separator" />
<h4>Father</h4>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>Father First Name</label>
    <input type="text" value={applicantData.father?.father_fname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Father Last Name</label>
    <input type="text" value={applicantData.father?.father_lname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Father Middle Name</label>
    <input type="text" value={applicantData.father?.father_midname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Father Age</label>
    <input type="number" value={applicantData.father?.father_age || ''} readOnly />
  </div>
</div>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>Occupation</label>
    <input type="text" value={applicantData.father?.father_occupation || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Phone Number</label>
    <input type="text" value={applicantData.father?.father_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.father?.father_educAttainment || ''} readOnly />
  </div>
</div>

{/* Mother */}
<hr className="separator" />
<h4>Mother</h4>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>Mother First Name</label>
    <input type="text" value={applicantData.mother?.mother_fname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Mother Last Name</label>
    <input type="text" value={applicantData.mother?.mother_lname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Mother Middle Name</label>
    <input type="text" value={applicantData.mother?.mother_midname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Mother Age</label>
    <input type="number" value={applicantData.mother?.mother_age || ''} readOnly />
  </div>
</div>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>Occupation</label>
    <input type="text" value={applicantData.mother?.mother_occupation || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Phone Number</label>
    <input type="text" value={applicantData.mother?.mother_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.mother?.mother_educAttainment || ''} readOnly />
  </div>
</div>

{/* Guardian */}
<hr className="separator" />
<h4>Guardian</h4>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>Guardian First Name</label>
    <input type="text" value={applicantData.guardian?.guardian_fname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Guardian Last Name</label>
    <input type="text" value={applicantData.guardian?.guardian_lname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Guardian Middle Name</label>
    <input type="text" value={applicantData.guardian?.guardian_midname || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Guardian Age</label>
    <input type="number" value={applicantData.guardian?.guardian_age || ''} readOnly />
  </div>
</div>
<div className="form-row-vp">
  <div className="form-group-vp">
    <label>Occupation</label>
    <input type="text" value={applicantData.guardian?.guardian_occupation || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Phone Number</label>
    <input type="text" value={applicantData.guardian?.guardian_phoneNum || ''} readOnly />
  </div>
  <div className="form-group-vp">
    <label>Educational Attainment</label>
    <input type="text" value={applicantData.guardian?.guardian_educAttainment || ''} readOnly />
  </div>
</div>

{/* Siblings Section */}
<hr className="separator" />
<h4>Siblings (Eldest to Youngest)</h4>

{applicantData.sibling ? (
  <div className="sibling-section">
    <h5>Sibling</h5>
    <div className="form-row-vp">
      <div className="form-group-vp">
        <label>First Name</label>
        <input type="text" value={applicantData.sibling.sibling_fname || ''} readOnly />
      </div>
      <div className="form-group-vp">
        <label>Last Name</label>
        <input type="text" value={applicantData.sibling.sibling_lname || ''} readOnly />
      </div>
      <div className="form-group-vp">
        <label>Middle Name</label>
        <input type="text" value={applicantData.sibling.sibling_midname || ''} readOnly />
      </div>
      <div className="form-group-vp">
        <label>Age</label>
        <input type="number" value={applicantData.sibling.sibling_age || ''} readOnly />
      </div>
    </div>

    <div className="form-row-vp">
      <div className="form-group-vp">
        <label>Occupation</label>
        <input type="text" value={applicantData.sibling.sibling_occupation || ''} readOnly />
      </div>
      <div className="form-group-vp">
        <label>Phone Number</label>
        <input type="text" value={applicantData.sibling.sibling_phoneNum || ''} readOnly />
      </div>
      <div className="form-group-vp">
        <label>Educational Attainment</label>
        <input type="text" value={applicantData.sibling.sibling_educAttainment || ''} readOnly />
      </div>
    </div>
  </div>
) : (
  <p>No siblings data available.</p>
  
)}
 <hr className="separator" />
      <h4>Date & Time</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Date</label>
          
          <input type="text" value={applicantData.finalstep.submission_date || ''} readOnly />
        </div>
        <div className="form-group-vp">
        <label>Time</label>
          
          <input type="text" value={applicantData.finalstep.submission_time || ''} readOnly />
      
        </div>
      </div>

 {/* Requirements */}
 <hr className="separator" />
 <h4>Requirements</h4>
      <div className="requirements-section">
        {Object.keys(requirementKeys).map((requirement) => (
          <div key={requirement} className="requirement-row">
            <label className="requirement-label">{requirement}</label>
            <select
              className="requirement-status-dropdown"
              value={requirementsStatus[requirement]}
              onChange={(e) => handleStatusChange(requirement, e.target.value)}
            >
              <option value="SUBMITTED">Submitted</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>
        ))}
      </div>




     
        {/* Section Input */}
        <hr className="separator" />
      {/* Section Dropdown */}
      <div className="form-group">
        <label>Section</label>
        <select value={selectedSection} onChange={handleSectionChange}>
          <option value="">Select a section</option>
          {sections.map((section, index) => (
            <option key={index} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>
    
        {/* Remark Section */}
        <hr className="separator" />
      <h4>Remark</h4>
      <div className="form-row-vp">
        <div className="form-group-vp">
          <label>Remark Status</label>
          <select
            name="remark"
            value={remark}
            onChange={handleApprovalChange}
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVE" disabled={!isAllRequirementsSubmitted()}>
              APPROVE
            </option>
          </select>
        </div>
      </div>

    

     <div className="button-container-vapp">
      <button
  type="button" // Prevent form submission
  className="update-button-vp"
  onClick={openModal}
>
  Update
</button>
</div>


       {/* Confirmation Modal */}
       {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Update</h3>
            <p>Are you sure you want to update the requirements?</p>
            <div className="modal-actions-vp">
            <button onClick={handleUpdate} className="confirm-button-vp">Confirm</button>
            <button onClick={closeModal} className="cancel-button-vp">Cancel</button>
          </div>
          </div>
        </div>
      )}
{/* Success Modal */}
{showSuccessModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Update Successful</h3>
      <p>The applicant's details have been successfully updated.</p>
      <button onClick={closeSuccessModal}>Okay</button>
    </div>
  </div>
)}





    </form>
  );
};

export default ViewApplicants;
