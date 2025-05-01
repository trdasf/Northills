import React, { useState, useEffect, useRef } from "react";
import "./subjects.css";
import { FaEdit, FaTrash, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]); // Start with an empty array
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [formErrors, setFormErrors] = useState({ strand: false, teacher: false });
  const [sections, setSections] = useState([]);
  const [strands, setStrands] = useState([]); // State to store strands
  const [gradeFilter, setGradeFilter] = useState("all"); // Default to show all grades
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState(""); // "pdf" or "excel"
  const tableRef = useRef(null);
  
  const [currentSubject, setCurrentSubject] = useState({
    description: "",
    codeNo: "",
    semester: "1ST", // Default semester
    teacher: "",
    schedule: "",
    grade: 11, // Default grade 11
    section: "",
    strand: "",
    unit: 3, // Default unit
    days: "", // Days input by the user
    startTime: "8:00am", // Default start time
    endTime: "9:00am", // Default end time
  });

  const fetchData = async () => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    try {
      const subjectsResponse = await fetch(`${baseUrl}/subjects.php`);
      const strandsResponse = await fetch(`${baseUrl}/subjects.php?type=strands`);
      const facultyResponse = await fetch(`${baseUrl}/subjects.php?type=faculty`);
      const sectionsResponse = await fetch(`${baseUrl}/subjects.php?type=sections`);

      const subjectsData = await subjectsResponse.json();
      const strandsData = await strandsResponse.json();
      const facultyData = await facultyResponse.json();
      const sectionsData = await sectionsResponse.json();

      setSubjects(subjectsData);
      setStrands(strandsData);
      setFilteredSubjects(subjectsData);
      setFaculty(facultyData);
      setSections(sectionsData); // Set sections
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when grade filter or search term changes
  useEffect(() => {
    let filtered = subjects;
    
    // Apply grade filter
    if (gradeFilter !== "all") {
      const gradeValue = parseInt(gradeFilter);
      filtered = filtered.filter(subject => parseInt(subject.grade) === gradeValue);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.codeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.teacher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredSubjects(filtered);
  }, [subjects, gradeFilter, searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "teacher") {
      // Find the faculty_id based on the facultyName (value)
      const selectedFaculty = faculty.find((fac) => fac.facultyName === value);
      setCurrentSubject({
        ...currentSubject,
        [name]: value,
        faculty_id: selectedFaculty ? selectedFaculty.faculty_id : null, // Map facultyName to faculty_id
      });
    } else {
      setCurrentSubject({
        ...currentSubject,
        [name]: value,
      });
    }

    // Validate required fields
    if (name === "strand" || name === "teacher" || name === "faculty_id") {
      setFormErrors({ ...formErrors, [name]: value === "" });
    }
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleGradeFilterChange = (e) => {
    setGradeFilter(e.target.value);
  };

  const getEndTimeOptions = (startTime) => {
    if (!startTime) return []; // Return an empty array if startTime is undefined

    const timeSlots = [];
    for (let hour = 8; hour <= 17; hour++) {
        const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour < 12 ? "am" : "pm";
        timeSlots.push(`${hourFormatted}:00${ampm}`, `${hourFormatted}:30${ampm}`);
    }

    const match = startTime.match(/(\d+):(\d+)(am|pm)/);
    if (!match) return []; // Return an empty array if the format is invalid

    const startHour = parseInt(match[1]);
    const startMinute = parseInt(match[2]);
    const startPeriod = match[3];

    let validEndTimes = [];

    if (startPeriod === "am" && startHour < 12) {
        validEndTimes = timeSlots.filter((time) => {
            const hour = parseInt(time.match(/(\d+):(\d+)(am|pm)/)[1]);
            const minute = parseInt(time.match(/(\d+):(\d+)(am|pm)/)[2]);
            const period = time.match(/(\d+):(\d+)(am|pm)/)[3];
            return (
                (hour > startHour || (hour === startHour && minute > startMinute)) &&
                (period === "am" || (hour <= 12 && period === "pm"))
            );
        });
    } else if (startPeriod === "pm" && startHour >= 1) {
        validEndTimes = timeSlots.filter((time) => {
            const hour = parseInt(time.match(/(\d+):(\d+)(am|pm)/)[1]);
            const minute = parseInt(time.match(/(\d+):(\d+)(am|pm)/)[2]);
            const period = time.match(/(\d+):(\d+)(am|pm)/)[3];
            return (
                (hour > startHour || (hour === startHour && minute > startMinute)) &&
                period === "pm"
            );
        });
    }

    return validEndTimes;
  };

  const handleEditClick = (subject) => {
    const scheduleRegex = /(.*)\s\((\d{1,2}:\d{2}(am|pm))–(\d{1,2}:\d{2}(am|pm))\)/;
    const match = subject.schedule.match(scheduleRegex);

    setCurrentSubject({
        subject_id: subject.subject_id, 
        description: subject.description || "",
        codeNo: subject.codeNo || "",
        semester: subject.semester || "1ST",
        teacher: subject.teacher || "",
        faculty_id: subject.faculty_id || "", 
        grade: subject.grade || 11,
        section: subject.section || "",
        strand: subject.strand || "",
        unit: subject.unit || 3,
        days: match ? match[1] : "", 
        startTime: match ? match[2] : "8:00am", 
        endTime: match ? match[4] : "9:00am",
    });

    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setCurrentSubject({
      description: "",
      codeNo: "",
      semester: "1ST", // Default semester
      teacher: "",
      schedule: "",
      grade: 11, // Default grade 11
      section: "",
      strand: "",
      unit: 3, // Default unit
      days: "", // Days input by the user
      startTime: "8:00am", // Default start time
      endTime: "9:00am", // Default end time
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleStrandChange = async (e) => {
    const selectedStrand = e.target.value;
    setCurrentSubject({ ...currentSubject, strand: selectedStrand, section: "" }); // Reset section
  
    try {
      const response = await fetch(`http://localhost:8000/subjects.php?type=sections&strand=${selectedStrand}`);
      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };
  
  const uniqueStrands = [...new Set(strands.map(strand => strand.strand))]; // Ensure uniqueness of strands
  
  const handleSave = async () => {
    const trimmedSchedule = `${currentSubject.days} (${currentSubject.startTime}–${currentSubject.endTime})`;
  
    if (!currentSubject.description || !currentSubject.codeNo || !currentSubject.faculty_id) {
      alert("All required fields must be filled out.");
      return;
    }
  
    const payload = {
      ...currentSubject,
      schedule: trimmedSchedule,
    };
  
    try {
      const response = await fetch("http://localhost:8000/subjects.php", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh data after saving
        alert("Subject saved successfully.");
        setIsModalOpen(false);
      } else {
        alert(`Error saving subject: ${data.message}`);
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      alert("Failed to save the subject.");
    }
  };
  
  const handleDeleteClick = async (subject_id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this subject?");
    
    if (confirmDelete) {
      try {
        const response = await fetch("http://localhost:8000/subjects.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id }),
        });
        const data = await response.json();
  
        console.log('Delete response:', data); // Log the response data for debugging
  
        if (data.success) {
          // After deletion, fetch the updated data directly
          const subjectsResponse = await fetch("http://localhost:8000/subjects.php");
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData);
          setFilteredSubjects(subjectsData); // Update filtered subjects
          alert("Subject deleted successfully.");
        } else {
          alert("Error deleting subject.");
        }
      } catch (error) {
        console.error("Error deleting subject:", error);
        alert("Failed to delete the subject.");
      }
    }
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentSubject({
      description: "",
      codeNo: "",
      semester: "1ST", // Default semester
      teacher: "",
      schedule: "",
      grade: 11, // Default grade 11
      section: "",
      strand: "",
      unit: 3, // Default unit
      days: "", // Reset days
      startTime: "8:00am", // Default start time
      endTime: "9:00am", // Default end time
    });
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
    doc.text("Subjects List", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    
    // Filter label based on selection


    // Define the table structure
    const tableColumn = ["Description", "Code No.", "Semester", "Faculty", "Schedule", "Grade", "Section", "Strand", "Units"];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredSubjects.forEach(subject => {
      const subjectData = [
        subject.description,
        subject.codeNo,
        subject.semester,
        subject.teacher,
        subject.schedule,
        subject.grade,
        subject.section,
        subject.strand,
        subject.unit
      ];
      tableRows.push(subjectData);
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

    doc.save("subjects.pdf");
    setIsExportModalOpen(false);
  };

  // Function to export to Excel
  const exportToExcel = () => {
    // Prepare data for Excel export
    const worksheet = XLSX.utils.json_to_sheet(
      filteredSubjects.map(subject => ({
        DESCRIPTION: subject.description,
        "CODE NO.": subject.codeNo,
        SEMESTER: subject.semester,
        FACULTY: subject.teacher,
        SCHEDULE: subject.schedule,
        "GRADE LEVEL": subject.grade,
        SECTION: subject.section,
        STRAND: subject.strand,
        UNITS: subject.unit
      }))
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");

    // Generate Excel file and save
    XLSX.writeFile(workbook, "subjects.xlsx");
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
    <div className="subjects-container-sub">
      <div className="header-subjects-sub">
        <h2 className="subjects-title-sub">Subjects</h2>
      </div>
      <div className="top-controls-subjects-sub">
        <div className="search-and-add-subjects-sub">
          <input
            type="text"
            className="search-input-subjects-sub"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="subjects-filter-sub"
            value={gradeFilter}
            onChange={handleGradeFilterChange}
          >
            <option value="all">All Grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
          <button className="add-button-subjects-sub" onClick={handleAddClick}>Add</button>
          <button className="subjects-pdf-button-sub" onClick={handlePdfClick}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="subjects-excel-button-sub" onClick={handleExcelClick}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
        </div>
      </div>
      <div className="subjects-table-container-sub" ref={tableRef}>
        <table className="subjects-table-sub">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th>CODE NO.</th>
              <th>SEMESTER</th>
              <th>FACULTY</th>
              <th>SCHEDULE</th>
              <th>GRADE LEVEL</th>
              <th>SECTION</th>
              <th>STRAND</th>
              <th>UNITS</th>
              <th>EDIT</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject) => (
              <tr key={subject.subject_id}>
                <td>{subject.description}</td>
                <td>{subject.codeNo}</td>
                <td>{subject.semester}</td>
                <td>{subject.teacher}</td>
                <td>{subject.schedule}</td>
                <td>{subject.grade}</td>
                <td>{subject.section}</td>
                <td>{subject.strand}</td>
                <td>{subject.unit}</td>
                <td>
                  <FaEdit
                    className="edit-icon-sub"
                    onClick={() => handleEditClick(subject)}
                    style={{ cursor: "pointer", color: "#006400" }}
                  />
                </td>
                <td>
                  <FaTrash
                    className="delete-icon-sub"
                    onClick={() => handleDeleteClick(subject.subject_id)}
                    style={{ cursor: 'pointer', color: '#B22222' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subject Edit/Add Modal */}
      {isModalOpen && (
        <div className="subjects-modal-sub">
          <div className="subjects-modal-content-sub">
            <h3 className="subjects-modal-title-sub">{isEditMode ? "EDIT SUBJECT" : "ADD SUBJECT"}</h3>
            <div className="subjects-modal-form-sub">
              <div className="subjects-form-group-sub">
                <label>
                  Description
                  <input
                    type="text"
                    name="description"
                    value={currentSubject.description}
                    onChange={handleInputChange}
                    placeholder="Enter subject description"
                  />
                </label>
                <label>
                  Code No.
                  <input
                    type="text"
                    name="codeNo"
                    value={currentSubject.codeNo}
                    onChange={handleInputChange}
                    placeholder="Enter code number"
                  />
                </label>
                <label>
                  Faculty
                  <select
                    name="teacher"
                    value={currentSubject.teacher || ""}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Select Faculty</option>
                    {faculty.map((fac) => (
                      <option key={fac.faculty_id} value={fac.facultyName}>
                        {fac.facultyName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Grade Level
                  <select
                    name="grade"
                    value={currentSubject.grade}
                    onChange={handleInputChange}
                  >
                    <option value={11}>11</option>
                    <option value={12}>12</option>
                  </select>
                </label>
              </div>

              <div className="subjects-form-group-sub">
                <label>
                  Strand
                  <select
                    name="strand"
                    value={currentSubject.strand}
                    onChange={handleStrandChange}
                  >
                    <option value="" disabled>Select Strand</option>
                    {uniqueStrands.map((strand) => (
                      <option key={strand} value={strand}>
                        {strand}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Section
                  <select
                    name="section"
                    value={currentSubject.section}
                    onChange={handleInputChange}
                    disabled={!sections.length}
                  >
                    <option value="" disabled>Select Section</option>
                    {sections.map((sec, index) => (
                      <option key={index} value={sec.section}>
                        {sec.section}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Units
                  <select
                    name="unit"
                    value={currentSubject.unit}
                    onChange={handleInputChange}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </label>

                <label>
                  Semester
                  <select
                    name="semester"
                    value={currentSubject.semester}
                    onChange={handleInputChange}
                  >
                    <option value="1ST">1ST</option>
                    <option value="2ND">2ND</option>
                  </select>
                </label>
              </div>

              <div className="subjects-form-group-sub">
                <label>
                  Days (e.g. MWF, MTh, M, W, F)
                  <input
                    type="text"
                    name="days"
                    value={currentSubject.days}
                    onChange={handleInputChange}
                    placeholder="Enter days (e.g., MWF)"
                  />
                </label>
              </div>

              <div className="subjects-form-group-sub">
                <label>
                  Start Time
                  <select
                    name="startTime"
                    value={currentSubject.startTime || "8:00am"}
                    onChange={handleInputChange}
                  >
                    {Array.from({ length: 20 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const minute = i % 2 === 0 ? "00" : "30";
                      const ampm = hour < 12 ? "am" : "pm";
                      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                      return `${displayHour}:${minute}${ampm}`;
                    }).map(timeSlot => (
                      <option key={timeSlot} value={timeSlot}>{timeSlot}</option>
                    ))}
                  </select>
                </label>
                <label>
                  End Time
                  <select
                    name="endTime"
                    value={currentSubject.endTime}
                    onChange={handleInputChange}
                  >
                    {getEndTimeOptions(currentSubject.startTime).map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="subjects-button-group-sub">
              <button onClick={handleSave} className="subjects-save-button-sub">
                {isEditMode ? "Update" : "Add"}
              </button>
              <button onClick={handleCancel} className="subjects-discard-button-sub">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="subjects-modal-sub">
          <div className="subjects-export-modal-content-sub">
            <h3 className="subjects-modal-title-sub">Export Confirmation</h3>
            <p className="subjects-export-message-sub">
              Are you sure you want to export the current subjects list to {exportType === "pdf" ? "PDF" : "Excel"}?
            </p>
            <div className="subjects-button-group-sub">
              <button onClick={handleConfirmExport} className="subjects-save-button-sub">
                Export
              </button>
              <button onClick={handleCloseExportModal} className="subjects-discard-button-sub">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;