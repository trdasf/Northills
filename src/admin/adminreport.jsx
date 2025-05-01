import React, { useState, useEffect } from "react";
import './adminreport.css';
import { FaFilter } from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const AdminReport = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showReportTable, setShowReportTable] = useState(false);
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [reportTitle, setReportTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  
  // Store original filter params for cancel operation
  const [originalFilterParams, setOriginalFilterParams] = useState({
    name: "",
    municipality: "",
    birthday: "",
    religion: "",
    gender: "",
    strand: "",
    section: "",
    yearLevel: "",
    schoolYear: "",
    ageFrom: "",
    ageTo: "",
    grades: ""
  });
  
  const [filterParams, setFilterParams] = useState({
    name: "",
    municipality: "",
    birthday: "",
    religion: "",
    gender: "",
    strand: "",
    section: "",
    yearLevel: "",
    schoolYear: "",
    ageFrom: "",
    ageTo: "",
    grades: ""
  });

  // Options for dropdowns
  const genderOptions = ["Male", "Female"];
  const [strandOptions, setStrandOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const yearLevelOptions = ["11", "12"];
  const [schoolYearOptions, setSchoolYearOptions] = useState([]);
  
  // Fetch strand, section, and school year options from the database
  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        console.log("Fetching options from server...");
        const response = await axios.get("http://mediumaquamarine-dunlin-251088.hostingersite.com/search_students.php");
        console.log("Response:", response.data);
        
        if (response.data.success) {
          if (response.data.strandOptions && response.data.strandOptions.length > 0) {
            setStrandOptions(response.data.strandOptions);
          } else {
            // Fallback options if server doesn't return any
            setStrandOptions(["STEM", "ABM", "HUMSS", "GAS", "ICT", "HE"]);
          }
          
          if (response.data.sectionOptions && response.data.sectionOptions.length > 0) {
            setSectionOptions(response.data.sectionOptions);
          } else {
            // Fallback options if server doesn't return any
            setSectionOptions(["11-A", "11-B", "12-A", "12-B"]);
          }
          
          if (response.data.schoolYearOptions && response.data.schoolYearOptions.length > 0) {
            setSchoolYearOptions(response.data.schoolYearOptions);
          } else {
            // Fallback options if server doesn't return any
            setSchoolYearOptions(["2023-2024", "2024-2025"]);
          }
        } else {
          // Set default values if there's an error
          setStrandOptions(["STEM", "ABM", "HUMSS", "GAS", "ICT", "HE"]);
          setSectionOptions(["11-A", "11-B", "12-A", "12-B"]);
          setSchoolYearOptions(["2023-2024", "2024-2025"]);
        }
      } catch (error) {
        console.error("Error fetching options:", error);
        // Fallback options if server request fails
        setStrandOptions(["STEM", "ABM", "HUMSS", "GAS", "ICT", "HE"]);
        setSectionOptions(["11-A", "11-B", "12-A", "12-B"]);
        setSchoolYearOptions(["2023-2024", "2024-2025"]);
      } finally {
        setOptionsLoading(false);
      }
    };
    
    fetchOptions();
  }, []);
  
  const handleFilterClick = () => {
    setShowFilterOptions(!showFilterOptions);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterParams({
      ...filterParams,
      [name]: value
    });
  };
  
  // Generate a descriptive report title based on applied filters
  // Updated generateAutoReportTitle function to create more readable, natural-sounding titles
const generateAutoReportTitle = () => {
  // Default title start
  let title = "Student Report";
  
  // Collection of filter information
  const filterInfo = {
    gender: filterParams.gender,
    ageRange: filterParams.ageFrom && filterParams.ageTo ? `${filterParams.ageFrom}-${filterParams.ageTo} years old` : "",
    yearLevel: filterParams.yearLevel ? `Grade ${filterParams.yearLevel}` : "",
    strand: filterParams.strand || "",
    section: filterParams.section || "",
    schoolYear: filterParams.schoolYear ? `S.Y. ${filterParams.schoolYear}` : "",
    grades: filterParams.grades ? `with Grade ${filterParams.grades}` : "",
    name: filterParams.name || "",
    municipality: filterParams.municipality || "",
    religion: filterParams.religion || "",
    birthday: filterParams.birthday || ""
  };
  
  // Build title for specific student search
  if (filterInfo.name) {
    return `Student Information: ${filterInfo.name}`;
  }
  
  // Build comprehensive title based on active filters
  const titleParts = [];
  
  // Gender part
  if (filterInfo.gender) {
    titleParts.push(`${filterInfo.gender} students`);
  }
  
  // Age range part
  if (filterInfo.ageRange) {
    titleParts.push(filterInfo.ageRange);
  }
  
  // Year level, strand and section part - combine these if present
  const academicInfo = [];
  if (filterInfo.yearLevel) {
    academicInfo.push(filterInfo.yearLevel);
  }
  
  if (filterInfo.strand) {
    if (academicInfo.length > 0) {
      academicInfo[academicInfo.length - 1] += `-${filterInfo.strand}`;
    } else {
      academicInfo.push(filterInfo.strand);
    }
  }
  
  if (filterInfo.section && !academicInfo.includes(filterInfo.section)) {
    academicInfo.push(filterInfo.section);
  }
  
  if (academicInfo.length > 0) {
    titleParts.push(academicInfo.join(" "));
  }
  
  // School year part
  if (filterInfo.schoolYear) {
    titleParts.push(filterInfo.schoolYear);
  }
  
  // Municipality part
  if (filterInfo.municipality) {
    titleParts.push(`from ${filterInfo.municipality}`);
  }
  
  // Religion part
  if (filterInfo.religion) {
    titleParts.push(`with ${filterInfo.religion} religion`);
  }
  
  // Grades part
  if (filterInfo.grades) {
    titleParts.push(filterInfo.grades);
  }
  
  // Birthday part
  if (filterInfo.birthday) {
    const formattedDate = new Date(filterInfo.birthday).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    titleParts.push(`born on ${formattedDate}`);
  }
  
  // Combine all parts into a cohesive title
  if (titleParts.length > 0) {
    title += ": " + titleParts.join(" ");
  }
  
  return title;
};
  
  const handleOpenModal = () => {
    // Store the current filter parameters before opening the modal
    setOriginalFilterParams({...filterParams});
    setIsModalOpen(true);
  };
  
  const handleAddFilter = async () => {
    setLoading(true);
    setIsModalOpen(false);
    
    try {
      // Create the query string from filter parameters
      const params = new URLSearchParams();
      
      // Add only non-empty parameters to the query
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key]) {
          params.append(key, filterParams[key]);
        }
      });
      
      const response = await axios.get(`http://localhost:8000/search_students.php?${params.toString()}`);
      
      if (response.data.success) {
        setStudents(response.data.students);
        setShowReportTable(true);
        
        // Generate automatic report title based on filters
        const autoTitle = generateAutoReportTitle();
        setReportTitle(autoTitle);
      } else {
        alert("Error fetching data: " + response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    // Restore the original filter parameters when the modal is closed without applying
    setFilterParams({...originalFilterParams});
    setIsModalOpen(false);
  };

  const openGenerateReportModal = () => {
    setIsGenerateReportModalOpen(true);
  };

  const closeGenerateReportModal = () => {
    setIsGenerateReportModalOpen(false);
  };

  const handleGenerateReport = async (format) => {
    if (!reportTitle) {
      // If somehow the report title is empty, generate one automatically
      const autoTitle = generateAutoReportTitle();
      setReportTitle(autoTitle);
      
      if (!autoTitle) {
        alert("Please enter a report title");
        return;
      }
    }

    // Get current date and time for the report
    const formattedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (format === "pdf") {
      generatePDF(formattedDate);
    } else if (format === "excel") {
      generateExcel(formattedDate);
    } else if (format === "csv") {
      generateCSV();
    }
    
    closeGenerateReportModal();
  };

  const generatePDF = async (formattedDate) => {
    // Determine if we need landscape orientation based on column count
    const columns = getTableColumns();
    const orientation = columns.length > 4 ? 'landscape' : 'portrait';
    
    // Create PDF with proper orientation
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    const tableData = students.map((student, index) => {
      return [index + 1, ...columns.map(column => getStudentValue(student, column))];
    });
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    try {
      // Define positions and sizes based on orientation
      const headerY = 20;
      const logoSize = 23; // Smaller logo (23mm)
      
      // Set logo position based on orientation
      let logoX, logoY;
      if (orientation === 'landscape') {
        logoX = 60; // Position logo for landscape
        logoY = 7; // Position from top for landscape
      } else {
        logoX = 20; // Position logo for portrait
        logoY = 7;  // Position from top for portrait
      }
      
      // Try to load the logo image
      const logoPath = "/src/assets/cnalogo.png";
      console.log("Attempting to load logo from:", logoPath);
      
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous"; // To handle CORS issues
        logoImg.src = logoPath;
        
        // Create a promise to handle image loading
        await new Promise((resolve) => {
          logoImg.onload = () => {
            console.log("Logo loaded successfully");
            try {
              // Add logo to PDF
              doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize);
              console.log("Logo added to PDF");
            } catch (err) {
              console.warn("Could not add logo to PDF:", err);
            } finally {
              resolve();
            }
          };
          
          logoImg.onerror = () => {
            console.warn("Could not load logo from:", logoPath);
            resolve(); // Continue without logo
          };
          
          // Set a timeout in case image loading hangs
          setTimeout(resolve, 2000);
        });
      } catch (imgError) {
        console.warn("Logo processing error:", imgError);
        // Continue without logo
      }
      
      // School header (centered)
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text("NORTHHILLS COLLEGE OF ASIA (NCA), INC.", pageWidth / 2, headerY, { align: 'center' });
      
      // Location (centered)
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text("Daet, Camarines Norte", pageWidth / 2, headerY + 10, { align: 'center' });
      
      // Report title (centered, bold, green color)
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 128, 0); // Green color (RGB)
      doc.text(reportTitle.toUpperCase(), pageWidth / 2, headerY + 40, { align: 'center' });
      
      // Reset text color for rest of document
      doc.setTextColor(0, 0, 0);
      
      // Add the table
      doc.autoTable({
        head: [["NO.", ...columns]],
        body: tableData,
        startY: headerY + 60,
        theme: 'grid',
        styles: {
          fontSize: 8, // Font size of 8 for table content
          cellPadding: 3,
          lineWidth: 0.2,
          lineColor: [80, 80, 80]
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.2,
          lineColor: [80, 80, 80]
        }
      });
      
      // Add admin and current date/time information
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Admin", pageWidth - 50, finalY);
      doc.text(formattedDate, pageWidth - 50, finalY + 10);
      
      // Save the PDF
      doc.save(`${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF report");
    }
  };

  const generateExcel = (formattedDate) => {
    try {
      const columns = getTableColumns();
      
      // Header row with title and school info
      const wsData = [
        ["NORTHHILLS COLLEGE OF ASIA (NCA), INC."],
        ["Daet, Camarines Norte"],
        [""],
        [reportTitle.toUpperCase()],
        [""],
        ["NO.", ...columns]
      ];
      
      // Data rows
      students.forEach((student, index) => {
        wsData.push([
          index + 1,
          ...columns.map(column => getStudentValue(student, column))
        ]);
      });
      
      // Admin and date info
      wsData.push([]);
      wsData.push(["Admin", formattedDate]);
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = [
        { wch: 5 }, // NO column
        ...columns.map(() => ({ wch: 20 })) // Data columns
      ];
      ws['!cols'] = colWidths;
      
      // Create a new workbook and append the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      
      // Generate Excel file
      XLSX.writeFile(wb, `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("An error occurred while generating the Excel report");
    }
  };

  // Generate CSV using native browser features instead of react-csv
  const generateCSV = () => {
    try {
      const columns = getTableColumns();
      
      // Create CSV header row
      let csvContent = "NO.," + columns.join(",") + "\n";
      
      // Add data rows
      students.forEach((student, index) => {
        const row = [
          index + 1,
          ...columns.map(column => {
            // Ensure values with commas are properly quoted
            const value = getStudentValue(student, column);
            return value.includes(",") ? `"${value}"` : value;
          })
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Add footer with current time
      const currentTime = new Date().toLocaleString();
      csvContent += "\nAdmin," + currentTime;
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("An error occurred while generating the CSV report");
    }
  };

  // Function to determine which columns to show in the table based on search parameters
 // Function to determine which columns to show in the table based on search parameters
const getTableColumns = () => {
  // Always include name
  const columns = ["NAME"];
  
  // Special case for name-only search
  if (filterParams.name && 
      !filterParams.municipality && 
      !filterParams.birthday && 
      !filterParams.religion && 
      !filterParams.gender && 
      !filterParams.strand && 
      !filterParams.section && 
      !filterParams.yearLevel && 
      !filterParams.schoolYear && 
      !filterParams.ageFrom && 
      !filterParams.ageTo && 
      !filterParams.grades) {
    return ["NAME", "EMAIL", "GRADE LEVEL", "STRAND", "SECTION"];
  }
  
  // For each filter, add the corresponding column
  if (filterParams.name) columns.push("EMAIL"); // Always add email if name is provided
  if (filterParams.municipality) columns.push("MUNICIPALITY");
  if (filterParams.birthday) columns.push("BIRTHDAY");
  if (filterParams.religion) columns.push("RELIGION");
  if (filterParams.gender) columns.push("GENDER");
  if (filterParams.strand) columns.push("STRAND");
  if (filterParams.section) columns.push("SECTION");
  if (filterParams.yearLevel) columns.push("GRADE LEVEL");
  if (filterParams.schoolYear) columns.push("SCHOOL YEAR");
  if (filterParams.ageFrom && filterParams.ageTo) columns.push("AGE");
  if (filterParams.grades) columns.push("GRADES");
  
  return columns;
};

  // Function to get the value for a specific column and student
  const getStudentValue = (student, column) => {
    switch(column) {
      case "NAME":
        return `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name.charAt(0) + '.' : ''}`;
      case "EMAIL":
        return student.email || '-';
      case "GENDER":
        return student.gender || '-';
      case "BIRTHDAY":
        return student.birthday || '-';
      case "RELIGION":
        return student.religion || '-';
      case "MUNICIPALITY":
        return student.municipality || '-';
      case "STRAND":
        return student.strand_track || '-';
      case "SECTION":
        return student.section || '-';
      case "GRADE LEVEL":
        return student.grade_level || '-';
      case "SCHOOL YEAR":
        return student.school_year || '-';
      case "AGE":
        return student.age || '-';
      case "GRADES":
        return student.final_grade ? Math.round(student.final_grade) : '-';
      default:
        return '-';
    }
  };

  return (
    <div className="admin-report-container-ar">
      <div className="header-report-ar">
        <h2>STUDENT REPORTS</h2>
        <div className="header-actions-ar">
          <div className="filter-dropdown-ar">
            <FaFilter className="filter-icon-ar" onClick={handleFilterClick} />
            {showFilterOptions && (
              <div className="filter-options-ar">
                <button onClick={handleOpenModal}>STUDENT FILTER</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isModalOpen && (
        <div className="modal-overlay-ar">
          <div className="modal-ar">
            <h3>STUDENT FILTER</h3>
            <div className="form-ar">
              <div className="form-group-ar">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Enter name" 
                  value={filterParams.name}
                  onChange={handleInputChange}
                />
                <label>Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  placeholder="Enter municipality"
                  value={filterParams.municipality}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-ar">
                <label>Birthday</label>
                <input 
                  type="date" 
                  name="birthday"
                  value={filterParams.birthday}
                  onChange={handleInputChange}
                />
                <label>Religion</label>
                <input
                  type="text"
                  name="religion"
                  placeholder="Enter religion"
                  value={filterParams.religion}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-ar">
                <label>Gender</label>
                <select 
                  name="gender"
                  value={filterParams.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select gender</option>
                  {genderOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <label>Age</label>
                <div className="age-group-ar">
                  <select
                    name="ageFrom"
                    value={filterParams.ageFrom}
                    onChange={handleInputChange}
                  >
                    <option value="">From</option>
                    {Array.from({ length: 10 }, (_, i) => i + 15).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                  <span>to</span>
                  <select
                    name="ageTo"
                    value={filterParams.ageTo}
                    onChange={handleInputChange}
                  >
                    <option value="">To</option>
                    {Array.from({ length: 10 }, (_, i) => i + 15).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group-ar">
                <label>Strand</label>
                <select
                  name="strand"
                  value={filterParams.strand}
                  onChange={handleInputChange}
                >
                  <option value="">Select strand</option>
                  {optionsLoading ? (
                    <option value="" disabled>Loading strands...</option>
                  ) : strandOptions.length > 0 ? (
                    strandOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  ) : (
                    <option value="" disabled>No strands available</option>
                  )}
                </select>
                <label>Section</label>
                <select
                  name="section"
                  value={filterParams.section}
                  onChange={handleInputChange}
                >
                  <option value="">Select section</option>
                  {optionsLoading ? (
                    <option value="" disabled>Loading sections...</option>
                  ) : sectionOptions.length > 0 ? (
                    sectionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  ) : (
                    <option value="" disabled>No sections available</option>
                  )}
                </select>
              </div>
              <div className="form-group-ar">
                <label>Year level</label>
                <select
                  name="yearLevel"
                  value={filterParams.yearLevel}
                  onChange={handleInputChange}
                >
                  <option value="">Select year level</option>
                  {yearLevelOptions.map(option => (
                    <option key={option} value={option}>Grade {option}</option>
                  ))}
                </select>
                <label>S.Y.</label>
                <select
                  name="schoolYear"
                  value={filterParams.schoolYear}
                  onChange={handleInputChange}
                >
                  <option value="">Select S.Y.</option>
                  {optionsLoading ? (
                    <option value="" disabled>Loading school years...</option>
                  ) : schoolYearOptions.length > 0 ? (
                    schoolYearOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  ) : (
                    <option value="" disabled>No school years available</option>
                  )}
                </select>
              </div>
              <div className="form-group-ar">
                <label>Grades</label>
                <input
                  type="number"
                  name="grades"
                  placeholder="Enter grade (e.g. 85)"
                  value={filterParams.grades}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            </div>
            <div className="report-button-group-ar">
              <button className="apply-filter-button-ar" onClick={handleAddFilter}>
                {loading ? "Loading..." : "APPLY FILTER"}
              </button>
              <button className="close-button-ar" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {showReportTable && (
        <div className="report-table-container-ar">
          {loading ? (
            <div className="loading-indicator">Loading data...</div>
          ) : students.length > 0 ? (
            <>
              <table className="report-table-ar">
                <thead>
                  <tr>
                    <th>NO.</th>
                    {getTableColumns().map((column, index) => (
                      <th key={index}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.student_id || index}>
                      <td>{index + 1}</td>
                      {getTableColumns().map((column, colIndex) => (
                        <td key={colIndex}>{getStudentValue(student, column)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="generate-report-section">
                <input 
                  type="text" 
                  placeholder="Title Report" 
                  className="report-title-input" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
                <button className="generate-report-button-ar" onClick={openGenerateReportModal}>GENERATE REPORT</button>
              </div>
            </>
          ) : (
            <div className="no-results">No students found matching your criteria.</div>
          )}
        </div>
      )}

      {/* Generate Report Modal */}
      {isGenerateReportModalOpen && (
        <div className="modal-overlay-ar">
          <div className="generate-report-modal">
            <h3>GENERATE REPORT</h3>
            <div className="generate-report-form">
              <div className="form-group-ar">
                <label>Report Title <span className="required">*</span></label>
                <input 
                  type="text" 
                  placeholder="Enter report title" 
                  className="report-modal-input" 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group-ar">
                <label>Format <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select className="report-modal-input" id="report-format">
                    <option value="">Select format</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
              <div className="generate-report-actions">
                <button 
                  className="generate-btn" 
                  onClick={() => {
                    const format = document.getElementById('report-format').value;
                    if (!format) {
                      alert("Please select a format");
                      return;
                    }
                    if (!reportTitle) {
                      alert("Please enter a report title");
                      return;
                    }
                    handleGenerateReport(format);
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
            <button className="close-modal-btn" onClick={closeGenerateReportModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReport;