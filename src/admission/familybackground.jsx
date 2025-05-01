import React, { useState, useEffect } from 'react';
import './familybackground.css';
import { useNavigate, useLocation } from 'react-router-dom';

const FamilyBackground = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location; // state holds data from EnrollmentData and PersonalInfoForm

  // State for modal and sibling data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [newSibling, setNewSibling] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
    educationAttainment: '',
  });

  // Log the received data from previous components on mount
  useEffect(() => {
    if (state) {
      console.log("Data received from EnrollmentData and PersonalInfoForm:");
      console.log(state); // Log all received data for verification
    } else {
      console.log("No data received.");
    }
  }, [state]);

  // Navigation functions
  const handlePrevious = () => {
    navigate('/enrollment-data');
  };

  const handleNext = (event) => {
    event.preventDefault();
    
    // Gather all family background data
    const familyBackgroundData = {
      ...state, // Existing data from PersonalInfoForm and EnrollmentData
      familyDetails: {
        father: {
          firstName: document.querySelector('input[name="fatherFirstName"]').value,
          lastName: document.querySelector('input[name="fatherLastName"]').value,
          middleName: document.querySelector('input[name="fatherMiddleName"]').value,
          age: document.querySelector('input[name="fage"]').value,
          occupation: document.querySelector('input[name="foccupation"]').value,
          phoneNumber: document.querySelector('input[name="fphonenumber"]').value,
          educationAttainment: document.querySelector('input[name="feducationattainment"]').value,
        },
        mother: {
          firstName: document.querySelector('input[name="motherFirstName"]').value,
          lastName: document.querySelector('input[name="motherLastName"]').value,
          middleName: document.querySelector('input[name="motherMiddleName"]').value,
          age: document.querySelector('input[name="mage"]').value,
          occupation: document.querySelector('input[name="moccupation"]').value,
          phoneNumber: document.querySelector('input[name="mphonenumber"]').value,
          educationAttainment: document.querySelector('input[name="meducationattainment"]').value,
        },
        guardian: {
          firstName: document.querySelector('input[name="guardianFirstName"]').value,
          lastName: document.querySelector('input[name="guardianLastName"]').value,
          middleName: document.querySelector('input[name="guardianMiddleName"]').value,
          age: document.querySelector('input[name="gage"]').value,
          occupation: document.querySelector('input[name="goccupation"]').value,
          phoneNumber: document.querySelector('input[name="gphonenumber"]').value,
          educationAttainment: document.querySelector('input[name="geducationattainment"]').value,
        },
      },
      siblings, // Include siblings array
    };
    
    navigate('/requirements', { state: familyBackgroundData });
  };

  // Modal handling functions
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewSibling({
      firstName: '',
      lastName: '',
      middleName: '',
      age: '',
      occupation: '',
      phoneNumber: '',
      educationAttainment: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSibling({ ...newSibling, [name]: value });
  };

  const addSibling = () => {
    setSiblings([...siblings, newSibling]);
    closeModal();
  };

  return (
    <div className="family-background-form">
      <h2>Family Background</h2>
      <form onSubmit={handleNext}>
        <h4>Father</h4>
        <div className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>Father First Name <span className="required">*</span></label>
            <input type="text" name="fatherFirstName" required />
          </div>
          <div className="form-group-fb-parents">
            <label>Father Last Name <span className="required">*</span></label>
            <input type="text" name="fatherLastName" required />
          </div>
          <div className="form-group-fb">
            <label>Father Middle Name</label>
            <input type="text" name="fatherMiddleName" placeholder="If none, leave it blank" />
          </div>
          <div className="form-group-fb-fb">
            <label>Age <span className="required">*</span></label>
            <input type="number" name="fage" />
          </div>
        </div>

        <div className="form-row-fb">
          <div className="form-group-fb">
            <label>Occupation <span className="required">*</span></label>
            <input type="text" name="foccupation" required />
          </div>
          <div className="form-group-fb">
            <label>Phone Number <span className="required">*</span></label>
            <input type="text" name="fphonenumber" required />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment <span className="required">*</span></label>
            <input type="text" name="feducationattainment" />
          </div>
        </div>

        <hr className="separator" />

        <h4>Mother</h4>
        <div className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>Mother First Name <span className="required">*</span></label>
            <input type="text" name="motherFirstName" required />
          </div>
          <div className="form-group-fb-parents">
            <label>Mother Last Name <span className="required">*</span></label>
            <input type="text" name="motherLastName" required />
          </div>
          <div className="form-group-fb">
            <label>Mother Middle Name</label>
            <input type="text" name="motherMiddleName" placeholder="If none, leave it blank" />
          </div>
          <div className="form-group-fb-fb">
            <label>Age <span className="required">*</span></label>
            <input type="number" name="mage" />
          </div>
        </div>

        <div className="form-row-fb">
          <div className="form-group-fb">
            <label>Occupation <span className="required">*</span></label>
            <input type="text" name="moccupation" required />
          </div>
          <div className="form-group-fb">
            <label>Phone Number <span className="required">*</span></label>
            <input type="text" name="mphonenumber" required />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment <span className="required">*</span></label>
            <input type="text" name="meducationattainment" />
          </div>
        </div>

        <hr className="separator" />

        <h4>Guardian</h4>
        <div className="form-row-fb">
          <div className="form-group-fb-parents">
            <label>Guardian First Name <span className="required">*</span></label>
            <input type="text" name="guardianFirstName" required />
          </div>
          <div className="form-group-fb-parents">
            <label>Guardian Last Name <span className="required">*</span></label>
            <input type="text" name="guardianLastName" required />
          </div>
          <div className="form-group-fb">
            <label>Guardian Middle Name</label>
            <input type="text" name="guardianMiddleName" placeholder="If none, leave it blank" />
          </div>
          <div className="form-group-fb-fb">
            <label>Age <span className="required">*</span></label>
            <input type="number" name="gage" />
          </div>
        </div>
        
        <div className="form-row-fb">
          <div className="form-group-fb">
            <label>Occupation <span className="required">*</span></label>
            <input type="text" name="goccupation" required />
          </div>
          <div className="form-group-fb">
            <label>Phone Number <span className="required">*</span></label>
            <input type="text" name="gphonenumber" required />
          </div>
          <div className="form-group-fb">
            <label>Educational Attainment <span className="required">*</span></label>
            <input type="text" name="geducationattainment" />
          </div>
        </div>
        
        <hr className="separator" />

        <h4>Siblings (Eldest to Youngest)</h4>
        {siblings.map((sibling, index) => (
          <div key={index} className="form-row-fb">
            <div className="form-group-fb-parents">
              <label>First Name</label>
              <input type="text" value={sibling.firstName} readOnly />
            </div>
            <div className="form-group-fb-parents">
              <label>Last Name</label>
              <input type="text" value={sibling.lastName} readOnly />
            </div>
            <div className="form-group-fb">
              <label>Middle Name</label>
              <input type="text" value={sibling.middleName} readOnly />
            </div>
            <div className="form-group-fb-fb">
              <label>Age</label>
              <input type="number" value={sibling.age} readOnly />
            </div>
            <div className="form-row-fb">
              <div className="form-group-fb-sibling">
                <label>Occupation</label>
                <input type="text" value={sibling.occupation} readOnly />
              </div>
              <div className="form-group-fb-sibling">
                <label>Phone Number</label>
                <input type="number" value={sibling.phoneNumber} readOnly />
              </div>
              <div className="form-group-fb-sibling">
                <label>Educational Attainment</label>
                <input type="text" value={sibling.educationAttainment} readOnly />
              </div>
            </div>
          </div>
        ))}

        {/* Add Sibling Button */}
        <button type="button" className="add-sibling-button-fb" onClick={openModal}>
          + Add Sibling
        </button>

        {/* Modal for Adding New Sibling */}
        {isModalOpen && (
          <div className="modal-fb">
            <div className="modal-content-fb">
              <h3>Add Sibling</h3>
              <input type="text" name="firstName" placeholder="First Name" onChange={handleInputChange} value={newSibling.firstName} />
              <input type="text" name="lastName" placeholder="Last Name" onChange={handleInputChange} value={newSibling.lastName} />
              <input type="text" name="middleName" placeholder="Middle Name" onChange={handleInputChange} value={newSibling.middleName} />
              <input type="number" name="age" placeholder="Age" onChange={handleInputChange} value={newSibling.age} />
              <input type="text" name="occupation" placeholder="Occupation" onChange={handleInputChange} value={newSibling.occupation} />
              <input type="text" name="phoneNumber" placeholder="Phone Number" onChange={handleInputChange} value={newSibling.phoneNumber} />
              <input type="text" name="educationAttainment" placeholder="Educational Attainment" onChange={handleInputChange} value={newSibling.educationAttainment} />
              
              <button className="add-modal-button" onClick={addSibling}>Add</button>
              <button className="cancel-button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="button-container">
          <button type="button" className="previous-button-fb" onClick={handlePrevious}>
            Previous
          </button>
          <button type="submit" className="next-button-fb">Next</button>
        </div>
      </form>
    </div>
  );
};

export default FamilyBackground;
