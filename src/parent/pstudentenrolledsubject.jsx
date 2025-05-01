import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // Import to access location state
import jsPDF from "jspdf"; // PDF library
import * as XLSX from "xlsx"; // Excel library
import "jspdf-autotable"; // Import autoTable plugin for jsPDF
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import "./pstudentenrolledsubject.css";

const PStudentEnrolledSubjects = () => {
  const location = useLocation(); // Get the current location state
  const studentId = location.state?.student_id; // Extract the student_id from the passed state

  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Set the API base URL based on the device
  useEffect(() => {
    const baseUrl = 
      window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // For mobile access
    
    setApiBaseUrl(baseUrl);
  }, []);

  useEffect(() => {
    if (!studentId || !apiBaseUrl) {
      console.error("No student ID provided or API URL not set.");
      return;
    }

    const fetchEnrolledSubjects = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/fetch_subjects.php?student_id=${studentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success === false) {
          console.error("Backend Error:", data.message);
        } else if (Array.isArray(data)) {
          setEnrolledSubjects(data);
          setTotalSubjects(data.length);
        } else {
          console.error("Unexpected response format:", data);
        }
      } catch (error) {
        console.error("Error fetching enrolled subjects:", error);
      }
    };

    fetchEnrolledSubjects();
  }, [studentId, apiBaseUrl]);

  // Search filter
  const filteredSubjects = enrolledSubjects.filter((subject) =>
    subject.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate PDF with jsPDF
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Enrolled Subjects", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Define the table structure
    const tableColumn = [
      "No.", "Description", "Schedule", "Teacher", "Grade", "Strand", "Section"
    ];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredSubjects.forEach((subject, index) => {
      tableRows.push([
        index + 1,
        subject.description,
        subject.schedule,
        subject.teacher,
        subject.grade,
        subject.strand,
        subject.section
      ]);
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

    doc.save("enrolled_subjects.pdf");
    setIsPDFModalOpen(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredSubjects.map((subject, index) => ({
      "No.": index + 1,
      "Description": subject.description,
      "Schedule": subject.schedule,
      "Teacher": subject.teacher,
      "Grade": subject.grade,
      "Strand": subject.strand,
      "Section": subject.section
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrolled Subjects");

    XLSX.writeFile(workbook, "enrolled_subjects.xlsx");
    setIsExportModalOpen(false);
  };

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);
  const openPDFModal = () => setIsPDFModalOpen(true);
  const closePDFModal = () => setIsPDFModalOpen(false);

  return (
    <div className="subjects-container-ses">
      <div className="header-student-enrolled-subject-sess">
        <h2 className="subjects-title-sess">Enrolled Subjects</h2>
        <div className="total-container-sess">
        <span className="total-label-student-enrolled-subject-sess">Total:</span>
        <span className="total-count-student-enrolled-subject-sess">{totalSubjects}</span>
      </div>
      </div>
      <div className="top-controls-student-enrolled-subject-ses">
        <div className="search-bar-student-enrolled-subject-ses">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="ses-btn-control">
            <button className="pdf-button-student-enrolled-subject-ses" onClick={openPDFModal}>
              <FaFilePdf style={{ marginRight: '5px' }} /> PDF
            </button>
            <button className="xls-button-student-enrolled-subject-ses" onClick={openExportModal}>
              <FaFileExcel style={{ marginRight: '5px' }} /> Excel
            </button>
          </div>
        </div>
      </div>
      <div className="subjects-table-container-ss">
      <table className="subjects-table-ses">
        <thead>
          <tr>
            <th>NO.</th>
            <th>DESCRIPTION</th>
            <th>SCHEDULE</th>
            <th>TEACHER</th>
            <th>GRADE</th>
            <th>STRAND</th>
            <th>SECTION</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubjects.map((subject, index) => (
            <tr key={subject.subject_id}>
              <td>{index + 1}</td>
              <td>{subject.description}</td>
              <td>{subject.schedule}</td>
              <td>{subject.teacher}</td>
              <td>{subject.grade}</td>
              <td>{subject.strand}</td>
              <td>{subject.section}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="modal-confirmation-ses">
          <div className="modal-content-ses">
          <h3>Confirmation</h3>
            <label>Are you sure you want to export to Excel?</label>
            <div className="modal-group-button-ses">
            <button className="confirm-button-ses" onClick={handleExportExcel}>
              Yes, Export
            </button>
            <button className="cancel-button-ses" onClick={closeExportModal}>
              Cancel
            </button>
          </div>
          </div>
        </div>
      )}

      {/* PDF Export Confirmation Modal */}
      {isPDFModalOpen && (
        <div className="modal-confirmation-ses">
          <div className="modal-content-ses">
          <h3>Confirmation</h3>
            <label>Are you sure you want to export to PDF?</label>
            <div className="modal-group-button-ses">
            <button className="confirm-button-ses" onClick={generatePDF}>
              Yes, Export
            </button>
            <button className="cancel-button-ses" onClick={closePDFModal}>
              Cancel
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PStudentEnrolledSubjects;