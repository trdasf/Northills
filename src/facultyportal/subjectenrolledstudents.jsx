import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx"; // Library for exporting to Excel
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import "./subjectenrolledstudents.css";

const SubjectEnrolledStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve subject_id, faculty_id, and other details from location state
  const { subject_id, faculty_id, description, grade_level, strand, section } = location.state || {};

  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]); // For search filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // Modal for export confirmation
  const [searchQuery, setSearchQuery] = useState(""); // For search input
  const [exportType, setExportType] = useState(null); // To track which export type was selected

  useEffect(() => {
    // Ensure all required parameters are present
    if (!subject_id || !grade_level || !strand || !section) {
      setError("Missing required parameters. Please go back and try again.");
      setLoading(false);
      return;
    }

    // Fetch students based on subject_id
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/studentlist.php?subject_id=${subject_id}&grade_level=${grade_level}&strand_track=${strand}&section=${section}`
        );
        const data = await response.json();

        if (data.success) {
          setEnrolledStudents(data.students);
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
  }, [subject_id, grade_level, strand, section]);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter students based on search query
    const filtered = enrolledStudents.filter((student) =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
      student.grade_level.toLowerCase().includes(query) ||
      student.strand_track.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );

    setFilteredStudents(filtered);
  };

  const handleExportToExcel = () => {
    const exportData = filteredStudents.map((student, index) => ({
      "No.": index + 1,
      "First Name": student.first_name,
      "Last Name": student.last_name,
      "Grade Level": student.grade_level,
      "Strand": student.strand_track,
      "Section": student.section,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrolled Students");

    // Save the file
    XLSX.writeFile(workbook, `Enrolled_Students_${description}_${section}.xlsx`);

    setIsExportModalOpen(false); // Close the export confirmation modal
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title with color
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0); // Dark green color (RGB)
    doc.text(`Enrolled Students in ${description} (${section})`, 14, 20);
    
    // Reset text color for the rest of the content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Students: ${filteredStudents.length}`, 14, 30);
    
    const tableColumn = ["No.", "First Name", "Last Name", "Grade Level", "Strand", "Section"];
    const tableRows = [];

    filteredStudents.forEach((student, index) => {
      const studentData = [
        index + 1,
        student.first_name,
        student.last_name,
        student.grade_level,
        student.strand_track,
        student.section
      ];
      tableRows.push(studentData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
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

    doc.save(`Enrolled_Students_${description}_${section}.pdf`);
    
    setIsExportModalOpen(false); // Close the export confirmation modal
  };

  const openExportModal = (type) => {
    setExportType(type);
    setIsExportModalOpen(true);
  };
  
  const closeExportModal = () => setIsExportModalOpen(false);

  const handleExportConfirmed = () => {
    if (exportType === 'pdf') {
      handleExportToPDF();
    } else if (exportType === 'excel') {
      handleExportToExcel();
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="ss-enrolled-students-container">
      <div className="back-subject-schedule">
        <button
          type="button"
          className="subject-schedule-breadcrumb-button"
          onClick={() =>
            navigate("/subject-schedule", {
              state: { faculty_id }, // Pass faculty_id back to SubjectSchedule
            })
          }
        >
          Subjects Schedule /
        </button>
      </div>
      <div className="header-sses">
        <h2 className="application-title-sses">
          Enrolled Students in {description} ({section})
        </h2>
        <p className="total-label-sses">Total:</p>
        <span className="total-count-sses">{filteredStudents.length}</span>
      </div>

      <div className="top-controls-enrolledstudents-ss">
        <div className="search-bar-sses">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="export-buttons-sses">
          <button 
            className="pdf-button-sses" 
            onClick={() => openExportModal('pdf')}
          >
            <FaFilePdf className="export-icon" /> PDF
          </button>
          <button 
            className="excel-button-sses" 
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
        <table className="application-table-sses">
          <thead>
            <tr>
              <th>NO.</th>
              <th>FIRST NAME</th>
              <th>LAST NAME</th>
              <th>GRADE LEVEL</th>
              <th>STRAND</th>
              <th>SECTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.student_id}>
                <td>{index + 1}</td>
                <td>{student.first_name}</td>
                <td>{student.last_name}</td>
                <td>{student.grade_level}</td>
                <td>{student.strand_track}</td>
                <td>{student.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isExportModalOpen && (
        <div className="modal-schedule-ses">
          <div className="modal-content-ses">
            <h3>Are you sure you want to export the enrolled students to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</h3>
            <div className="button-group-ses">
              <button className="save-button-ses" onClick={handleExportConfirmed}>
                Yes, Export
              </button>
              <button className="cancel-button-ses" onClick={closeExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectEnrolledStudents;