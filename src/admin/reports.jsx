import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Required for auto table functionality in jsPDF
import * as XLSX from 'xlsx'; // Required for Excel export
import './reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { student_id } = location.state || {};  // Retrieve the passed student_id

  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);  // State to control modal visibility
  const [exportSection, setExportSection] = useState(''); // State to determine which section to export

  const fetchData = () => {
    setLoading(true);
    
    const baseUrl = window.location.hostname === "localhost"
        ? "http://mediumaquamarine-dunlin-251088.hostingersite.com"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    // Fetch Enrolled Subjects
    fetch(`${baseUrl}/fetch_subjects.php?student_id=${student_id}`)
      .then(response => response.json())
      .then(data => {
        if (data.success !== false) {
          setEnrolledSubjects(data);
        } else {
          console.error("Error fetching enrolled subjects:", data.message);
        }
      })
      .catch(error => console.error("Error fetching enrolled subjects:", error));

    // Fetch Grades
    fetch(`${baseUrl}/fetch_grades.php?student_id=${student_id}`)
      .then(response => response.json())
      .then(data => {
        if (data.success !== false) {
          setGrades(data.grades);
        } else {
          console.error("Error fetching grades:", data.message);
        }
      })
      .catch(error => console.error("Error fetching grades:", error));

    // Fetch Payment Records
    fetch(`${baseUrl}/getPaymentReport.php?student_id=${student_id}`)
      .then(response => response.json())
      .then(data => {
        if (data.success !== false) {
          setPaymentRecords(data.payments);
        } else {
          console.error("Error fetching payment records:", data.message);
        }
      })
      .catch(error => console.error("Error fetching payment records:", error))
      .finally(() => setLoading(false));
};


  useEffect(() => {
    if (student_id) {
      fetchData();
    }
  }, [student_id]); // Re-run effect if student_id changes

  const handleRefresh = () => {
    fetchData(); // Fetch data again when refresh button is clicked
  };

  // Export to PDF
  const exportToPDF = (section) => {
    const doc = new jsPDF();
    doc.setFontSize(12);

    if (section === 'enrolledSubjects') {
      doc.text('Enrolled Subjects', 14, 20);
      doc.autoTable({
        startY: 30,
        head: [['No.', 'Description', 'Schedule', 'Instructor', 'Section', 'Strand']],
        body: enrolledSubjects.map((subject, index) => [
          index + 1,
          subject.description,
          subject.schedule,
          subject.teacher,
          subject.section,
          subject.strand
        ]),
      });
    } else if (section === 'grades') {
      doc.text('Grades', 14, 20);
      doc.autoTable({
        startY: 30,
        head: [['No.', 'Description', '1st SEM', '2nd SEM', 'Final Grades', 'Remarks']],
        body: grades.map((grade, index) => [
          index + 1,
          grade.subject_description,
          grade.first_quarter,
          grade.second_quarter,
          grade.final_grade,
          grade.remarks
        ]),
      });
    } else if (section === 'payments') {
      doc.text('Payment Records', 14, 20);
      doc.autoTable({
        startY: 30,
        head: [
          ['Name', 'Strand', 'Grade Level', 'Section', 'Mode of Payment', 'Status', 'Payment', 'Date', 'Total Fee', 'Amount Paid', 'Balance', 'Remarks', 'Receipt No.']
        ],
        body: paymentRecords.map(record => [
          record.name,
          record.strand,
          record.grade_level,
          record.section,
          record.mode_of_payment,
          record.status,
          record.payment,
          record.date,
          record.total_fee,
          record.amount_paid,
          record.balance,
          record.remarks,
          record.receipt_number
        ]),
      });
    }

    doc.save('report.pdf');
    setShowModal(false); // Close the modal after exporting
  };

  // Export to Excel
  const exportToExcel = (section) => {
    const wb = XLSX.utils.book_new();

    if (section === 'enrolledSubjects') {
      const sheetData = [['No.', 'Description', 'Schedule', 'Instructor', 'Section', 'Strand']];
      enrolledSubjects.forEach((subject, index) => {
        sheetData.push([
          index + 1,
          subject.description,
          subject.schedule,
          subject.teacher,
          subject.section,
          subject.strand
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, 'Enrolled Subjects');
    } else if (section === 'grades') {
      const sheetDataGrades = [['No.', 'Description', '1st SEM', '2nd SEM', 'Final Grades', 'Remarks']];
      grades.forEach((grade, index) => {
        sheetDataGrades.push([
          index + 1,
          grade.subject_description,
          grade.first_quarter,
          grade.second_quarter,
          grade.final_grade,
          grade.remarks
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(sheetDataGrades);
      XLSX.utils.book_append_sheet(wb, ws2, 'Grades');
    } else if (section === 'payments') {
      const sheetDataPayments = [
        ['Name', 'Strand', 'Grade Level', 'Section', 'Mode of Payment', 'Status', 'Payment', 'Date', 'Total Fee', 'Amount Paid', 'Balance', 'Remarks', 'Receipt No.']
      ];
      paymentRecords.forEach(record => {
        sheetDataPayments.push([
          record.name,
          record.strand,
          record.grade_level,
          record.section,
          record.mode_of_payment,
          record.status,
          record.payment,
          record.date,
          record.total_fee,
          record.amount_paid,
          record.balance,
          record.remarks,
          record.receipt_number
        ]);
      });

      const ws3 = XLSX.utils.aoa_to_sheet(sheetDataPayments);
      XLSX.utils.book_append_sheet(wb, ws3, 'Payment Records');
    }

    XLSX.writeFile(wb, 'report.xlsx');
    setShowModal(false); // Close the modal after exporting
  };

  const handleExportClick = (section) => {
    setExportSection(section);
    setShowModal(true); // Show the modal when the export button is clicked
  };

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal if the user cancels
  };

  const handleConfirmExport = () => {
    if (exportSection === 'enrolledSubjects') {
      exportToPDF('enrolledSubjects');
    } else if (exportSection === 'grades') {
      exportToPDF('grades');
    } else if (exportSection === 'payments') {
      exportToPDF('payments');
    }
  };

  return (
    <div className="reports-container">
      <div className="header-r">
        <button
          type="button"
          className="breadcrumb-r-button"
          onClick={() => navigate('/student-report-lists')}
        >
          Students Report List /
        </button>
        <h2 className="report-title-rt">Report</h2>
      </div>
      {/* Enrolled Subjects Section */}
      <section className="enrolled-subjects-section">
        <h2>Enrolled Subjects</h2>
        <div className="button-section">
          <span>Total Number: {enrolledSubjects.length}</span>
          <button className="btn refresh-btn1" onClick={handleRefresh}>REFRESH</button>
          <button className="btn pdf-btn" onClick={() => handleExportClick('enrolledSubjects')}>Export to PDF</button>
          <button className="btn excel-btn" onClick={() => handleExportClick('enrolledSubjects')}>Export to Excel</button>
        </div>
        <table className="table-r">
          <thead>
            <tr>
              <th>NO.</th>
              <th>DESCRIPTION</th>
              <th>SCHEDULE</th>
              <th>INSTRUCTOR</th>
              <th>SECTION</th>
              <th>STRAND</th>
            </tr>
          </thead>
          <tbody>
            {enrolledSubjects.map((subject, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{subject.description}</td>
                <td>{subject.schedule}</td>
                <td>{subject.teacher}</td>
                <td>{subject.section}</td>
                <td>{subject.strand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Grades Section */}
      <section className="grades-section">
        <h2>Grades</h2>
        <div className="button-section">
          <button className="btn refresh-btn2" onClick={handleRefresh}>REFRESH</button>
          <button className="btn pdf-btn" onClick={() => handleExportClick('grades')}>Export to PDF</button>
          <button className="btn excel-btn" onClick={() => handleExportClick('grades')}>Export to Excel</button>
        </div>
        <table className="table-r">
          <thead>
            <tr>
              <th>NO.</th>
              <th>DESCRIPTION</th>
              <th>1st SEM</th>
              <th>2nd SEM</th>
              <th>FINAL GRADES</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{grade.subject_description}</td>
                <td>{grade.first_quarter}</td>
                <td>{grade.second_quarter}</td>
                <td>{grade.final_grade}</td>
                <td>{grade.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Payment Records Section */}
      <section className="payment-records-section">
        <h2>Payment Records</h2>
        <div className="button-section">
          <span>
            Latest Balance:{" "}
            {paymentRecords.length > 0
              ? paymentRecords.sort((a, b) => b.receipt_number - a.receipt_number)[0].balance
              : 0
            }
          </span>
          <button className="btn refresh-btn3">REFRESH</button>
          <button className="btn pdf-btn" onClick={() => handleExportClick('payments')}>Export to PDF</button>
          <button className="btn excel-btn" onClick={() => handleExportClick('payments')}>Export to Excel</button>
        </div>
        <table className="table-r">
          <thead>
            <tr>
              <th>NAME</th>
              <th>STRAND</th>
              <th>GRADE LEVEL</th>
              <th>SECTION</th>
              <th>MODE OF PAYMENT</th>
              <th>STATUS</th>
              <th>PAYMENT</th>
              <th>DATE</th>
              <th>TOTAL FEE</th>
              <th>AMOUNT PAID</th>
              <th>BALANCE</th>
              <th>REMARKS</th>
              <th>RECEIPT NO.</th>
            </tr>
          </thead>
          <tbody>
            {paymentRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.name}</td>
                <td>{record.strand}</td>
                <td>{record.grade_level}</td>
                <td>{record.section}</td>
                <td>{record.mode_of_payment}</td>
                <td>{record.status}</td>
                <td>{record.payment}</td>
                <td>{record.date}</td>
                <td>{record.total_fee}</td>
                <td>{record.amount_paid}</td>
                <td>{record.balance}</td>
                <td>{record.remarks}</td>
                <td>{record.receipt_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="report-modal">
          <div className="report-modal-content">
            <h3>Confirmation</h3>
            <p>Are you sure you want to export this data?</p>
            <div className="report-modal-buttons">
              <button className="report-confirm-btn" onClick={handleConfirmExport}>Yes</button>
              <button className="report-cancel-btn" onClick={handleCloseModal}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
