import React, { useState, useEffect } from "react";
import "./payment.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

const Payments = () => {
  const [payments, setPayments] = useState([]); // Store fetched payments
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredPayments, setFilteredPayments] = useState([]); 
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isExcelConfirmationOpen, setIsExcelConfirmationOpen] = useState(false); // New state for Excel confirmation modal


  const [currentPayment, setCurrentPayment] = useState({
    student_id: "", // Include student_id in the state
    name: "",
    strand: "",
    gradeLevel: "",
    section: "",
    modeOfPayment: "", // Dropdown for "Cash" and "Voucher"
    status: "Payee",
    payment: "Tuition Fee",
    date: new Date().toISOString().split("T")[0],
    totalFee: 5000,
    amountPaid: 0,
    balance: 5000,
    remarks: "PARTIAL",
    receiptNumber: "",
  });

  const fetchAllPayments = () => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    fetch(`${baseUrl}/get_all_payments.php`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setPayments(data.payments);
          setFilteredPayments(data.payments); 
        } else {
          console.error("Failed to fetch payments:", data.message);
        }
      })
      .catch((error) => console.error("Error fetching payments:", error));
};

const fetchReceiptNumber = () => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    fetch(`${baseUrl}/get_receipt.php`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          setCurrentPayment((prev) => ({
            ...prev,
            receiptNumber: data.receiptNumber || "00001",
          }));
        } else {
          console.error("Failed to fetch receipt number:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching receipt number:", error);
      });
};

useEffect(() => {
    fetchAllPayments();
    fetchReceiptNumber();
}, []);


  useEffect(() => {
    // Dynamically filter payments based on searchName
    const filtered = payments.filter((payment) =>
      payment.name.toLowerCase().includes(searchName.toLowerCase())
    );
    setFilteredPayments(filtered);
  }, [searchName, payments]);

  const handleSearchChange = (e) => {
    setSearchName(e.target.value); // Update search name
  };

  useEffect(() => {
    if (currentPayment.status === "Nonpayee") {
      setCurrentPayment((prev) => ({
        ...prev,
        balance: 0,
        remarks: "FULLY PAID",
      }));
    } else {
      const balance = currentPayment.totalFee - currentPayment.amountPaid;
      const remarks = balance === 0 ? "FULLY PAID" : "PARTIAL";

      setCurrentPayment((prev) => ({
        ...prev,
        balance: balance,
        remarks: remarks,
      }));
    }
  }, [currentPayment.amountPaid, currentPayment.status]);

  const handleAddClick = () => {
    setCurrentPayment({
      student_id: "", // Reset student_id
      name: "",
      strand: "",
      gradeLevel: "",
      section: "",
      modeOfPayment: "",
      status: "Payee",
      payment: "Tuition Fee",
      date: new Date().toISOString().split("T")[0],
      totalFee: 5000,
      amountPaid: 0,
      balance: 5000,
      remarks: "PARTIAL",
      receiptNumber: "",
    });
    setIsModalOpen(true);
    setErrorMessage(""); // Clear errors
    fetchReceiptNumber(); // Fetch receipt number for new transaction
  };

  const exportToExcel = () => {
    if (window.confirm("Do you want to export the data to Excel?")) {
      const worksheet = XLSX.utils.json_to_sheet(filteredPayments);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
      XLSX.writeFile(workbook, "payments.xlsx");
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "status" && value === "Nonpayee") {
      // Automatically set values to 0 for Nonpayee
      setCurrentPayment((prev) => ({
        ...prev,
        amountPaid: 0,
        totalFee: 0,
        balance: 0,
        remarks: "FULLY PAID", // Automatically set remarks to "FULLY PAID"
        [name]: value,
      }));
      return;
    }
  
    if (name === "amountPaid") {
      // Allow empty input and reset balance and remarks if empty
      if (value === "") {
        setCurrentPayment((prev) => ({
          ...prev,
          [name]: "", // Allow the field to be empty
          balance: prev.totalFee, // Reset balance to total fee
          remarks: "PARTIAL", // Default to PARTIAL when empty
        }));
        return;
      }
  
      // Prevent negative values
      if (parseFloat(value) < 0) {
        setErrorMessage("Amount Paid cannot be negative.");
        return;
      }
  
      // Prevent amountPaid from exceeding totalFee and prevent balance from going negative
      const amountPaid = parseFloat(value) || 0;
  
      if (amountPaid > currentPayment.totalFee) {
        // Limit amountPaid to the totalFee if it exceeds the fee
        setErrorMessage("Amount Paid cannot exceed Total Fee.");
        setCurrentPayment((prev) => ({
          ...prev,
          [name]: currentPayment.totalFee, // Set amountPaid to totalFee to prevent overpayment
          balance: 0, // Ensure balance is 0 if overpaid
          remarks: "FULLY PAID", // Set remarks to FULLY PAID
        }));
        return;
      }
  
      setErrorMessage(""); // Clear error if valid input
  
      // Update the amountPaid and calculate balance and remarks
      const balance = currentPayment.totalFee - amountPaid;
  
      setCurrentPayment((prev) => ({
        ...prev,
        [name]: value, // Keep the value as is for proper editing
        balance: balance >= 0 ? balance : 0, // Ensure balance doesn't go below 0
        remarks: balance === 0 ? "FULLY PAID" : "PARTIAL",
      }));
    } else {
      // Handle other input fields
      setCurrentPayment((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Automatically adjust remarks when balance changes
  useEffect(() => {
    if (currentPayment.balance === 0) {
      setCurrentPayment((prev) => ({
        ...prev,
        remarks: "FULLY PAID",
      }));
    } else if (currentPayment.balance > 0) {
      setCurrentPayment((prev) => ({
        ...prev,
        remarks: "PARTIAL",
      }));
    }
  }, [currentPayment.balance]);
  
  

  const handleNameBlur = () => {
    if (searchName.trim() !== "") {
      fetch(`http://localhost:8000/payment.php?name=${searchName}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.applicants.length > 0) {
            const student = data.applicants[0];
            const gradeLevel = student.grade_level.match(/\d+/)?.[0] || "";

            setCurrentPayment((prev) => ({
              ...prev,
              student_id: student.student_id, // Include student_id
              name: student.name,
              gradeLevel: gradeLevel,
              section: student.section,
              strand: student.strand,
              balance: student.latest_balance !== null ? student.latest_balance : 5000,
              totalFee: student.latest_balance !== null ? student.latest_balance : 5000,
            }));
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  };
  const confirmExcelExport = () => {
    // Close the confirmation modal
    setIsExcelConfirmationOpen(false);

    // Perform Excel export
    const worksheet = XLSX.utils.json_to_sheet(filteredPayments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "payments.xlsx");
  };

  const handleExportClick = () => {
    // Open the Excel confirmation modal
    setIsExcelConfirmationOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setSearchName(name);
    setCurrentPayment((prev) => ({
      ...prev,
      name: name,
    }));
  };

  const handleSave = () => {
    // Check if the required fields are filled out
    if (!currentPayment.name || !currentPayment.modeOfPayment) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
  
    // Allow saving if balance is 0 and remarks are "FULLY PAID"
    if (currentPayment.balance === 0 && currentPayment.remarks === "FULLY PAID") {
      setErrorMessage(""); // Clear any previous errors
      setIsConfirmationOpen(true); // Open the confirmation modal
      return;
    }
  
    // Allow saving if status is "Nonpayee"
    if (currentPayment.status === "Nonpayee") {
      setErrorMessage(""); // Clear errors
      setIsConfirmationOpen(true); // Open confirmation modal
      return;
    }
  
    // Validate amountPaid if it's not fully paid
    if (currentPayment.amountPaid <= 0 && currentPayment.remarks !== "FULLY PAID") {
      setErrorMessage("Please ensure a valid amount is entered.");
      return;
    }
  
    // If all validations pass
    setErrorMessage(""); // Clear errors if validation passes
    setIsConfirmationOpen(true); // Open confirmation modal
  };
  
  
  const confirmSave = () => {
    console.log("Saving payment with data:", currentPayment); // Debug the payload
  
    fetch("http://localhost:8000/save_payment.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentPayment), // Ensure status is included in the payload
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          fetchAllPayments(); // Refresh the payments list after saving
        } else {
          console.error("Error saving data:", data.message);
        }
      })
      .catch((error) => console.error("Error saving payment:", error));
    setIsConfirmationOpen(false);
    setIsModalOpen(false);
  };
  

  return (
    <div className="payments-container">
      <div className="header-p">
        <h2 className="payments-title">PAYMENT</h2>
      </div>
  
      <div className="top-controls-pay">
      <div className="search-and-add-pay">
      <input
          type="text"
          placeholder="Search by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)} // Update search dynamically
          />

          <button className="add-button-pay" onClick={handleAddClick}>
            Add
          </button>
          <button className="excel-button-pay" onClick={handleExportClick}>
          Export
        </button>
        </div>
      </div>
  <div className="scroll-pay">
      <table className="payments-table">
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
        {filteredPayments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.name}</td>
              <td>{payment.strand}</td>
              <td>{payment.grade_level}</td>
              <td>{payment.section}</td>
              <td>{payment.mode_of_payment}</td>
              <td>{payment.status}</td>
              <td>{payment.payment}</td>
              <td>{payment.date}</td>
              <td>{payment.total_fee}</td>
              <td>{payment.amount_paid}</td>
              <td>{payment.balance}</td>
              <td>{payment.remarks}</td>
              <td>{payment.receipt_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {isModalOpen && (
        <div className="modal-payment">
          <div className="modal-content-payment">
            <h3 className="modal-title-pay">
              {currentPayment.id ? "EDIT TRANSACTION" : "ADD TRANSACTION"}
            </h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="form-container-pay">
              <div className="form-row-pay">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={currentPayment.name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                />
              </div>
              <div className="form-row-pay">
                <label>Strand</label>
                <input
                  type="text"
                  name="strand"
                  value={currentPayment.strand}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Grade Level</label>
                <input
                  type="number"
                  name="gradeLevel"
                  value={currentPayment.gradeLevel}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={currentPayment.section}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Mode of Payment</label>
                <select
                  name="modeOfPayment"
                  value={currentPayment.modeOfPayment}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="Voucher">Voucher</option>
                </select>
              </div>
              <div className="form-row-pay">
                <label>Status</label>
                <select
                  name="status"
                  value={currentPayment.status}
                  onChange={handleInputChange}
                >
                  <option value="Payee">Payee</option>
                  <option value="Nonpayee">Nonpayee</option>
                </select>
              </div>
              <div className="form-row-pay">
                <label>Payment</label>
                <input
                  type="text"
                  name="payment"
                  value={currentPayment.payment}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={currentPayment.date}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Total Fee</label>
                <input
                  type="number"
                  name="totalFee"
                  value={currentPayment.totalFee}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Amount Paid</label>
                <input
                  type="number"
                  name="amountPaid"
                  value={currentPayment.amountPaid}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row-pay">
                <label>Balance</label>
                <input
                  type="number"
                  name="balance"
                  value={currentPayment.balance}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={currentPayment.remarks}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Receipt</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={currentPayment.receiptNumber || ""}
                  readOnly
                />
              </div>
            </div>
            <div className="button-group-pay">
              <button className="save-button-pay" onClick={handleSave}>
                Save
              </button>
              <button
                className="discard-button-pay"
                onClick={() => setIsModalOpen(false)}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
  
  {isConfirmationOpen && (
  <div className="confirmation-modal">
    <div className="confirmation-content">
      <h3 className="confirmation-title">Confirm Save</h3>
      <p className="confirmation-message">
        Are you sure you want to save this transaction?
      </p>
      <div className="confirmation-buttons">
        <button className="confirm-button" onClick={confirmSave}>
          Yes
        </button>
        <button
          className="cancel-button"
          onClick={() => setIsConfirmationOpen(false)}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
 {/* Excel Export Confirmation Modal */}
 {isExcelConfirmationOpen && (
      <div className="confirmation-modal">
        <div className="confirmation-content">
          <h3 className="confirmation-title">Confirm Export</h3>
          <p className="confirmation-message">
            Are you sure you want to export the data to Excel?
          </p>
          <div className="confirmation-buttons">
            <button className="confirm-button" onClick={confirmExcelExport}>
              Yes
            </button>
            <button
              className="cancel-button"
              onClick={() => setIsExcelConfirmationOpen(false)}
            >
              No
            </button>
          </div>
        </div>
        </div>
    )}
  </div>
);
}

export default Payments;
