import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './studentdashboard.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';

const StudentDashboard = () => {
  const location = useLocation();
  const studentId = location.state?.student_id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    subjectsData: [
      { name: 'Completed', value: 75, color: '#0f6b51', count: 9 }, 
      { name: 'Remaining', value: 25, color: '#19ac83', count: 3 },
    ],
    paymentData: [
      { name: 'Paid', value: 70, color: '#0f6b51', amount: 16800 },
      { name: 'Remaining', value: 30, color: '#19ac83', amount: 7200 },
    ],
    gradesData: [ 
      { subject: 'MATH', grade: 92, color: '#1E9C75' },    // medium-deep green
      { subject: 'SCIENCE', grade: 85, color: '#28B485' }, // balanced green
      { subject: 'ENGLISH', grade: 88, color: '#34C79A' }, // soft bright green
      { subject: 'HISTORY', grade: 90, color: '#3FD9A8' }, // lighter minty green
      { subject: 'PE', grade: 95, color: '#56E1B2' },      // even lighter minty
    ],
    gwaData: [
      { quarter: '1ST QUARTER', gwa: 1.5, color: '#A8E6D1' }, // soft pale green
      { quarter: '2ND QUARTER', gwa: 1.75, color: '#91DCC3' }, // pastel green
      { quarter: '3RD QUARTER', gwa: 1.25, color: '#78D1B3' }, // cool mint
      { quarter: '4TH QUARTER', gwa: 1.0, color: '#5CC6A1' },  // soft sea green
    ],
    
    userName: 'Loading...'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const baseUrl = 
          window.location.hostname === "localhost"
            ? "http://localhost:8000"
            : "http://192.168.1.10:8000";
        
        const response = await axios.get(`${baseUrl}/fetchStudentData.php`, {
          params: { 
            type: 'all',
            student_id: studentId
          }
        });

        if (response.data.success) {
          // Set data from response or use defaults if empty
          setDashboardData(prevData => ({
            ...prevData,
            subjectsData: response.data.subjectsData || prevData.subjectsData,
            paymentData: response.data.paymentData || prevData.paymentData,
            gradesData: response.data.gradesData || prevData.gradesData,
            gwaData: response.data.gwaData || prevData.gwaData,
            userName: response.data.userName || 'Student'
          }));
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchDashboardData();
    } else {
      setError('Student ID not found. Please log in again.');
      setLoading(false);
    }
  }, [studentId]);

  // Custom renderer for donut chart labels
  const renderCustomizedDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return <div className="loading-container">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-container-sd">
      <h1 className="dashboard-title-sd">Dashboard <span>/ {dashboardData.userName}</span></h1>

      <div className="dashboard-grid">
        {/* First row with two cards */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <h3 className="card-title-sd">SUBJECTS OVERVIEW</h3>
            <div className="chart-container">
              <div className="chart-header">
                <div className="chart-summary">
                  <div className="summary-item">
                    <div className="summary-value">{dashboardData.subjectsData.reduce((acc, item) => acc + item.count, 0)}</div>
                    <div className="summary-label">Total Subjects</div>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.subjectsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={renderCustomizedDonutLabel}
                  >
                    {dashboardData.subjectsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${value}% (${item.count} subjects)`, name];
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {dashboardData.subjectsData.map((entry, index) => (
                  <div key={`legend-${index}`} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                    <span>{entry.name} ({entry.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title-sd">PAYMENT STATUS</h3>
            <div className="chart-container">
              <div className="chart-header">
                <div className="chart-summary">
                  <div className="summary-item">
                    <div className="summary-value">₱{(dashboardData.paymentData.reduce((acc, item) => acc + item.amount, 0)).toLocaleString()}</div>
                    <div className="summary-label">Total Fees</div>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.paymentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={renderCustomizedDonutLabel}
                  >
                    {dashboardData.paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${value}% (₱${item.amount.toLocaleString()})`, name];
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {dashboardData.paymentData.map((entry, index) => (
                  <div key={`legend-${index}`} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                    <span>{entry.name} (₱{entry.amount.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Second row with two cards */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <h3 className="card-title-sd">GRADE PERFORMANCE</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={dashboardData.gradesData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, 'Grade']} />
                <Bar dataKey="grade" radius={[0, 10, 10, 0]}>
                  {dashboardData.gradesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title-sd">GWA PER QUARTER</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={dashboardData.gwaData}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} />
                <Tooltip formatter={(value) => [`${value}`, 'GWA']} />
                <Line 
                  type="monotone" 
                  dataKey="gwa" 
                  strokeWidth={0} 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={15} 
                        fill={payload.color} 
                        stroke="none" 
                      />
                    );
                  }}
                  label={(props) => {
                    const { x, y, value } = props;
                    return (
                      <text 
                        x={x} 
                        y={y - 25} 
                        fill="#00A67E" 
                        textAnchor="middle" 
                        fontSize={12}
                      >
                        {value}
                      </text>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;