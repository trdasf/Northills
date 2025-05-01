import React, { useEffect, useState } from 'react';
import './enrolledstudents.css';
import { FaEye, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EnrolledStudents = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportType, setExportType] = useState(null);

  useEffect(() => {
    const apiUrl =
      window.location.hostname === "localhost"
        ? "http://mediumaquamarine-dunlin-251088.hostingersite.com/fetch_enrolled.php"
        : "http://192.168.1.10:8000/fetch_enrolled.php";
  
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setApplicants(data.applicants);
        } else {
          alert(data.message);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching applicants:", error);
        setLoading(false);
      });
  }, []);
  
  const viewApplicant = (applicantData) => {
    navigate('/profile-enrolled-students', { state: { student_id: applicantData.student_id } });
  };

  const goToSchedule = () => {
    navigate('/schedule');
  };

  // Filter applicants based on the search query and grade filter
  const filteredApplicants = applicants.filter((applicant) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      applicant.name.toLowerCase().includes(searchLower) ||
      applicant.email.toLowerCase().includes(searchLower) ||
      applicant.gradeLevel.toLowerCase().includes(searchLower) ||
      applicant.section.toLowerCase().includes(searchLower);
    
    // Apply grade filter
    const matchesGrade = gradeFilter === 'all' || 
                         applicant.gradeLevel === gradeFilter;
    
    return matchesSearch && matchesGrade;
  });

  // Function to trigger confirmation modal
  const confirmExport = (type) => {
    setExportType(type);
    setShowConfirmModal(true);
  };

  // Function to export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title with color
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0); // Dark green color (RGB)
    doc.text("Enrolled Students List", 14, 20);
    
    // Reset text color for the rest of the content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Students: ${filteredApplicants.length}`, 14, 30);
    
    const tableColumn = ["No.", "Name", "Email", "Grade Level", "Section"];
    const tableRows = [];

    filteredApplicants.forEach((applicant, index) => {
      const studentData = [
        index + 1,
        applicant.name,
        applicant.email,
        applicant.gradeLevel,
        applicant.section
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

    doc.save("enrolled_students.pdf");
  };

  // Function to export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredApplicants.map((applicant, index) => ({
        "No.": index + 1,
        "Name": applicant.name,
        "Email": applicant.email,
        "Grade Level": applicant.gradeLevel,
        "Section": applicant.section
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrolled Students");
    XLSX.writeFile(workbook, "enrolled_students.xlsx");
  };

  // Handle export based on confirmation
  const handleExportConfirmed = () => {
    if (exportType === 'pdf') {
      exportToPDF();
    } else if (exportType === 'excel') {
      exportToExcel();
    }
    setShowConfirmModal(false);
  };

  return (
    <div className="enrolled-students-container-es">
      <div className="enrolled-students-header-es">
        <h2 className="enrolled-students-title-es">Enrolled Students List</h2>
        <p className="enrolled-students-total-label-es">Total:<span className="enrolled-students-total-count-es">{filteredApplicants.length}</span></p>
      </div>
      <div className="top-controls-enrolledstudents">
        <div className="search-bar-enrolledstudents">
          <input
            type="text"
            placeholder="Search by name, email, grade level, or section"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="enrolled-students-filter-es"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="all">All Grades</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>
        <div className="export-buttons">
          <button 
            className="enrolled-students-pdf-button-es"
            onClick={() => confirmExport('pdf')}
          >
            <FaFilePdf className="export-icon" /> PDF
          </button>
          <button 
            className="enrolled-students-excel-button-es"
            onClick={() => confirmExport('excel')}
          >
            <FaFileExcel className="export-icon" /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="enrolled-students-table-container">
        <table className="enrolled-students-table">
          <thead>
            <tr>
              <th>NO.</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>GRADE LEVEL</th>
              <th>SECTION</th>
              <th>VIEW</th>
            </tr>
          </thead>  
          <tbody>
            {filteredApplicants.map((applicant, index) => (
              <tr key={applicant.student_id}>
                <td>{index + 1}</td>
                <td>{applicant.name}</td>
                <td>{applicant.email}</td>
                <td>{applicant.gradeLevel}</td>
                <td>{applicant.section}</td>
                <td>
                  <FaEye
                    className="enrolled-students-view-icon"
                    onClick={() => viewApplicant(applicant)}
                    style={{ cursor: 'pointer', color: '#006400' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Export</h3>
            <p>Are you sure you want to export the data to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</p>
            <div className="modal-buttons">
              <button className="confirm-button" onClick={handleExportConfirmed}>Yes, Export</button>
              <button className="cancel-button" onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrolledStudents;