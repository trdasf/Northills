import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx"; // Import library to handle Excel export
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import "./fgrades.css";

const FGrades = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve subject and faculty details from location state
  const {
    faculty_id,
    subject_id,
    description,
    semester,
    section,
    strand,
    grade_level,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]); // For search filtering
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // Modal for export confirmation
  const [updateMode, setUpdateMode] = useState(false); // Determines whether to update existing grades
  const [searchQuery, setSearchQuery] = useState(""); // For search input
  const [exportType, setExportType] = useState(null); // To track which export type was selected

  // Fetch students from `studentlist.php`
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/studentlist.php?subject_id=${subject_id}&section=${section}&strand_track=${strand}&grade_level=${grade_level}&status=APPROVE`
        );
        const data = await response.json();

        if (data.success) {
          setStudents(data.students);
          setFilteredStudents(data.students); // Initialize filtered list
        } else {
          setError(data.message || "Failed to fetch students.");
        }
      } catch (err) {
        setError("Failed to fetch students. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [subject_id, section, strand, grade_level]);

  // Fetch grades from `fetch_grades.php`
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/fetch_grades.php?subject_id=${subject_id}`
        );
        const data = await response.json();

        if (data.success && data.grades.length > 0) {
          const gradesMap = {};
          data.grades.forEach((grade) => {
            gradesMap[grade.student_id] = {
              first_quarter: grade.first_quarter,
              second_quarter: grade.second_quarter,
              final_grade: grade.final_grade,
              remarks: grade.remarks,
            };
          });
          setGrades(gradesMap);
          setUpdateMode(true); // Enable update mode if grades already exist
        }
      } catch (err) {
        console.error("Failed to fetch grades:", err);
      }
    };

    fetchGrades();
  }, [subject_id]);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter students based on search query
    const filtered = students.filter((student) =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
      student.grade_level.toLowerCase().includes(query) ||
      student.strand_track.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );

    setFilteredStudents(filtered);
  };

  const handleGradeChange = (student_id, field, value) => {
    const updatedGrades = {
      ...grades,
      [student_id]: {
        ...grades[student_id],
        [field]: value,
      },
    };

    // Calculate the final grade and remarks dynamically only if both quarters are filled
    if (field === "first_quarter" || field === "second_quarter") {
      const firstQuarter = parseFloat(updatedGrades[student_id]?.first_quarter || 0);
      const secondQuarter = parseFloat(updatedGrades[student_id]?.second_quarter || 0);

      if (firstQuarter && secondQuarter) {
        const finalGrade = ((firstQuarter + secondQuarter) / 2).toFixed(2); // Calculate average
        const remarks = finalGrade >= 75 ? "PASSED" : "FAILED"; // Set remarks based on final grade
        updatedGrades[student_id].final_grade = finalGrade;
        updatedGrades[student_id].remarks = remarks;
      } else {
        updatedGrades[student_id].final_grade = null;
        updatedGrades[student_id].remarks = null;
      }
    }

    setGrades(updatedGrades);
  };

  const handleSaveGrades = () => {
    const gradesData = filteredStudents.map((student) => {
      const grade = grades[student.student_id] || {};
      return {
        student_id: student.student_id,
        first_quarter: grade.first_quarter || null,
        second_quarter: grade.second_quarter || null,
        final_grade: grade.second_quarter ? grade.final_grade : null,
        remarks: grade.second_quarter ? grade.remarks : null,
      };
    });

    fetch("http://localhost:8000/save_grades.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject_id, grades: gradesData }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setIsSuccessModalOpen(true); // Show success modal
        } else {
          alert("Failed to save grades.");
        }
      })
      .catch((err) => {
        console.error("Error saving grades:", err);
      });

    setIsConfirmationModalOpen(false);
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title with color
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0); // Dark green color (RGB)
    doc.text(`Grades for ${description} - ${section} (${strand})`, 14, 20);
    
    // Add subtitle information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color
    doc.text(`Grade Level: ${grade_level}`, 14, 30);
    doc.text(`Semester: ${semester}`, 14, 36);
    doc.text(`Total Students: ${filteredStudents.length}`, 14, 42);
    
    const tableColumn = ["No.", "First Name", "Last Name", "1st Quarter", "2nd Quarter", "Final Grade", "Remarks"];
    const tableRows = [];

    filteredStudents.forEach((student, index) => {
      const grade = grades[student.student_id] || {};
      const studentData = [
        index + 1,
        student.first_name,
        student.last_name,
        grade.first_quarter || "",
        grade.second_quarter || "",
        grade.final_grade || "",
        grade.remarks || ""
      ];
      tableRows.push(studentData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255]
      }
    });

    doc.save(`Grades_${description}_${section}.pdf`);
    
    setIsExportModalOpen(false); // Close export confirmation modal
  };

  const handleExportToExcel = () => {
    const exportData = filteredStudents.map((student, index) => {
      const grade = grades[student.student_id] || {};
      return {
        "No.": index + 1,
        "First Name": student.first_name,
        "Last Name": student.last_name,
        "1st Quarter": grade.first_quarter || "",
        "2nd Quarter": grade.second_quarter || "",
        "Final Grade": grade.final_grade || "",
        "Remarks": grade.remarks || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

    // Download the Excel file
    XLSX.writeFile(workbook, `Grades_${description}_${section}.xlsx`);

    setIsExportModalOpen(false); // Close export confirmation modal
  };

  const openConfirmationModal = () => setIsConfirmationModalOpen(true);
  const closeConfirmationModal = () => setIsConfirmationModalOpen(false);
  const openExportModal = (type) => {
    setExportType(type);
    setIsExportModalOpen(true);
  };
  const closeExportModal = () => setIsExportModalOpen(false);
  const closeSuccessModal = () => setIsSuccessModalOpen(false);

  const handleExportConfirmed = () => {
    if (exportType === 'pdf') {
      handleExportToPDF();
    } else if (exportType === 'excel') {
      handleExportToExcel();
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="grades-container">
      <div className="back-grades">
        <button
          type="button"
          className="grade-breadcrumb-button"
          onClick={() =>
            navigate("/subject-schedule", {
              state: { faculty_id },
            })
          }
        >
          Subjects Schedule /
        </button>
      </div>

      <div className="grade-header">
        <h2 className="grade-title">
          Grades for {description} - {section} ({strand})
        </h2>
        <div className="grade-details">
          <p>
            <strong>Grade Level:</strong> {grade_level} <br />
            <strong>Semester:</strong> {semester}
          </p>
        </div>
      </div>

      <div className="top-controls-grades">
        <div className="grades-searchbar">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="export-buttons-grades">
          <button 
            className="pdf-button-grade"
            onClick={() => openExportModal('pdf')}
          >
            <FaFilePdf className="export-icon" /> PDF
          </button>
          <button 
            className="excel-button-grade"
            onClick={() => openExportModal('excel')}
          >
            <FaFileExcel className="export-icon" /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredStudents.length === 0 ? (
        <p>No students found matching the search criteria.</p>
      ) : (
        <>
          <table className="grades-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>1st Quarter</th>
                <th>2nd Quarter</th>
                <th>Final Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1}</td>
                  <td>{student.first_name}</td>
                  <td>{student.last_name}</td>
                  <td>
                    <input
                      type="number"
                      value={grades[student.student_id]?.first_quarter || ""}
                      onChange={(e) =>
                        handleGradeChange(student.student_id, "first_quarter", e.target.value)
                      }
                      placeholder="Enter 1st Quarter Grade"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={grades[student.student_id]?.second_quarter || ""}
                      onChange={(e) =>
                        handleGradeChange(student.student_id, "second_quarter", e.target.value)
                      }
                      placeholder="Enter 2nd Quarter Grade"
                    />
                  </td>
                  <td>{grades[student.student_id]?.final_grade || ""}</td>
                  <td>{grades[student.student_id]?.remarks || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="button-group">
            <button className="save-grades-button" onClick={openConfirmationModal}>
              {updateMode ? "Update Grades" : "Save Grades"}
            </button>
          </div>
        </>
      )}

      {isConfirmationModalOpen && (
        <div className="modal-grades">
          <div className="modal-content-grade">
            <h3>
              {updateMode
                ? "Are you sure you want to update the grades?"
                : "Are you sure you want to save the grades?"}
            </h3>
            <div className="button-group-grade">
              <button onClick={handleSaveGrades} className="save-button-grade">
                Yes, {updateMode ? "Update" : "Save"}
              </button>
              <button onClick={closeConfirmationModal} className="discard-button-grade">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="modal-grades">
          <div className="modal-content-grade">
            <h3>Are you sure you want to export the grades to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</h3>
            <div className="button-group-grade">
              <button onClick={handleExportConfirmed} className="save-button-grade">
                Yes, Export
              </button>
              <button onClick={closeExportModal} className="discard-button-grade">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div className="modal-grades">
          <div className="modal-content-grade">
            <h3>Grades saved successfully!</h3>
            <div className="button-group-grade">
              <button onClick={closeSuccessModal} className="save-button-grade">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FGrades;