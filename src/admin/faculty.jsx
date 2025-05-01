import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./faculty.css";
import { FaEdit, FaTrash, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Faculty = () => {
  const [facultyList, setFaculty] = useState([]);
  const [strandsList, setStrandsList] = useState([]); // State to store strands data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState(""); // "pdf" or "excel"
  const tableRef = useRef(null);
  
  const [currentFaculty, setCurrentFaculty] = useState({
    facultyName: "",
    email: "",
    contactNum: "",
    strand: "", // Default to empty, will be populated from strandsList
    facultyStatus: "Employed",
  });

  const [generalError, setGeneralError] = useState(""); // State for general error message

  // State to manage form validation errors
  const [formErrors, setFormErrors] = useState({
    facultyName: false,
    email: false,
    contactNum: false,
    strand: false,
  });

  const [searchTerm, setSearchTerm] = useState(""); // State for the search term


  // Fetch faculty data and strands data from the backend
  useEffect(() => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://mediumaquamarine-dunlin-251088.hostingersite.com"
        : "http://192.168.1.10:8000"; // Adjust IP for mobile access

    // Fetch faculty data
    axios
      .get(`${baseUrl}/faculty.php?type=faculty`)
      .then((response) => {
        setFaculty(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the faculty data!", error);
      });

    // Fetch strands data
    axios
      .get(`${baseUrl}/faculty.php?type=strands`)
      .then((response) => {
        // Filter out duplicates from strandsList
        const uniqueStrands = [...new Set(response.data)];
        setStrandsList(uniqueStrands); // Store fetched unique strands data
      })
      .catch((error) => {
        console.error("There was an error fetching the strands data!", error);
      });
}, []);

  const handleEditClick = (faculty) => {
    setCurrentFaculty(faculty);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setCurrentFaculty({
      facultyName: "",
      email: "",
      contactNum: "",
      strand: "", // Ensure it starts empty for a new entry
      facultyStatus: "Employed",
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    axios
      .delete("http://mediumaquamarine-dunlin-251088.hostingersite.com/faculty.php", { data: { faculty_id: id } })
      .then(() => {
        setFaculty(facultyList.filter((faculty) => faculty.faculty_id !== id));
      })
      .catch((error) => {
        console.error("There was an error deleting the faculty!", error);
      });
  };

  const handleSave = () => {
    // Validate facultyName (only letters and spaces)
    const isInvalidFacultyName = /[^a-zA-Z\s]/.test(currentFaculty.facultyName);
  
    // Validate email (must include @gmail.com but not be exactly @gmail.com)
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    const isInvalidEmail = !emailRegex.test(currentFaculty.email) || currentFaculty.email.trim() === "@gmail.com";
  
    // Validate contact number (must start with 09 and have exactly 11 digits)
    const contactRegex = /^09\d{9}$/;
    const isInvalidContactNum = !contactRegex.test(currentFaculty.contactNum);
  
    let errors = {
      facultyName: currentFaculty.facultyName.trim() === "" || isInvalidFacultyName,
      email: currentFaculty.email.trim() === "" || isInvalidEmail,
      contactNum: currentFaculty.contactNum.trim() === "" || isInvalidContactNum,
      strand: currentFaculty.strand.trim() === "",
    };
  
    setFormErrors(errors);
  
    // Display error messages if validation fails
    if (isInvalidFacultyName) {
      setGeneralError("Faculty Name must contain only letters and spaces.");
      return;
    }
  
    if (isInvalidEmail) {
      setGeneralError("Email must be a valid Gmail address (e.g., example@gmail.com).");
      return;
    }
  
    if (isInvalidContactNum) {
      setGeneralError("Contact Number must start with 09 and contain exactly 11 digits.");
      return;
    }
  
    // If any field is empty, prevent saving
    if (Object.values(errors).includes(true)) {
      setGeneralError("Please input all the fields.");
      return;
    }
  
    setGeneralError(""); // Clear general error message if all fields are valid
  
    const requestData = {
      facultyName: currentFaculty.facultyName,
      email: currentFaculty.email,
      contactNum: currentFaculty.contactNum,
      strand: currentFaculty.strand,
      facultyStatus: currentFaculty.facultyStatus,
    };
  
    if (isEditMode) {
      requestData.faculty_id = currentFaculty.faculty_id;
      axios
        .put("http://mediumaquamarine-dunlin-251088.hostingersite.com/faculty.php", requestData)
        .then(() => {
          setFaculty(
            facultyList.map((faculty) =>
              faculty.faculty_id === currentFaculty.faculty_id ? currentFaculty : faculty
            )
          );
        })
        .catch((error) => {
          console.error("There was an error updating the faculty!", error);
        });
    } else {
      axios
        .post("http://mediumaquamarine-dunlin-251088.hostingersite.com/faculty.php", requestData)
        .then((response) => {
          if (response.data.success) {
            alert("Faculty added successfully along with related data!");
            setFaculty([...facultyList, { ...currentFaculty, faculty_id: facultyList.length + 1 }]);
          } else {
            alert(response.data.message);
          }
        })
        .catch((error) => {
          console.error("There was an error adding the faculty!", error);
        });
    }
  
    setIsModalOpen(false);
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setIsExportModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "facultyName") {
      // Allow only letters and spaces
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, ""); // Remove invalid characters
      setCurrentFaculty({ ...currentFaculty, [name]: sanitizedValue });
    } else {
      setCurrentFaculty({ ...currentFaculty, [name]: value });
    }
  };
  
  // Filter facultyList based on the search term
  const filteredFaculty = facultyList.filter((faculty) =>
    faculty.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.strand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to handle PDF button click
  const handlePdfClick = () => {
    setExportType("pdf");
    setIsExportModalOpen(true);
  };

  // Function to handle Excel button click
  const handleExcelClick = () => {
    setExportType("excel");
    setIsExportModalOpen(true);
  };

  // Function to export to PDF
  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Faculty List", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Define the table structure
    const tableColumn = ["Faculty Name", "Email", "Contact No.", "Department", "Status"];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredFaculty.forEach(faculty => {
      const facultyData = [
        faculty.facultyName,
        faculty.email,
        faculty.contactNum,
        faculty.strand,
        faculty.facultyStatus
      ];
      tableRows.push(facultyData);
    });
    
    // Create the table with green header color
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 100, 0], // Dark green header
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      // Style for status column (last column)
      columnStyles: {
        4: {
          // Apply conditional text color to the 5th column (index 4)
          fontStyle: (data) => {
            return data === "Employed" ? "normal" : "italic";
          },
          textColor: (data) => {
            return data === "Employed" ? [0, 100, 0] : [200, 0, 0]; // Green for employed, red for retired
          }
        }
      },
    });

    doc.save("faculty.pdf");
    setIsExportModalOpen(false);
  };

  // Function to export to Excel
  const exportToExcel = () => {
    // Prepare data for Excel export
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFaculty.map(faculty => ({
        "FACULTY NAME": faculty.facultyName,
        "EMAIL": faculty.email,
        "CONTACT NO.": faculty.contactNum,
        "DEPARTMENT": faculty.strand,
        "FACULTY STATUS": faculty.facultyStatus
      }))
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty");

    // Generate Excel file and save
    XLSX.writeFile(workbook, "faculty.xlsx");
    setIsExportModalOpen(false);
  };

  // Close the export confirmation modal
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };

  // Process export based on selected type
  const handleConfirmExport = () => {
    if (exportType === "pdf") {
      exportToPdf();
    } else if (exportType === "excel") {
      exportToExcel();
    }
  };

  return (
    <div className="admin-faculty-container-fac">
      <div className="admin-faculty-header-fac">
        <h2 className="admin-faculty-title-fac">Faculty</h2>
        <div className="admin-faculty-total-fac">
          <span className="admin-faculty-name-total-fac">Total :</span>
          <span className="admin-faculty-count-total-fac">{facultyList.length}</span>
        </div>
      </div>

      <div className="admin-faculty-top-controls-fac">
        <div className="admin-faculty-search-bar-fac">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="admin-faculty-add-button-fac" onClick={handleAddClick}>
            Add
          </button>
          <button className="admin-faculty-pdf-button-fac" onClick={handlePdfClick}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="admin-faculty-excel-button-fac" onClick={handleExcelClick}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
        </div>
      </div>
      <div className="admin-faculty-table-container-fac" ref={tableRef}>
        <table className="admin-faculty-table-fac">
          <thead>
            <tr>
              <th>FACULTY NAME</th>
              <th>EMAIL</th>
              <th>CONTACT NO.</th>
              <th>DEPARTMENT</th>
              <th>FACULTY STATUS</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map((faculty) => (
              <tr key={faculty.faculty_id}>
                <td>{faculty.facultyName}</td>
                <td>{faculty.email}</td>
                <td>{faculty.contactNum}</td>
                <td>{faculty.strand}</td>
                <td
                  style={{
                    color:
                      faculty.facultyStatus === "Employed" ? "green" : "red",
                  }}
                >
                  {faculty.facultyStatus}
                </td>
                <td>
                  <FaEdit
                    className="admin-faculty-edit-icon-fac"
                    onClick={() => handleEditClick(faculty)}
                    style={{ cursor: "pointer", color: "#006400" }}
                  />
                </td>
                <td>
                  <FaTrash
                    className="admin-delete-icon-faculty-fac"
                    onClick={() => handleDeleteClick(faculty.faculty_id)}
                    style={{ cursor: "pointer", color: "#B22222" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <div className="admin-faculty-modal-fac">
          <div className="admin-faculty-modal-content-fac">
            <h3>{isEditMode ? "Edit Faculty" : "Add Faculty"}</h3>

            {/* General Error Message */}
            {generalError && (
              <p className="admin-faculty-general-error-message-fac">{generalError}</p>
            )}

            <label>
              Faculty Name
              <input
                type="text"
                name="facultyName"
                value={currentFaculty.facultyName}
                onChange={handleInputChange}
                placeholder="Enter faculty name"
                className={formErrors.facultyName ? "error" : ""}
              />
             
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={currentFaculty.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                className={formErrors.email ? "error" : ""}
              />
            </label>
            <label>
              Contact No.
              <input
                type="text"
                name="contactNum"
                value={currentFaculty.contactNum}
                onChange={(e) => {
                  let value = e.target.value;
                  // Allow only digits and limit to 11 characters
                  value = value.replace(/\D/g, ""); // Remove non-numeric characters
                  if (value.length > 11) {
                    value = value.slice(0, 11); // Limit to 11 digits
                  }
                  setCurrentFaculty({ ...currentFaculty, contactNum: value });
                }}
                placeholder="Enter contact number"
                className={formErrors.contactNum ? "error" : ""}
              />
            </label>

            <label>
              Strand
              <select
                name="strand"
                value={currentFaculty.strand}
                onChange={handleInputChange}
                className={formErrors.strand ? "error" : ""}
              >
                <option value="">Select a Strand</option>
                {strandsList.map((strand, index) => (
                  <option key={index} value={strand}>
                    {strand}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Faculty Status
              <select
                name="facultyStatus"
                value={currentFaculty.facultyStatus}
                onChange={handleInputChange}
              >
                <option value="Employed">Employed</option>
                <option value="Retired">Retired</option>
              </select>
            </label>

            <div className="admin-fac-btn-group">
              <button className="admin-faculty-save-button-fac" onClick={handleSave}>
                Save
              </button>
              <button className="admin-faculty-cancel-button-fac" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="admin-faculty-modal-fac">
          <div className="admin-faculty-modal-content-fac">
            <h3>Export Confirmation</h3>
            <p className="admin-faculty-export-message-fac">
              Are you sure you want to export the current faculty list to {exportType === "pdf" ? "PDF" : "Excel"}?
            </p>
            <div className="admin-fac-btn-group">
              <button className="admin-faculty-save-button-fac" onClick={handleConfirmExport}>
                Export
              </button>
              <button className="admin-faculty-cancel-button-fac" onClick={handleCloseExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;