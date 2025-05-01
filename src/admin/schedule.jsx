import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './schedule.css';
import { FaTrash, FaEdit, FaEye } from 'react-icons/fa';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    schedule_id: '',
    date: '',
    time: '',
    slots: '',
    originalDate: '',
    originalTime: '',
    originalSlots: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
        const baseUrl = window.location.hostname === "localhost"
            ? "http://localhost:8000"
            : "http://192.168.1.10:8000"; // Adjust for mobile access

        const response = await fetch(`${baseUrl}/schedule.php`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch schedule: ${response.statusText}`);
        }

        const data = await response.json();
        setSchedule(data);
    } catch (error) {
        console.error("Error fetching schedule:", error);
    }
};

  const handleAddClick = () => {
    setCurrentSchedule({ date: '', time: '', slots: '', originalDate: '', originalTime: '', originalSlots: '' });
    setIsEditMode(false);
    setIsModalOpen(true);
    setActionType('add');
  };

  const handleEditClick = (item) => {
    setCurrentSchedule({
      ...item,
      originalDate: item.date,
      originalTime: item.time,
      originalSlots: item.slots
    });
    setIsEditMode(true);
    setIsModalOpen(true);
    setActionType('edit');
  };

  const handleDeleteClick = (id) => {
    setCurrentSchedule({ schedule_id: id });
    setActionType('delete');
    setIsConfirmationModalOpen(true);
  };

  const viewStudents = (schedule_id, date, time) => {
    // Pass data using navigate state
    navigate('/view-schedule', { state: { schedule_id, date, time } });
  };
  
  
  

  const validateDate = (date) => {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{2}$/;
    if (!regex.test(date)) return false; // Invalid date format

    const [month, day, year] = date.split('/');
    const currentYear = new Date().getFullYear() % 100; // Get last two digits of the current year

    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && (parseInt(month) < new Date().getMonth() + 1 || (parseInt(month) === new Date().getMonth() + 1 && parseInt(day) < new Date().getDate())))) {
      return false; // Date is in the past
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateDate(currentSchedule.date)) {
      setAlertMessage('Please enter a valid date (MM/DD/YY) in the present or future.');
      setIsAlertModalOpen(true);
      return;
    }

    if (actionType === 'add' && currentSchedule.slots === '0') {
      setAlertMessage('Slots cannot be 0 when adding a new schedule.');
      setIsAlertModalOpen(true);
      return;
    }

    const existingSchedule = schedule.find(
      (item) =>
        item.date === currentSchedule.date &&
        item.time === currentSchedule.time &&
        item.schedule_id !== currentSchedule.schedule_id
    );

    if (existingSchedule) {
      setAlertMessage('The date and time already exist.');
      setIsAlertModalOpen(true);
      return;
    }

    if (
      isEditMode &&
      currentSchedule.date === currentSchedule.originalDate &&
      currentSchedule.time === currentSchedule.originalTime &&
      currentSchedule.slots === currentSchedule.originalSlots
    ) {
      setAlertMessage('No changes applied.');
      setIsAlertModalOpen(true);
      return;
    }

    setIsConfirmationModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (actionType === 'add' || actionType === 'edit') {
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch('http://localhost:8000/schedule.php', {
        method: method,
        body: JSON.stringify(currentSchedule),
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
        setIsModalOpen(false);
      } else {
        alert('Failed to save schedule');
      }
    } else if (actionType === 'delete') {
      const response = await fetch('http://localhost:8000/schedule.php', {
        method: 'DELETE',
        body: JSON.stringify({ schedule_id: currentSchedule.schedule_id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
      } else {
        alert('Failed to delete schedule');
      }
    }
    setIsConfirmationModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSchedule({ ...currentSchedule, [name]: value });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentSchedule({ date: '', time: '', slots: '', originalDate: '', originalTime: '', originalSlots: '' });
  };

  const handleCancelConfirmation = () => {
    setIsConfirmationModalOpen(false);
  };

  const handleCloseAlertModal = () => {
    setIsAlertModalOpen(false);
  };

  return (
    <div className="schedule-container-sd">
      <div className="schedule-header-sd">
        <button
          type="button"
          className="schedule-breadcrumb-sd"
          onClick={() => navigate('/applicants')}
        >
          Applicants List /
        </button>
      </div>
      <div className="top-controls-sd">
      <h2 className="schedule-title-sd">SUBMISSION DATES</h2>
      <button className="add-button-sd" onClick={handleAddClick}>
        + Add
      </button>
      </div>
      <div className="schedule-table-container-sd">
      <table className="schedule-table-sd">
        <thead>
          <tr>
            <th>DATE</th>
            <th>TIME</th>
            <th>SLOTS</th>
            <th>VIEW</th>
            <th>EDIT</th>
            <th>DELETE</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((item) => (
            <tr key={item.schedule_id}>
              <td>{item.date}</td>
              <td>{item.time}</td>
              <td>{item.slots}</td>
              <td>
  <FaEye 
    className="view-icon-sd" 
    onClick={() => viewStudents(item.schedule_id, item.date, item.time)} 
  />
</td>

              <td>
                <FaEdit className="edit-icon-sd" onClick={() => handleEditClick(item)} />
              </td>
              <td>
                <FaTrash className="delete-icon-sd" onClick={() => handleDeleteClick(item.schedule_id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-sched">
          <div className="modal-content-sched">
            <h3>{isEditMode ? 'Edit Schedule' : 'Add New Schedule'}</h3>
            <label>
              Available Submission Date
              <input
                type="text"
                name="date"
                value={currentSchedule.date}
                onChange={handleInputChange}
                placeholder="Enter date (MM/DD/YY)"
              />
            </label>
            <label>
              Time
              <select
                name="time"
                value={currentSchedule.time}
                onChange={handleInputChange}
              >
                <option value="" disabled>
                  Select Time
                </option>
                <option value="MORNING">MORNING</option>
                <option value="AFTERNOON">AFTERNOON</option>
              </select>
            </label>
            <label>
              Slots
              <input
                type="number"
                name="slots"
                value={currentSchedule.slots}
                onChange={handleInputChange}
                placeholder="Enter number of slots"
              />
            </label>
            <div className="modal-buttons-schedule">
              <button className="save-button-schedule" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-button-schedule" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <div className="modal-confirmation-sd">
          <div className="modal-content-sd">
            <h3>Confirmation</h3>
            <p>
              {actionType === 'delete'
                ? 'Are you sure you want to delete this schedule?'
                : `Are you sure you want to ${actionType} this schedule?`}
            </p>
            <div className="confirmation-buttons-sd">
              <button className="confirm-button-sd" onClick={handleConfirmAction}>
                Confirm
              </button>
              <button className="cancel-button-sd" onClick={handleCancelConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {isAlertModalOpen && (
        <div className="alert-modal-sd">
          <div className="alert-content-sd">
            <h3>Alert</h3>
            <p>{alertMessage}</p>
            <button className="close-alert-sd" onClick={handleCloseAlertModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
