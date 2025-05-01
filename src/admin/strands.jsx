import React, { useState, useEffect, useRef } from "react";
import "./strands.css";
import { FaEdit, FaTrash, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Strands = () => {
  const [strands, setStrands] = useState([]);
  const [filteredStrands, setFilteredStrands] = useState([]);  // State for filtered strands
  const [searchTerm, setSearchTerm] = useState("");  // State for search input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState(""); // "pdf" or "excel"
  const [gradeFilter, setGradeFilter] = useState("all"); // Default to show all grades
  const tableRef = useRef(null);
  
  const [currentStrand, setCurrentStrand] = useState({
    strand_id: "",
    strand: "",
    description: "",
    section: "",
    start: "",
    end: "",
    curriculum: "",
    grade: "", // Grade property
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    const fetchStrands = async () => {
      try {
        const response = await fetch(`${baseUrl}/strands.php`);
        const data = await response.json();
        setStrands(data);
        setFilteredStrands(data); // Initially, all strands are displayed
      } catch (error) {
        console.error("Error fetching strands:", error);
      }
    };

    fetchStrands();
  }, []);

  // Apply filters when grade filter or search term changes
  useEffect(() => {
    let filtered = strands;
    
    // Apply grade filter
    if (gradeFilter !== "all") {
      const gradeValue = parseInt(gradeFilter);
      filtered = filtered.filter(strand => parseInt(strand.grade) === gradeValue);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((strand) => {
        return (
          strand.strand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strand.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strand.section.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    setFilteredStrands(filtered);
  }, [strands, gradeFilter, searchTerm]);

  // Function to handle search term change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Function to handle grade filter change
  const handleGradeFilterChange = (e) => {
    setGradeFilter(e.target.value);
  };

  const handleAddClick = () => {
    setCurrentStrand({
      strand_id: "",
      strand: "",
      description: "",
      section: "",
      start: "",
      end: "",
      curriculum: "",
      grade: "", // Reset grade
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (strand) => {
    setCurrentStrand(strand);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this strand?");
    if (confirmDelete) {
      const response = await fetch("http://localhost:8000/strands.php", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ strand_id: id }),
      });

      const data = await response.json();
      if (data.success) {
        setStrands(strands.filter((strand) => strand.strand_id !== id));
        setFilteredStrands(filteredStrands.filter((strand) => strand.strand_id !== id));
      } else {
        alert("Error deleting strand");
      }
    }
  };

  const handleSave = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (currentStrand.strand_id) {
      const response = await fetch("http://localhost:8000/strands.php", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentStrand),
      });

      const data = await response.json();
      if (data.success) {
        setStrands(
          strands.map((strand) =>
            strand.strand_id === currentStrand.strand_id ? currentStrand : strand
          )
        );
        setFilteredStrands(
          filteredStrands.map((strand) =>
            strand.strand_id === currentStrand.strand_id ? currentStrand : strand
          )
        );
      } else {
        alert("Error updating strand");
      }
    } else {
      const response = await fetch("http://localhost:8000/strands.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentStrand),
      });

      const data = await response.json();
      if (data.success) {
        setStrands([...strands, { ...currentStrand, strand_id: strands.length + 1 }]);
        setFilteredStrands([...filteredStrands, { ...currentStrand, strand_id: strands.length + 1 }]);
      } else {
        alert("Error adding strand");
      }
    }
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
    setIsPdfModalOpen(false);
    setIsExportModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentStrand({ ...currentStrand, [name]: value });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setCurrentStrand({ ...currentStrand, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!currentStrand.strand) errors.strand = "Strand name is required";
    if (!currentStrand.description) errors.description = "Description is required";
    if (!currentStrand.section) errors.section = "Section is required";
    if (!currentStrand.start) errors.start = "Start date is required";
    if (!currentStrand.end) errors.end = "End date is required";
    if (!currentStrand.curriculum) errors.curriculum = "Curriculum is required";
    if (!currentStrand.grade) errors.grade = "Grade is required"; // Validate grade
    return errors;
  };

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
    doc.text("Strands List", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Define the table structure
    const tableColumn = ["Strands", "Description", "Section", "Grade", "Start", "End", "Curriculum"];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredStrands.forEach(strand => {
      const strandData = [
        strand.strand,
        strand.description,
        strand.section,
        strand.grade,
        strand.start,
        strand.end,
        strand.curriculum
      ];
      tableRows.push(strandData);
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
    });

    doc.save("strands.pdf");
    setIsExportModalOpen(false);
  };

  // Function to export to Excel
  const exportToExcel = () => {
    // Prepare data for Excel export
    const worksheet = XLSX.utils.json_to_sheet(
      filteredStrands.map(strand => ({
        STRAND: strand.strand,
        DESCRIPTION: strand.description,
        SECTION: strand.section,
        "GRADE LEVEL": strand.grade,
        "START DATE": strand.start,
        "END DATE": strand.end,
        CURRICULUM: strand.curriculum
      }))
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Strands");

    // Generate Excel file and save
    XLSX.writeFile(workbook, "strands.xlsx");
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
    <div className="strands-container-str">
      <div className="strands-header-str">
        <h2 className="strands-title-str">STRANDS</h2>
      </div>
      <div className="top-controls-strands-str">
        <div className="search-and-add-strands-str">
          <input
            type="text"
            className="search-input-strands-str"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="strands-filter-str"
            value={gradeFilter}
            onChange={handleGradeFilterChange}
          >
            <option value="all">All Grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
          <button className="add-button-strands-str" onClick={handleAddClick}>
            Add
          </button>
          <button className="strands-pdf-button-str" onClick={handlePdfClick}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="strands-excel-button-str" onClick={handleExcelClick}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
        </div>
      </div>
      <div className="strands-table-container-str" ref={tableRef}>
        <table className="strands-table-str">
          <thead>
            <tr>
              <th>Strands</th>
              <th>Description</th>
              <th>Section</th>
              <th>Grade</th>
              <th>Start</th>
              <th>End</th>
              <th>Curriculum</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrands.map((strand) => (
              <tr key={strand.strand_id}>
                <td>{strand.strand}</td>
                <td>{strand.description}</td>
                <td>{strand.section}</td>
                <td>{strand.grade}</td>
                <td>{strand.start}</td>
                <td>{strand.end}</td>
                <td>{strand.curriculum}</td>
                <td>
                  <FaEdit
                    className="strands-edit-icon-str"
                    onClick={() => handleEditClick(strand)}
                    style={{ cursor: "pointer", color: "#006400" }}
                  />
                </td>
                <td>
                  <FaTrash
                    className="strands-delete-icon-str"
                    onClick={() => handleDeleteClick(strand.strand_id)}
                    style={{ cursor: "pointer", color: "#B22222" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-modal-content-stra">
            <h3 className="strands-modal-title-stra">
              {currentStrand.strand_id ? "EDIT STRAND" : "ADD STRAND"}
            </h3>
            <div className="strands-modal-form-stra">
              <div className="strands-form-group-stra">
                <label>
                  Strand Name
                  <input
                    type="text"
                    name="strand"
                    value={currentStrand.strand}
                    onChange={handleInputChange}
                    style={formErrors.strand ? { borderColor: "red" } : {}}
                  />
                  {formErrors.strand && <span>{formErrors.strand}</span>}
                </label>
                <label>
                  Description
                  <input
                    type="text"
                    name="description"
                    value={currentStrand.description}
                    onChange={handleInputChange}
                    style={formErrors.description ? { borderColor: "red" } : {}}
                  />
                  {formErrors.description && <span>{formErrors.description}</span>}
                </label>
                <label>
                  Grade
                  <select
                    name="grade"
                    value={currentStrand.grade}
                    onChange={handleInputChange}
                    style={formErrors.grade ? { borderColor: "red" } : {}}
                  >
                    <option value="">Select Grade</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                  {formErrors.grade && <span>{formErrors.grade}</span>}
                </label>
                <label>
                  Section
                  <input
                    type="text"
                    name="section"
                    value={currentStrand.section}
                    onChange={handleInputChange}
                    style={formErrors.section ? { borderColor: "red" } : {}}
                  />
                  {formErrors.section && <span>{formErrors.section}</span>}
                </label>
                <label>
                  Start Date
                  <input
                    type="date"
                    name="start"
                    value={currentStrand.start}
                    onChange={handleDateChange}
                    style={formErrors.start ? { borderColor: "red" } : {}}
                  />
                  {formErrors.start && <span>{formErrors.start}</span>}
                </label>
                <label>
                  End Date
                  <input
                    type="date"
                    name="end"
                    value={currentStrand.end}
                    onChange={handleDateChange}
                    style={formErrors.end ? { borderColor: "red" } : {}}
                  />
                  {formErrors.end && <span>{formErrors.end}</span>}
                </label>
                <label>
                  Curriculum
                  <input
                    type="text"
                    name="curriculum"
                    value={currentStrand.curriculum}
                    onChange={handleInputChange}
                    style={formErrors.curriculum ? { borderColor: "red" } : {}}
                  />
                  {formErrors.curriculum && <span>{formErrors.curriculum}</span>}
                </label>
              </div>
            </div>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleSave}>
                Save
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-export-modal-content-stra">
            <h3 className="strands-modal-title-stra">Save Confirmation</h3>
            <p className="strands-export-message-stra">
              Are you sure you want to save these changes?
            </p>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleConfirmSave}>
                Confirm
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-export-modal-content-stra">
            <h3 className="strands-modal-title-stra">Export Confirmation</h3>
            <p className="strands-export-message-stra">
              Are you sure you want to export the current strands list to {exportType === "pdf" ? "PDF" : "Excel"}?
            </p>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleConfirmExport}>
                Export
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCloseExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Strands;