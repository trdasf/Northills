import React, { useState, useEffect } from "react";
import './studentreportlists.css';
import { TbReportAnalytics } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';

const StudentReportLists = () => {
  const navigate = useNavigate();
  const [studentGrade, setStudentGrade] = useState(11); // Default grade filter
  const [reportList, setReportList] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for the search term

  const fetchStudents = async () => {
    const baseUrl = window.location.hostname === "localhost"
        ? "http://mediumaquamarine-dunlin-251088.hostingersite.com"
        : "http://192.168.1.10:8000"; // Adjust for mobile access

    try {
        const response = await fetch(`${baseUrl}/fetch_students.php?grade_level=${studentGrade}`);
        const data = await response.json();
        
        if (data.success) {
            setReportList(data.students);
        } else {
            console.error("Failed to fetch students:", data.message);
            setReportList([]); // Clear the list on failure
        }
    } catch (error) {
        console.error("Error fetching students:", error);
    }
};


  useEffect(() => {
    fetchStudents();
  }, [studentGrade]);

  const handleStudentGradeChange = (event) => {
    setStudentGrade(Number(event.target.value)); // Ensure the value is a number
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Update search term on input change
  };

  const reportlist = (student_id) => {
    navigate('/reports', { state: { student_id } }); // Pass student_id via state
  };

  // Filter the reportList based on the search term
  const filteredReportList = reportList.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    student.strand_track.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="report-list-container-rl">
      <div className="header-rl">
        <h2 className="application-title-rl">Students List</h2>
        <p className="total-label-rl">Total:</p>
        <span className="total-count-rl">{filteredReportList.length}</span>
      </div>

      {/* Controls Section */}
      <div className="top-controls-reportlist">
        <div className="reportlist-searchbar">
          <input
            type="text"
            placeholder="Search"
            className="search-bar"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="grade-dropdown-rl"
            value={studentGrade}
            onChange={handleStudentGradeChange}
          >
            <option value={11}>Grade 11</option>
            <option value={12}>Grade 12</option>
          </select>
        </div>
        <button className="pdf-button-reportlist">PDF</button>
      </div>

      <table className="application-table-rl">
        <thead>
          <tr>
            <th>NO.</th>
            <th>NAME</th>
            <th>STRAND</th>
            <th>EMAIL</th>
            <th>GRADE LEVEL</th>
            <th>SECTION</th>
            <th>Report</th>
          </tr>
        </thead>
        <tbody>
          {filteredReportList.map((studentreport, index) => (
            <tr key={studentreport.student_id}>
              <td>{index + 1}</td>
              <td>{`${studentreport.first_name} ${studentreport.last_name}`}</td>
              <td>{studentreport.strand_track}</td>
              <td>{studentreport.email}</td>
              <td className="gradelevel">{studentreport.grade_level}</td>
              <td className="section">{studentreport.section}</td>
              <td>
                <TbReportAnalytics
                  className="reportview-icon"
                  onClick={() => reportlist(studentreport.student_id)}
                  style={{ cursor: 'pointer', color: '#006400', position: 'relative', display: 'flex', justifyContent: 'flex-start' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentReportLists;
