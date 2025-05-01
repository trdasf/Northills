import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./pstudentgrades.css";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable"; // Import jsPDF autoTable plugin
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

const PStudentGrades = () => {
  const location = useLocation(); // Access location hook to get student_id
  const studentId = location.state?.student_id; // Get student_id from location state
  
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [grades, setGrades] = useState({
    firstSemGrades: [],
    secondSemGrades: [],
    firstSemAverage: 0,
    secondSemAverage: 0,
    generalAverage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState(""); // Track export type (PDF or XLS)
  const [selectedSemester, setSelectedSemester] = useState("both"); // Default to both semesters
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // For success modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // For confirmation modal

  // Set the API base URL based on the device
  useEffect(() => {
    const baseUrl = 
      window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // For mobile access
    
    setApiBaseUrl(baseUrl);
    console.log("API Base URL set to:", baseUrl);
  }, []);

  // Only fetch data when both studentId and apiBaseUrl are available
  useEffect(() => {
    // Add debug logging to check if studentId is correctly received
    console.log("StudentGrades - Student ID from location.state:", studentId);
    console.log("Current API Base URL:", apiBaseUrl);
    
    // Don't proceed if either value is missing
    if (!studentId) {
      console.error("Missing studentId:", studentId);
      setError("Student ID is missing. Please ensure you're accessing this page correctly.");
      setLoading(false);
      return;
    }
    
    if (!apiBaseUrl) {
      console.log("API Base URL not set yet, waiting...");
      return; // Don't throw an error, just wait for apiBaseUrl to be set
    }

    console.log("Both studentId and apiBaseUrl are available, proceeding with fetch");

    const fetchGrades = async () => {
      try {
        console.log(`Fetching grades for student ID: ${studentId} from ${apiBaseUrl}/fetch_StudentGrades.php`);
        
        const response = await fetch(`${apiBaseUrl}/fetch_StudentGrades.php?student_id=${studentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Grades API response:", data);

        if (data.success) {
          const { grades } = data;

          // Separate grades into first and second semester based on the semester field
          const firstSemGrades = grades.filter((grade) => grade.semester === "1ST");
          const secondSemGrades = grades.filter((grade) => grade.semester === "2ND");

          // Calculate semester averages for the first semester
          const firstSemAverage =
            firstSemGrades.length > 0
              ? (
                  firstSemGrades.reduce((acc, grade) => acc + parseFloat(grade.final_grade), 0) / firstSemGrades.length
                ).toFixed(2)
              : 0;

          // Calculate semester averages for the second semester
          const secondSemAverage =
            secondSemGrades.length > 0
              ? (
                  secondSemGrades.reduce((acc, grade) => acc + parseFloat(grade.final_grade), 0) / secondSemGrades.length
                ).toFixed(2)
              : 0;

          // Calculate general average
          const generalAverage =
            firstSemGrades.length > 0 && secondSemGrades.length > 0
              ? ((parseFloat(firstSemAverage) + parseFloat(secondSemAverage)) / 2).toFixed(2)
              : firstSemGrades.length > 0
              ? firstSemAverage
              : secondSemAverage;

          setGrades({
            firstSemGrades,
            secondSemGrades,
            firstSemAverage,
            secondSemAverage,
            generalAverage,
          });
          setError(""); // Clear any previous errors
          setLoading(false);
        } else {
          setError(data.message || "Failed to fetch grades");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
        setError(`An error occurred while fetching the grades: ${error.message}`);
        setLoading(false);
      }
    };

    fetchGrades();
  }, [studentId, apiBaseUrl]); // This will run whenever studentId OR apiBaseUrl changes

  // Function to generate PDF with table
  const generatePDF = () => {
    const doc = new jsPDF();

    // Title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Student Grades", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Student ID: ${studentId}`, 14, 30);

    let currentY = 40;

    // Define column headers
    const gradeColumns = [
      "Subject", "Instructor", "1st Quarter", "2nd Quarter", "Final Grade", "Semester", "Remarks"
    ];

    // Configure common table options
    const tableOptions = {
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 100, 0], // Dark green header
        textColor: [255, 255, 255],
        fontSize: 8,
      }
    };

    // First Semester Table (if selected)
    if (selectedSemester === "first" || selectedSemester === "both") {
      doc.setTextColor(0, 100, 0);
      doc.setFontSize(14);
      doc.text("First Semester Grades", 14, currentY);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      currentY += 10;

      if (grades.firstSemGrades.length > 0) {
        const firstSemData = grades.firstSemGrades.map((grade) => [
          grade.subject_description,
          grade.subject_teacher,
          grade.first_quarter,
          grade.second_quarter,
          grade.final_grade,
          grade.semester,
          grade.remarks,
        ]);

        doc.autoTable({
          ...tableOptions,
          startY: currentY,
          head: [gradeColumns],
          body: firstSemData,
        });

        // Update Y position after the table
        currentY = doc.lastAutoTable.finalY + 15;
        
        // Add first semester average
        doc.text(`First Semester Average: ${grades.firstSemAverage}`, 14, currentY);
        currentY += 10;
      } else {
        doc.text("No grades available for first semester", 14, currentY);
        currentY += 10;
      }
    }

    // Add a new page if needed for second semester
    if (selectedSemester === "both" && grades.secondSemGrades.length > 0 && currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    // Second Semester Table (if selected)
    if (selectedSemester === "second" || selectedSemester === "both") {
      doc.setTextColor(0, 100, 0);
      doc.setFontSize(14);
      doc.text("Second Semester Grades", 14, currentY);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      currentY += 10;

      if (grades.secondSemGrades.length > 0) {
        const secondSemData = grades.secondSemGrades.map((grade) => [
          grade.subject_description,
          grade.subject_teacher,
          grade.first_quarter,
          grade.second_quarter,
          grade.final_grade,
          grade.semester,
          grade.remarks,
        ]);

        doc.autoTable({
          ...tableOptions,
          startY: currentY,
          head: [gradeColumns],
          body: secondSemData,
        });

        // Update Y position after the table
        currentY = doc.lastAutoTable.finalY + 15;
        
        // Add second semester average
        doc.text(`Second Semester Average: ${grades.secondSemAverage}`, 14, currentY);
        currentY += 10;
      } else {
        doc.text("No grades available for second semester", 14, currentY);
        currentY += 10;
      }
    }

    // Add general average if both semesters are selected
    if (selectedSemester === "both" && grades.firstSemGrades.length > 0 && grades.secondSemGrades.length > 0) {
      doc.setTextColor(0, 100, 0);
      doc.setFontSize(12);
      doc.text(`General Average: ${grades.generalAverage}`, 14, currentY);
    }

    // File name based on selected semester
    let filename = "grades";
    if (selectedSemester === "first") {
      filename = "first_semester_grades";
    } else if (selectedSemester === "second") {
      filename = "second_semester_grades";
    }

    // Save the PDF
    doc.save(`${filename}.pdf`);

    // Show success modal
    setIsSuccessModalOpen(true);
    setIsConfirmationModalOpen(false);
  };

  // Function to generate Excel file
  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Base data with student info
    let worksheetData = [
      ["Student ID", studentId],
      []
    ];
    
    // Add first semester data if selected
    if (selectedSemester === "first" || selectedSemester === "both") {
      worksheetData.push(
        ["First Semester Grades"],
        ["Subject", "Instructor", "1st Quarter", "2nd Quarter", "Final Grade", "Semester", "Remarks"]
      );
      
      if (grades.firstSemGrades.length > 0) {
        grades.firstSemGrades.forEach(grade => {
          worksheetData.push([
            grade.subject_description,
            grade.subject_teacher,
            grade.first_quarter,
            grade.second_quarter,
            grade.final_grade,
            grade.semester,
            grade.remarks
          ]);
        });
        
        worksheetData.push(
          [],
          ["First Semester Average", grades.firstSemAverage]
        );
      } else {
        worksheetData.push(["No grades available for first semester"]);
      }
      
      worksheetData.push([]);
    }
    
    // Add second semester data if selected
    if (selectedSemester === "second" || selectedSemester === "both") {
      worksheetData.push(
        ["Second Semester Grades"],
        ["Subject", "Instructor", "1st Quarter", "2nd Quarter", "Final Grade", "Semester", "Remarks"]
      );
      
      if (grades.secondSemGrades.length > 0) {
        grades.secondSemGrades.forEach(grade => {
          worksheetData.push([
            grade.subject_description,
            grade.subject_teacher,
            grade.first_quarter,
            grade.second_quarter,
            grade.final_grade,
            grade.semester,
            grade.remarks
          ]);
        });
        
        worksheetData.push(
          [],
          ["Second Semester Average", grades.secondSemAverage]
        );
      } else {
        worksheetData.push(["No grades available for second semester"]);
      }
    }
    
    // Add overall average if both semesters are included
    if (selectedSemester === "both" && grades.firstSemGrades.length > 0 && grades.secondSemGrades.length > 0) {
      worksheetData.push(
        [],
        ["General Average", grades.generalAverage]
      );
    }
    
    // Create the worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // File name based on selected semester
    let filename = "grades";
    if (selectedSemester === "first") {
      filename = "first_semester_grades";
    } else if (selectedSemester === "second") {
      filename = "second_semester_grades";
    }
    
    // Add the worksheet to the workbook and write the file
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    // Show success modal
    setIsSuccessModalOpen(true);
    setIsConfirmationModalOpen(false);
  };

  // Handle export modal
  const openExportModal = (type) => {
    setExportType(type);
    setSelectedSemester("both"); // Reset to default
    setIsConfirmationModalOpen(true); // Open confirmation modal
  };

  // Handle semester change in export modal
  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
  };

  // Confirm the export action
  const handleConfirmExport = () => {
    if (exportType === "pdf") {
      generatePDF();
    } else if (exportType === "xls") {
      generateExcel();
    }
  };

  // Cancel the export action
  const handleCancelExport = () => {
    setIsConfirmationModalOpen(false); // Close confirmation modal
  };

  // Close success modal
  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  // Inside the return block, handle empty grades:
  if (loading && apiBaseUrl) {
    return <div className="loading-container-sg">Loading grades for student ID: {studentId}...</div>;
  }

  if (error) {
    return (
      <div className="error-container-sg">
        <h3>Error</h3>
        <p>{error}</p>
        <p>Student ID: {studentId || "Not found"}</p>
      </div>
    );
  }

  return (
    <div className="grades-container-sg">
      <div className="top-controls-student-grades-sg">
        <h2 className="grades-title-sg">Grades</h2>
        <div className="buttons-group-student-grades-sg">
          <button className="pdf-button-student-grades-sg" onClick={() => openExportModal("pdf")}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="xls-button-student-grades-sg" onClick={() => openExportModal("xls")}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
        </div>
      </div>

      {/* If no grades are available, show a message */}
      {grades.firstSemGrades.length === 0 && grades.secondSemGrades.length === 0 && (
        <p className="no-grades-message-sg">No grades available for this student (ID: {studentId}).</p>
      )}

      {/* First Semester Grades */}
      {grades.firstSemGrades.length > 0 && (
        <div className="semester-section-sg">
          <h3>First Semester Grades</h3>
          <div className="table-container-sg">
            <table className="grades-table-sg">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Instructor</th>
                  <th>1st Quarter</th>
                  <th>2nd Quarter</th>
                  <th>Final Semester</th>
                  <th>Semester</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grades.firstSemGrades.map((grade, index) => (
                  <tr key={index}>
                    <td>{grade.subject_description}</td>
                    <td>{grade.subject_teacher}</td>
                    <td>{grade.first_quarter}</td>
                    <td>{grade.second_quarter}</td>
                    <td>{grade.final_grade}</td>
                    <td>{grade.semester}</td>
                    <td>{grade.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="semester-average-sg">
            <span>Gen. Ave for the first semester:</span>
            <input type="text" className="average-input-sg" value={grades.firstSemAverage} readOnly />
          </div>
        </div>
      )}

      <hr className="separator" />

      {/* Second Semester Grades */}
      {grades.secondSemGrades.length > 0 && (
        <div className="semester-section-sg">
          <h3>Second Semester Grades</h3>
          <div className="table-container-sg">
            <table className="grades-table-sg">
              <thead>
                <tr>
                  <th>DESCRIPTION</th>
                  <th>INSTRUCTOR</th>
                  <th>3rd Quarter</th>
                  <th>4th Quarter</th>
                  <th>Final Semester</th>
                  <th>SEMESTER</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {grades.secondSemGrades.map((grade, index) => (
                  <tr key={index}>
                    <td>{grade.subject_description}</td>
                    <td>{grade.subject_teacher}</td>
                    <td>{grade.first_quarter}</td>
                    <td>{grade.second_quarter}</td>
                    <td>{grade.final_grade}</td>
                    <td>{grade.semester}</td>
                    <td>{grade.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="semester-average-sg">
            <span>Gen. Ave for the second semester:</span>
            <input type="text" className="average-input-sg" value={grades.secondSemAverage} readOnly />
          </div>
        </div>
      )}

      <hr className="separator" />

      <div className="final-grades-sg">
        <span>Final Grades:</span>
        <input type="text" className="final-grades-input-sg" value={grades.generalAverage} readOnly />
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="modal-overlay-sg">
          <div className="modal-content-sg">
            <p>{exportType.toUpperCase()} file successfully generated!</p>
            <button onClick={closeSuccessModal}>Close</button>
          </div>
        </div>
      )}

      {/* Confirmation Modal with Semester Selection */}
      {isConfirmationModalOpen && (
        <div className="modal-overlay-sg">
          <div className="modal-content-sg">
            <h3>Export Confirmation</h3>
            <p>Select which semester grades to export:</p>
            
            <div className="semester-selection-sg">
              <select 
                value={selectedSemester} 
                onChange={handleSemesterChange}
                className="semester-dropdown-sg"
              >
                <option value="both">Both Semesters</option>
                <option value="first">First Semester Only</option>
                <option value="second">Second Semester Only</option>
              </select>
            </div>
            
            <p>Export as {exportType.toUpperCase()}?</p>
            
            <div className="modal-buttons-sg">
              <button className="modal-yes-button-sg" onClick={handleConfirmExport}>Yes, Export</button>
              <button className="modal-no-button-sg" onClick={handleCancelExport}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PStudentGrades;