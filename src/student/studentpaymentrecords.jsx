import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation hook
import jsPDF from "jspdf"; // PDF library
import * as XLSX from "xlsx"; // Excel library
import "jspdf-autotable"; // Import autoTable plugin for jsPDF
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import "./studentpaymentrecords.css";

const StudentPaymentRecords = () => {
  const location = useLocation(); // Access location hook to get student_id
  const studentId = location.state?.student_id; // Get student_id from location state

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const tableRef = useRef(null);

  // Set the API base URL based on the device
  useEffect(() => {
    const baseUrl = 
      window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // For mobile access
    
    setApiBaseUrl(baseUrl);
  }, []);

  useEffect(() => {
    if (!studentId) {
      setError("Student ID is missing.");
      setLoading(false);
      return;
    }

    if (!apiBaseUrl) {
      return; // Wait until API base URL is set
    }

    const fetchPaymentRecords = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/fetch_payment_records.php?student_id=${studentId}`);
        const data = await response.json();

        if (data.success) {
          setPaymentRecords(data.payment_records);
        } else {
          setError(data.message || "Failed to fetch payment records.");
        }
      } catch (error) {
        setError("An error occurred while fetching the payment records.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentRecords();
  }, [studentId, apiBaseUrl]);

  // Generate PDF in landscape mode with green headers
  const generatePDF = () => {
    // Create PDF in landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Payment Records", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Add student ID
    doc.text(`Student ID: ${studentId}`, 14, 30);
    
    // Define the table structure
    const tableColumn = [
      "Name", "Strand", "Grade", "Section", "Mode", 
      "Status", "Transaction", "Date", "Total Fee", "Amount Paid", 
      "Balance", "Remarks", "Receipt No."
    ];
    
    // Convert the data for the PDF table
    const tableRows = [];
    paymentRecords.forEach((record) => {
      const balance = (parseFloat(record.total_fee) - parseFloat(record.amount_paid)).toFixed(2);
      tableRows.push([
        record.name,
        record.strand,
        record.grade_level,
        record.section,
        record.mode_of_payment,
        record.status,
        record.payment,
        record.date,
        parseFloat(record.total_fee).toLocaleString(),
        parseFloat(record.amount_paid).toLocaleString(),
        parseFloat(balance).toLocaleString(),
        record.remarks,
        record.receipt_number
      ]);
    });
    
    // Create the table with green header color
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [0, 100, 0], // Dark green header
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      columnStyles: {
        8: { halign: 'right' }, // Total Fee
        9: { halign: 'right' }, // Amount Paid
        10: { halign: 'right' }, // Balance
      },
    });
    
    // Add the latest balance at the bottom
    if (paymentRecords.length > 0) {
      const sortedRecords = [...paymentRecords].sort((a, b) => b.receipt_number - a.receipt_number);
      const latestRecord = sortedRecords[0];
      const latestBalance = (parseFloat(latestRecord.total_fee) - parseFloat(latestRecord.amount_paid)).toFixed(2);
      
      doc.setFontSize(12);
      doc.text(`Current Balance: ${parseFloat(latestBalance).toLocaleString()}`, 14, doc.lastAutoTable.finalY + 15);
    }

    doc.save("payment_records.pdf");
    setIsPDFModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = paymentRecords.map((record) => {
      const balance = (parseFloat(record.total_fee) - parseFloat(record.amount_paid)).toFixed(2);
      return {
        "Name": record.name,
        "Strand": record.strand,
        "Grade Level": record.grade_level,
        "Section": record.section,
        "Mode of Payment": record.mode_of_payment,
        "Status": record.status,
        "Transaction": record.payment,
        "Date": record.date,
        "Total Fee": parseFloat(record.total_fee),
        "Amount Paid": parseFloat(record.amount_paid),
        "Balance": parseFloat(balance),
        "Remarks": record.remarks,
        "Receipt No.": record.receipt_number
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Records");

    // Format currency columns
    ["J", "K", "L"].forEach(col => {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cell = worksheet[`${col}${row + 1}`];
        if (cell && cell.t === 'n') {
          cell.z = '"₱"#,##0.00';
        }
      }
    });

    XLSX.writeFile(workbook, "payment_records.xlsx");
    setIsExportModalOpen(false);
  };

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);
  const openPDFModal = () => setIsPDFModalOpen(true);
  const closePDFModal = () => setIsPDFModalOpen(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const sortedPaymentRecords = paymentRecords.sort((a, b) => b.receipt_number - a.receipt_number);

  const latestPayment = sortedPaymentRecords[0];

  const balance = latestPayment
    ? (parseFloat(latestPayment.total_fee) - parseFloat(latestPayment.amount_paid)).toFixed(2)
    : "0.00";

  return (
    <div className="payment-records-container-spay">
      <div className="top-controls-payment-records-spay">
        <h2 className="payment-records-title-spay">Payment Records</h2>
        <div className="buttons-group-payment-records-spay">
          <button className="pdf-button-payment-records-spay" onClick={openPDFModal}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="xls-button-payment-records-spay" onClick={openExportModal}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
        </div>
      </div>

      {paymentRecords.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        <div className="payment-records-table-container" ref={tableRef}>
        <table className="payment-records-table-spay">
          <thead>
            <tr>
              <th>NAME</th>
              <th>STRAND</th>
              <th>GRADE LEVEL</th>
              <th>SECTION</th>
              <th>MODE OF PAYMENT</th>
              <th>STATUS</th>
              <th>TRANSACTION</th>
              <th>DATE</th>
              <th>TOTAL FEE</th>
              <th>AMOUNT PAID</th>
              <th>BALANCE</th>
              <th>REMARKS</th>
              <th>RECEIPT NO.</th>
            </tr>
          </thead>
          <tbody>
            {paymentRecords.map((record, index) => {
              const recordBalance = (parseFloat(record.total_fee) - parseFloat(record.amount_paid)).toFixed(2);
              return (
                <tr key={index}>
                  <td>{record.name}</td>
                  <td>{record.strand}</td>
                  <td>{record.grade_level}</td>
                  <td>{record.section}</td>
                  <td>{record.mode_of_payment}</td>
                  <td>{record.status}</td>
                  <td>{record.payment}</td>
                  <td>{record.date}</td>
                  <td className="amount-column">₱{parseFloat(record.total_fee).toLocaleString()}</td>
                  <td className="amount-column">₱{parseFloat(record.amount_paid).toLocaleString()}</td>
                  <td className="amount-column">₱{parseFloat(recordBalance).toLocaleString()}</td>
                  <td>{record.remarks}</td>
                  <td>{record.receipt_number}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      <div className="balance-summary-spay">
        <span>Balance:</span>
        <input
          type="text"
          className="balance-input-spay"
          value={`₱${parseFloat(balance).toLocaleString()}`}
          readOnly
        />
      </div>

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="modal-confirmation-spay">
          <div className="modal-content-spay">
          <h3>Confirmation</h3>
            <p>Are you sure you want to export to Excel?</p>
            <div className="button-group-spay">
            <button className="confirm-button-spay" onClick={handleExportExcel}>
              Yes, Export
            </button>
            <button className="cancel-button-spay" onClick={closeExportModal}>
              Cancel
            </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Confirmation Modal */}
      {isPDFModalOpen && (
        <div className="modal-confirmation-spay">
          <div className="modal-content-spay">
          <h3>Confirmation</h3>
            <p>Are you sure you want to export to PDF?</p>
            <div className="button-group-spay">
            <button className="confirm-button-spay" onClick={generatePDF}>
              Yes, Export
            </button>
            <button className="cancel-button-spay" onClick={closePDFModal}>
              Cancel
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentRecords;