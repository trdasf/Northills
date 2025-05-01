import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ParentsDashboard.css';
import { Calendar as LucideCalendar, Download, Eye, Clock, Check, X, Trash2 } from 'lucide-react';

const ParentsDashboard = () => {
  const location = useLocation();
  const studentId = location.state?.student_id;
  
  const [activeTab, setActiveTab] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [modalAction, setModalAction] = useState('add'); // 'add' or 'remove'
  
  const tabs = ['All', 'Unread'];
  
  // Fetch calendar events for this student
  useEffect(() => {
    if (studentId) {
      fetchCalendarEvents();
    }
  }, [studentId]);

  // Fetch announcements
  useEffect(() => {
    if (studentId) {
      fetch(`http://localhost:8000/viewAnnouncement.php?student_id=${studentId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setAnnouncements(data.data);
          } else {
            setError(data.message || 'Failed to fetch announcements');
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Error connecting to server');
          setLoading(false);
          console.error('Error fetching announcements:', err);
        });
    } else {
      fetch('http://localhost:8000/viewAnnouncement.php')
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setAnnouncements(data.data);
          } else {
            setError(data.message || 'Failed to fetch announcements');
          }
          setLoading(false);
        })
        .catch(err => {
          setError('Error connecting to server');
          setLoading(false);
          console.error('Error fetching announcements:', err);
        });
    }
  }, [studentId]);

  // Fetch calendar events for this student
  const fetchCalendarEvents = () => {
    fetch(`http://localhost:8000/viewAnnouncement.php?get_calendar_events=true&student_id=${studentId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setCalendarEvents(data.events);
        } else {
          console.error('Failed to fetch calendar events:', data.message);
        }
      })
      .catch(err => {
        console.error('Error fetching calendar events:', err);
      });
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Show modal for calendar operations
  const showCalendarModal = (announcement, action) => {
    setCurrentAnnouncement(announcement);
    setModalAction(action);
    setShowModal(true);
  };

  // Add announcement to calendar
  const addToCalendar = () => {
    if (!studentId) {
      alert('Cannot identify student. Please try again later.');
      setShowModal(false);
      return;
    }

    const eventData = {
      student_id: studentId,
      announcement_id: currentAnnouncement.announcement_id,
      event_date: currentAnnouncement.date,
      title: currentAnnouncement.title
    };

    fetch('http://localhost:8000/viewAnnouncement.php?add_to_calendar=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          fetchCalendarEvents();
        } else {
          alert('Failed to add event to calendar: ' + data.message);
        }
        setShowModal(false);
      })
      .catch(err => {
        alert('Error adding event to calendar. Please try again.');
        console.error('Error:', err);
        setShowModal(false);
      });
  };

  // Remove from calendar
  const removeFromCalendar = () => {
    if (!studentId) {
      alert('Cannot identify student. Please try again later.');
      setShowModal(false);
      return;
    }

    const eventData = {
      student_id: studentId,
      announcement_id: currentAnnouncement.announcement_id
    };

    fetch('http://localhost:8000/viewAnnouncement.php?remove_from_calendar=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          fetchCalendarEvents();
        } else {
          alert('Failed to remove event from calendar: ' + data.message);
        }
        setShowModal(false);
      })
      .catch(err => {
        alert('Error removing event from calendar. Please try again.');
        console.error('Error:', err);
        setShowModal(false);
      });
  };

  const toggleReadStatus = (announcement) => {
    if (!studentId) {
      alert('Cannot identify student. Please try again later.');
      return;
    }

    const action = announcement.read_status === '1' ? 'mark_as_unread' : 'mark_as_read';

    fetch(`http://localhost:8000/viewAnnouncement.php?${action}=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        announcement_id: announcement.announcement_id
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Refresh announcements to update read status
          fetch(`http://localhost:8000/viewAnnouncement.php?student_id=${studentId}`)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                setAnnouncements(data.data);
              }
            });
        }
      })
      .catch(err => {
        console.error('Error updating read status:', err);
      });
  };

  const viewAttachment = (announcement) => {
    window.open(`http://localhost:8000/viewAnnouncement.php?attachment_id=${announcement.announcement_id}`, '_blank');
  };

  const downloadAttachment = (announcement) => {
    window.open(`http://localhost:8000/viewAnnouncement.php?attachment_id=${announcement.announcement_id}&download=true`, '_blank');
  };

  // Check if announcement has been added to calendar
  const isInCalendar = (announcementId) => {
    return calendarEvents.some(event => parseInt(event.announcement_id) === parseInt(announcementId));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Calendar functions
  const daysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  // Check if a date has events
  const hasEventOnDate = (day) => {
    if (!calendarEvents.length) return false;
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return calendarEvents.some(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getDate() === checkDate.getDate() &&
             eventDate.getMonth() === checkDate.getMonth() &&
             eventDate.getFullYear() === checkDate.getFullYear();
    });
  };

  // Get events for selected date
  const getEventsForSelectedDate = () => {
    if (!selectedDate || !calendarEvents.length) return [];
    
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getDate() === selectedDate.getDate() &&
             eventDate.getMonth() === selectedDate.getMonth() &&
             eventDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  // Get event titles for a specific day
  const getEventTitlesForDay = (day) => {
    if (!calendarEvents.length) return [];
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getDate() === checkDate.getDate() &&
             eventDate.getMonth() === checkDate.getMonth() &&
             eventDate.getFullYear() === checkDate.getFullYear();
    }).map(event => event.title);
  };

  // Render calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    
    let blanks = [];
    for (let i = 0; i < firstDay; i++) {
      blanks.push(<div key={`blank-${i}`} className="calendar-day-pd empty"></div>);
    }
    
    let daysArray = [];
    for (let d = 1; d <= days; d++) {
      const isSelected = selectedDate && 
                          selectedDate.getDate() === d && 
                          selectedDate.getMonth() === month && 
                          selectedDate.getFullYear() === year;
      
      const isToday = new Date().getDate() === d && 
                       new Date().getMonth() === month && 
                       new Date().getFullYear() === year;
      
      const hasEvent = hasEventOnDate(d);
      const eventTitles = getEventTitlesForDay(d);
      
      daysArray.push(
        <div 
          key={`day-${d}`} 
          className={`calendar-day-pd ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}
          onClick={() => handleDateClick(d)}
        >
          <div className="day-number">{d}</div>
          {hasEvent && (
            <div className="event-indicator">
              {eventTitles.map((title, idx) => (
                <div key={idx} className="event-title-indicator" title={title}>
                  {title.length > 8 ? title.substring(0, 8) + '...' : title}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    const totalSlots = [...blanks, ...daysArray];
    
    return totalSlots;
  };

  // Filter announcements based on active tab
  const filteredAnnouncements = announcements.filter(announcement => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') {
      return announcement.read_status === '0' || !announcement.read_status;
    }
    return false;
  });

  return (
    <div className="dashboard-container-pd">
      <h1 className="dashboard-title-pd">Dashboard</h1>
      <h2 className="calendar-title-pd">Calendar</h2>
      <div className="calendar-widget-pd">
        <div className="calendar-header-pd">
          <button className="calendar-nav-btn-pd" onClick={handlePrevMonth}>&lt;</button>
          <h3>{getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</h3>
          <button className="calendar-nav-btn-pd" onClick={handleNextMonth}>&gt;</button>
        </div>
        <div className="calendar-weekdays-pd">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        <div className="calendar-days-pd">
          {renderCalendar()}
        </div>
        
        {selectedDate && (
          <div className="selected-date-events">
            <h4>{formatDate(selectedDate)}</h4>
            {getEventsForSelectedDate().length > 0 ? (
              <ul className="event-list">
                {getEventsForSelectedDate().map((event, index) => (
                  <li key={index} className="event-item">
                    <div className="event-title">{event.title}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No events scheduled for this date.</p>
            )}
          </div>
        )}
      </div>
      
      <div className="announcement-section-pd">
        <h2 className="announcement-title-pd">Announcements</h2>
        <div className="tabs-container-pd">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-message">Loading announcements...</div>
      ) : error ? (
        <div className="error-message">Error: {error}</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="no-announcements">No announcements found</div>
      ) : (
        filteredAnnouncements.map((announcement) => (
          <div 
            key={announcement.announcement_id} 
            className={`announcement-card-pd ${announcement.read_status === '0' || !announcement.read_status ? 'unread' : ''}`}
          >
            <div className="announcement-header-pd">
              <div className="announcement-title-meta">
                <h3>{announcement.title}</h3>
                <div className="announcement-meta">
                  <span className="category-tag">{announcement.category}</span>
                </div>
              </div>
              <span className="date">{formatDate(announcement.date)}</span>
            </div>
            
            <div className="principal-info-pd">
              <div className="principal-details-pd">
                <p className="principal-name-pd">{announcement.author}</p>
                <p className="principal-title-pd">{announcement.role}</p>
              </div>
            </div>
            <p className="announcement-content-pd">
              {announcement.content}
            </p>
            <div className="announcement-actions-pd">
              {announcement.attachment_name && (
                <div className="attachment-actions">
                  <button className="action-button-pd" onClick={() => viewAttachment(announcement)}>
                    <Eye size={14} /> View Attachment
                  </button>
                  <button className="action-button-pd" onClick={() => downloadAttachment(announcement)}>
                    <Download size={14} /> Download
                  </button>
                </div>
              )}
              <button className="action-button-pd" onClick={() => toggleReadStatus(announcement)}>
                {announcement.read_status === '1' ? (
                  <>Mark as Unread</>
                ) : (
                  <>Mark as Read</>
                )}
              </button>
              {isInCalendar(announcement.announcement_id) ? (
                <button className="action-button-pd remove-calendar" onClick={() => showCalendarModal(announcement, 'remove')}>
                  <Trash2 size={14} /> Remove from Calendar
                </button>
              ) : (
                <button className="action-button-pd" onClick={() => showCalendarModal(announcement, 'add')}>
                  <Clock size={14} /> Add to Calendar
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {/* Calendar Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{modalAction === 'add' ? 'Add to Calendar' : 'Remove from Calendar'}</h3>
            <p>
              {modalAction === 'add' 
                ? `Do you want to add "${currentAnnouncement?.title}" to your calendar?` 
                : `Do you want to remove "${currentAnnouncement?.title}" from your calendar?`}
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="cancel-btn">
                <X size={14} /> Cancel
              </button>
              <button 
                onClick={modalAction === 'add' ? addToCalendar : removeFromCalendar} 
                className={modalAction === 'add' ? "confirm-btn" : "remove-btn"}
              >
                {modalAction === 'add' ? (
                  <><Check size={14} /> Confirm</>
                ) : (
                  <><Trash2 size={14} /> Remove</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsDashboard;