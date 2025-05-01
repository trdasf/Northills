import './personalinfo.css';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Make sure to install axios

const PersonalInfoForm = () => {
  const navigate = useNavigate();
  const hiddenFileInput = useRef(null);

  // Individual state variables for each field
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [extensionName, setExtensionName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthdayPlace, setBirthdayPlace] = useState('');
  const [age, setAge] = useState('');
  
  const [civilStatus, setCivilStatus] = useState('Single');
  const [religion, setReligion] = useState('');
  const [citizenship, setCitizenship] = useState('');
  const [sex, setSex] = useState('female');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fbidlink, setFbidlink] = useState('');

  // Address states
  const [presentHouseStreetPurok, setPresentHouseStreetPurok] = useState('');
  const [presentBarangay, setPresentBarangay] = useState('');
  const [presentMunicipality, setPresentMunicipality] = useState('');
  const [presentProvince, setPresentProvince] = useState('');
  const [presentZipcode, setPresentZipcode] = useState('');

  const [permanentHouseStreetPurok, setPermanentHouseStreetPurok] = useState('');
  const [permanentBarangay, setPermanentBarangay] = useState('');
  const [permanentMunicipality, setPermanentMunicipality] = useState('');
  const [permanentProvince, setPermanentProvince] = useState('');
  const [permanentZipcode, setPermanentZipcode] = useState('');

  // Track which field is currently focused
  const [focusedField, setFocusedField] = useState(null);
  
  // Suggestions for dropdowns
  const [presentSuggestions, setPresentSuggestions] = useState({
    barangay: [],
    municipality: [],
    province: []
  });
  
  const [permanentSuggestions, setPermanentSuggestions] = useState({
    barangay: [],
    municipality: [],
    province: []
  });
  
  // State for location data
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add state for the checkbox
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [image, setImage] = useState(null);

  // Fetch location data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Determine the base URL based on environment
        const baseUrl = window.location.hostname === "localhost"
          ? "http://localhost:8000"
          : "http://192.168.1.10:8000"; // Adjust for your server IP
        
        const response = await axios.get(`${baseUrl}/get_locations.php`);
        if (response.data.success) {
          setLocationData(response.data.locations);
        } else {
          console.error("Failed to fetch locations:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Effect to update permanent address when checkbox is toggled
  useEffect(() => {
    if (sameAsPresent) {
      setPermanentHouseStreetPurok(presentHouseStreetPurok);
      setPermanentBarangay(presentBarangay);
      setPermanentMunicipality(presentMunicipality);
      setPermanentProvince(presentProvince);
      setPermanentZipcode(presentZipcode);
    }
  }, [
    sameAsPresent, 
    presentHouseStreetPurok, 
    presentBarangay, 
    presentMunicipality, 
    presentProvince, 
    presentZipcode
  ]);

  // Handle checkbox change
  const handleSameAddressChange = (e) => {
    setSameAsPresent(e.target.checked);
  };

  // Function to get all unique provinces
  const getProvinces = () => {
    if (!locationData || !locationData.length) return [];
    
    return [...new Set(locationData.map(location => location.province))].sort();
  };

  // Function to get municipalities for a specific province
  const getMunicipalitiesForProvince = (province) => {
    if (!locationData || !locationData.length) return [];
    
    return [...new Set(
      locationData
        .filter(location => location.province === province)
        .map(location => location.municipality)
    )].sort();
  };

  // Function to get barangays for a specific municipality (and optionally province)
  const getBarangaysForMunicipality = (municipality, province = null) => {
    if (!locationData || !locationData.length) return [];
    
    let filtered = locationData.filter(location => location.municipality === municipality);
    
    if (province) {
      filtered = filtered.filter(location => location.province === province);
    }
    
    return [...new Set(filtered.map(location => location.barangay))].sort();
  };

  // Function to find province for a municipality
  const getProvinceForMunicipality = (municipality) => {
    if (!locationData || !locationData.length) return null;
    
    const municipalityData = locationData.find(location => location.municipality === municipality);
    return municipalityData ? municipalityData.province : null;
  };

  // Filter functions for search
  const filterMunicipalities = (input) => {
    const inputLower = input.toLowerCase();
    return [...new Set(locationData.map(loc => loc.municipality))]
      .filter(municipality => municipality.toLowerCase().includes(inputLower))
      .sort();
  };

  const filterProvinces = (input) => {
    const inputLower = input.toLowerCase();
    return [...new Set(locationData.map(loc => loc.province))]
      .filter(province => province.toLowerCase().includes(inputLower))
      .sort();
  };

  const filterBarangays = (input, municipality = null) => {
    const inputLower = input.toLowerCase();
    
    if (municipality) {
      return getBarangaysForMunicipality(municipality)
        .filter(barangay => barangay.toLowerCase().includes(inputLower));
    }
    
    return [...new Set(locationData.map(loc => loc.barangay))]
      .filter(barangay => barangay.toLowerCase().includes(inputLower))
      .sort();
  };

  // Handle input changes
  const handlePresentBarangayChange = (e) => {
    const value = e.target.value;
    setPresentBarangay(value);
    
    // Only update suggestions if this field is focused
    if (focusedField === 'present-barangay') {
      // Filter barangay suggestions based on municipality if available
      if (presentMunicipality) {
        setPresentSuggestions({
          ...presentSuggestions,
          barangay: filterBarangays(value, presentMunicipality)
        });
      } else {
        setPresentSuggestions({
          ...presentSuggestions,
          barangay: filterBarangays(value)
        });
      }
    }
  };

  const handlePresentMunicipalityChange = (e) => {
    const value = e.target.value;
    setPresentMunicipality(value);
    
    // Only update suggestions if this field is focused
    if (focusedField === 'present-municipality') {
      // Update municipality suggestions
      setPresentSuggestions({
        ...presentSuggestions,
        municipality: filterMunicipalities(value)
      });
    }
    
    // Find and set province automatically
    const province = getProvinceForMunicipality(value);
    if (province) {
      setPresentProvince(province);
    }
    
    // Clear barangay when municipality changes
    setPresentBarangay('');
  };

  const handlePresentProvinceChange = (e) => {
    const value = e.target.value;
    setPresentProvince(value);
    
    // Only update suggestions if this field is focused
    if (focusedField === 'present-province') {
      // Update province suggestions
      setPresentSuggestions({
        ...presentSuggestions,
        province: filterProvinces(value)
      });
    }
    
    // Clear municipality and barangay when province changes
    setPresentMunicipality('');
    setPresentBarangay('');
  };

  const handlePermanentBarangayChange = (e) => {
    const value = e.target.value;
    setPermanentBarangay(value);
    
    // Only update suggestions if this field is focused
    if (focusedField === 'permanent-barangay') {
      // Filter barangay suggestions based on municipality if available
      if (permanentMunicipality) {
        setPermanentSuggestions({
          ...permanentSuggestions,
          barangay: filterBarangays(value, permanentMunicipality)
        });
      } else {
        setPermanentSuggestions({
          ...permanentSuggestions,
          barangay: filterBarangays(value)
        });
      }
    }
  };

  const handlePermanentMunicipalityChange = (e) => {
    const value = e.target.value;
    setPermanentMunicipality(value);
    
    // Only update suggestions if this field is focused
    if (focusedField === 'permanent-municipality') {
      // Update municipality suggestions
      setPermanentSuggestions({
        ...permanentSuggestions,
        municipality: filterMunicipalities(value)
      });
    }
    
    // Find and set province automatically
    const province = getProvinceForMunicipality(value);
    if (province) {
      setPermanentProvince(province);
    }
    
    // Clear barangay when municipality changes
    setPermanentBarangay('');
  };

  const handlePermanentProvinceChange = (e) => {
    const value = e.target.value;
    setPermanentProvince(value);
    
    // Only update suggestions if this field is focused
    if (focusedField === 'permanent-province') {
      // Update province suggestions
      setPermanentSuggestions({
        ...permanentSuggestions,
        province: filterProvinces(value)
      });
    }
    
    // Clear municipality and barangay when province changes
    setPermanentMunicipality('');
    setPermanentBarangay('');
  };

  // Handle selection from dropdowns
  const handleSelectPresentBarangay = (barangay) => {
    setPresentBarangay(barangay);
    setFocusedField(null); // Clear focus after selection
  };

  const handleSelectPresentMunicipality = (municipality) => {
    setPresentMunicipality(municipality);
    
    // Find and set the province automatically
    const province = getProvinceForMunicipality(municipality);
    if (province) {
      setPresentProvince(province);
    }
    
    // Clear previous barangay
    setPresentBarangay('');
    
    // Update barangay suggestions for this municipality
    setPresentSuggestions({
      ...presentSuggestions,
      barangay: getBarangaysForMunicipality(municipality)
    });
    
    setFocusedField(null); // Clear focus after selection
  };

  const handleSelectPresentProvince = (province) => {
    setPresentProvince(province);
    
    // Clear previous municipality and barangay
    setPresentMunicipality('');
    setPresentBarangay('');
    
    // Update municipality suggestions for this province
    setPresentSuggestions({
      ...presentSuggestions,
      municipality: getMunicipalitiesForProvince(province)
    });
    
    setFocusedField(null); // Clear focus after selection
  };

  const handleSelectPermanentBarangay = (barangay) => {
    setPermanentBarangay(barangay);
    setFocusedField(null); // Clear focus after selection
  };

  const handleSelectPermanentMunicipality = (municipality) => {
    setPermanentMunicipality(municipality);
    
    // Find and set the province automatically
    const province = getProvinceForMunicipality(municipality);
    if (province) {
      setPermanentProvince(province);
    }
    
    // Clear previous barangay
    setPermanentBarangay('');
    
    // Update barangay suggestions for this municipality
    setPermanentSuggestions({
      ...permanentSuggestions,
      barangay: getBarangaysForMunicipality(municipality)
    });
    
    setFocusedField(null); // Clear focus after selection
  };

  const handleSelectPermanentProvince = (province) => {
    setPermanentProvince(province);
    
    // Clear previous municipality and barangay
    setPermanentMunicipality('');
    setPermanentBarangay('');
    
    // Update municipality suggestions for this province
    setPermanentSuggestions({
      ...permanentSuggestions,
      municipality: getMunicipalitiesForProvince(province)
    });
    
    setFocusedField(null); // Clear focus after selection
  };

  // Focus handlers
  const handleFocus = (field) => {
    setFocusedField(field);
    
    // Update suggestions based on which field is focused
    if (field === 'present-barangay') {
      if (presentMunicipality) {
        // If municipality is selected, show barangays from that municipality
        setPresentSuggestions({
          ...presentSuggestions,
          barangay: getBarangaysForMunicipality(presentMunicipality)
        });
      } else {
        // Otherwise show filtered barangays based on current input
        setPresentSuggestions({
          ...presentSuggestions,
          barangay: filterBarangays(presentBarangay)
        });
      }
    } else if (field === 'present-municipality') {
      if (presentProvince) {
        // If province is selected, show municipalities from that province
        setPresentSuggestions({
          ...presentSuggestions,
          municipality: getMunicipalitiesForProvince(presentProvince)
        });
      } else {
        // Otherwise show filtered municipalities based on current input
        setPresentSuggestions({
          ...presentSuggestions,
          municipality: filterMunicipalities(presentMunicipality)
        });
      }
    } else if (field === 'present-province') {
      setPresentSuggestions({
        ...presentSuggestions,
        province: filterProvinces(presentProvince)
      });
    } else if (field === 'permanent-barangay') {
      if (permanentMunicipality) {
        // If municipality is selected, show barangays from that municipality
        setPermanentSuggestions({
          ...permanentSuggestions,
          barangay: getBarangaysForMunicipality(permanentMunicipality)
        });
      } else {
        // Otherwise show filtered barangays based on current input
        setPermanentSuggestions({
          ...permanentSuggestions,
          barangay: filterBarangays(permanentBarangay)
        });
      }
    } else if (field === 'permanent-municipality') {
      if (permanentProvince) {
        // If province is selected, show municipalities from that province
        setPermanentSuggestions({
          ...permanentSuggestions,
          municipality: getMunicipalitiesForProvince(permanentProvince)
        });
      } else {
        // Otherwise show filtered municipalities based on current input
        setPermanentSuggestions({
          ...permanentSuggestions,
          municipality: filterMunicipalities(permanentMunicipality)
        });
      }
    } else if (field === 'permanent-province') {
      setPermanentSuggestions({
        ...permanentSuggestions,
        province: filterProvinces(permanentProvince)
      });
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const autocompleteContainers = document.querySelectorAll('.autocomplete-container');
      let clickedOutside = true;
      
      autocompleteContainers.forEach(container => {
        if (container.contains(event.target)) {
          clickedOutside = false;
        }
      });
      
      if (clickedOutside) {
        setFocusedField(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigate to the next form and pass all individual states
  const handleNext = (event) => {
    event.preventDefault();
    navigate('/enrollment-data', {
      state: {
        firstName,
        lastName,
        middleName,
        extensionName,
        birthday,
        birthdayPlace,
        age,
        civilStatus,
        religion,
        citizenship,
        sex,
        contactNumber,
        email,
        fbidlink,
        presentAddress: {
          houseStreetPurok: presentHouseStreetPurok,
          barangay: presentBarangay,
          municipality: presentMunicipality,
          province: presentProvince,
          zipcode: presentZipcode,
        },
        permanentAddress: {
          houseStreetPurok: permanentHouseStreetPurok,
          barangay: permanentBarangay,
          municipality: permanentMunicipality,
          province: permanentProvince,
          zipcode: permanentZipcode,
        },
        image
      }
    });
  };

  // Handle image upload and processing
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);
  };

  // Trigger hidden file input for image selection
  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  return (
    <div className="personal-info-form-1">
      <h2>Personal Information</h2>
      <form onSubmit={handleNext}>
        {/* Name Section */}
        <div className="form-row">
          <div className="form-group">
            <label>First Name <span className="required">*</span></label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Last Name <span className="required">*</span></label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Middle Name</label>
            <input type="text" value={middleName} placeholder="If none, leave it blank" onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Extension Name</label>
            <input type="text" value={extensionName} placeholder="If none, leave it blank" onChange={(e) => setExtensionName(e.target.value)} />
          </div>
        </div>

        {/* Age, Birthday, Religion, and Civil Status Section */}
        <div className="form-row">
          <div className="form-group-pi">
            <label>Birthday <span className="required">*</span></label>
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required />
          </div>
          <div className="form-group-bp">
            <label>Birthday Place <span className="required">*</span></label>
            <input type="text" value={birthdayPlace} onChange={(e) => setBirthdayPlace(e.target.value)} required />
          </div>
          <div className="form-group-pis">
            <label>Age <span className="required">*</span></label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="form-row">
          <div className="form-group-cs">
            <label>Civil Status <span className="required">*</span></label>
            <select value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)} required>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div className="form-group-css">
            <label>Religion <span className="required">*</span></label>
            <input type="text" value={religion} onChange={(e) => setReligion(e.target.value)} required />
          </div>
          <div className="form-group-css">
            <label>Citizenship <span className="required">*</span></label>
            <input type="text" value={citizenship} onChange={(e) => setCitizenship(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Sex <span className="required">*</span></label>
            <select value={sex} onChange={(e) => setSex(e.target.value)} required>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-row">
          <div className="form-group">
            <label>Contact Number <span className="required">*</span></label>
            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        {/* Present Address Section */}
        <h4>Present Address</h4>
        <div className="form-row">
          <div className="form-group-p">
            <label>House No./Street/Purok <span className="required">*</span></label>
            <input 
              type="text" 
              value={presentHouseStreetPurok} 
              onChange={(e) => setPresentHouseStreetPurok(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Barangay <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={presentBarangay} 
                onChange={handlePresentBarangayChange}
                onFocus={() => handleFocus('present-barangay')}
                placeholder="Type to search"
                required 
              />
              {focusedField === 'present-barangay' && presentSuggestions.barangay.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.barangay.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectPresentBarangay(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Municipality <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={presentMunicipality} 
                onChange={handlePresentMunicipalityChange}
                onFocus={() => handleFocus('present-municipality')}
                placeholder="Type to search"
                required 
              />
              {focusedField === 'present-municipality' && presentSuggestions.municipality.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.municipality.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectPresentMunicipality(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={presentProvince} 
                onChange={handlePresentProvinceChange}
                onFocus={() => handleFocus('present-province')}
                placeholder="Type to search"
                required 
              />
              {focusedField === 'present-province' && presentSuggestions.province.length > 0 && (
                <ul className="suggestions-list">
                  {presentSuggestions.province.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectPresentProvince(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Zip Code <span className="required">*</span></label>
            <input 
              type="number" 
              value={presentZipcode} 
              onChange={(e) => setPresentZipcode(e.target.value)} 
              required 
            />
          </div>
        </div>

        {/* Checkbox for same address */}
        <div className="form-row checkbox-row">
          <div className="form-group checkbox-container">
            <input 
              type="checkbox" 
              id="sameAddress" 
              checked={sameAsPresent} 
              onChange={handleSameAddressChange} 
              className="same-address-checkbox"
            />
            <label htmlFor="sameAddress" className="checkbox-label">
              Same as Present Address
            </label>
          </div>
        </div>

        {/* Permanent Address Section */}
        <h4>Permanent Address</h4>
        <div className="form-row">
          <div className="form-group-p">
            <label>House No./Street/Purok <span className="required">*</span></label>
            <input 
              type="text" 
              value={permanentHouseStreetPurok} 
              onChange={(e) => setPermanentHouseStreetPurok(e.target.value)} 
              required 
              disabled={sameAsPresent}
            />
          </div>
          <div className="form-group">
            <label>Barangay <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={permanentBarangay} 
                onChange={handlePermanentBarangayChange}
                onFocus={() => !sameAsPresent && handleFocus('permanent-barangay')}
                placeholder="Type to search"
                required 
                disabled={sameAsPresent}
              />
              {!sameAsPresent && focusedField === 'permanent-barangay' && permanentSuggestions.barangay.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.barangay.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectPermanentBarangay(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Municipality <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={permanentMunicipality} 
                onChange={handlePermanentMunicipalityChange}
                onFocus={() => !sameAsPresent && handleFocus('permanent-municipality')}
                placeholder="Type to search"
                required 
                disabled={sameAsPresent}
              />
              {!sameAsPresent && focusedField === 'permanent-municipality' && permanentSuggestions.municipality.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.municipality.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectPermanentMunicipality(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Province <span className="required">*</span></label>
            <div className="autocomplete-container">
              <input 
                type="text" 
                value={permanentProvince} 
                onChange={handlePermanentProvinceChange}
                onFocus={() => !sameAsPresent && handleFocus('permanent-province')}
                placeholder="Type to search"
                required 
                disabled={sameAsPresent}
              />
              {!sameAsPresent && focusedField === 'permanent-province' && permanentSuggestions.province.length > 0 && (
                <ul className="suggestions-list">
                  {permanentSuggestions.province.map((suggestion, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectPermanentProvince(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Zip Code <span className="required">*</span></label>
            <input 
              type="number" 
              value={permanentZipcode} 
              onChange={(e) => setPermanentZipcode(e.target.value)} 
              required 
              disabled={sameAsPresent}
            />
          </div>
        </div>

        {/* Profile Picture Upload */}
        <h4>Profile Picture</h4>
        <h5>Upload Recent 2 x 2 Picture</h5>
        <div className="form-group">
          <div className="image-upload-container">
            <div className="box-decoration" onClick={handleClick} style={{ cursor: "pointer" }}>
              {image ? (
                <img src={URL.createObjectURL(image)} alt="upload image" className="img-display-after" />
              ) : (
                <img src="./src/assets/photo.png" alt="upload image" className="img-display-before" />
              )}
              <label htmlFor="image-upload-input" className="image-upload-label">
                {image ? image.name : "Choose an Image"}
              </label>
              <input
                id="image-upload-input"
                type="file"
                onChange={handleImageChange}
                ref={hiddenFileInput}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </div>
        <h5>Please upload a recent 2x2 ID photo with <span className="b">white background, Full Name (Last Name, First Name, MI)</span>.</h5>
        <h5>No side views, no selfies to avoid errors in validation process.</h5>

       
        <button type="submit" className="next-button-pi">Next →</button>
      </form>
    </div>
  );
};

export default PersonalInfoForm;