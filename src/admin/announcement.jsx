import React, { useState, useEffect } from "react";
import './announcement.css';
import { FaEdit, FaTrash, FaEye, FaPaperclip, FaDownload, FaEyeSlash } from "react-icons/fa";

const Announcement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add', 'view', 'edit'
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    author: '',
    role: '',
    category: '',
    content: '',
    attachment: null,
    attachment_name: '',
  });

  // Format date to the required format yyyy-mm-dd HH:mm
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Fetch announcements from the server
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://mediumaquamarine-dunlin-251088.hostingersite.com/announcement.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch announcements');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openModal = (mode, announcement = null) => {
    setModalMode(mode);
    if (announcement) {
      setFormData({
        announcement_id: announcement.announcement_id,
        title: announcement.title,
        date: formatDateForInput(announcement.date),
        author: announcement.author,
        role: announcement.role,
        category: announcement.category,
        content: announcement.content,
        attachment: null,
        attachment_name: announcement.attachment_name || '',
      });
    } else {
      setFormData({
        title: '',
        date: formatDateForInput(new Date()),
        author: '',
        role: '',
        category: '',
        content: '',
        attachment: null,
        attachment_name: '',
      });
    }
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const openSaveModal = (e) => {
    e.preventDefault();
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  const openAttachmentModal = (announcement) => {
    setCurrentAttachment(announcement);
    setIsAttachmentModalOpen(true);
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalOpen(false);
    setCurrentAttachment(null);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData({ 
        ...formData, 
        [name]: files[0],
        attachment_name: files[0] ? files[0].name : ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
  };

  // Filter announcements based on search term and date range
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          announcement.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    let withinDateRange = true;
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      const announcementDate = new Date(announcement.date);
      withinDateRange = withinDateRange && announcementDate >= fromDate;
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      const announcementDate = new Date(announcement.date);
      withinDateRange = withinDateRange && announcementDate <= toDate;
    }
    
    return matchesSearch && withinDateRange;
  });

  const handleSubmit = async () => {
    try {
      // Create a FormData object for file upload
      const form = new FormData();
      
      for (const key in formData) {
        if (key === 'attachment' && formData[key]) {
          form.append(key, formData[key]);
        } else if (key !== 'attachment') {
          form.append(key, formData[key]);
        }
      }
      
      let url = 'http://mediumaquamarine-dunlin-251088.hostingersite.com/announcement.php';
      let method = 'POST';
      
      if (modalMode === 'edit') {
        form.append('_method', 'PUT');
      }
      
      const response = await fetch(url, {
        method: method,
        body: form,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        fetchAnnouncements(); // Refresh the announcements list
        closeModal();
        closeSaveModal();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(`Error: ${err.message}`);
      closeSaveModal();
    }
  };

  const handleDelete = async () => {
    try {
      const form = new FormData();
      form.append('_method', 'DELETE');
      form.append('announcement_id', selectedAnnouncement.announcement_id);
      
      const response = await fetch('http://mediumaquamarine-dunlin-251088.hostingersite.com/announcement.php', {
        method: 'POST',
        body: form,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        fetchAnnouncements(); // Refresh the announcements list
        closeDeleteModal();
      } else {
        throw new Error(result.message || 'Delete operation failed');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const viewAttachment = (announcement) => {
    window.open(`http://mediumaquamarine-dunlin-251088.hostingersite.com/announcement.php?attachment_id=${announcement.announcement_id}`, '_blank');
  };

  const downloadAttachment = (announcement) => {
    window.open(`http://mediumaquamarine-dunlin-251088.hostingersite.com/announcement.php?attachment_id=${announcement.announcement_id}&download=true`, '_blank');
  };

  return (
    <div className="container-announce">
      <h2 className="title-announce">ANNOUNCEMENT</h2>

      {/* Filter Section */}
      <div className="filter-container-announce">
        <input 
          type="text" 
          placeholder="Search announcement..." 
          className="search-input-announce" 
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="date-filter-announce">
          <label>From:</label>
          <input 
            type="date" 
            className="date-input-announce" 
            name="from"
            value={dateRange.from}
            onChange={handleDateRangeChange}
          />
          <label>To:</label>
          <input 
            type="date" 
            className="date-input-announce" 
            name="to"
            value={dateRange.to}
            onChange={handleDateRangeChange}
          />
        </div>
        <button className="add-btn-announce" onClick={() => openModal('add')}>
          Add Announcement
        </button>
      </div>

      {/* Table Section */}
      {loading ? (
        <p>Loading announcements...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <table className="announcement-table-announce">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Author</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <tr key={announcement.announcement_id}>
                  <td>{announcement.title}</td>
                  <td>{formatDateForDisplay(announcement.date)}</td>
                  <td>{announcement.author}</td>
                  <td>{announcement.category}</td>
                  <td>
                    <div className="action-btn-announce">
                      <button className="view-btn-announce" onClick={() => openModal('view', announcement)}>
                        <FaEye /> View
                      </button>
                      <button className="edit-btn-announce" onClick={() => openModal('edit', announcement)}>
                        <FaEdit /> Edit
                      </button>
                      <button className="delete-btn-announce" onClick={() => openDeleteModal(announcement)}>
                        <FaTrash /> Delete
                      </button>
                      {announcement.attachment_name && (
                        <button 
                          className="attachment-btn-announce"
                          onClick={() => openAttachmentModal(announcement)}
                        >
                          <FaPaperclip /> Attachment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No announcements found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Add/Edit/View Modal */}
      {isModalOpen && (
        <div className="modal-announce">
          <div className="modal-content-announce">
            <h3>
              {modalMode === 'add' 
                ? 'Add Announcement' 
                : modalMode === 'edit' 
                  ? 'Edit Announcement' 
                  : 'View Announcement'}
            </h3>
            <div className="modal-form-announce">
              <div className="modal-form-group-announce">
                <form onSubmit={openSaveModal}>
                  <label>Title:</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'} 
                    required
                  />

                  <label>Date and Time:</label>
                  <input 
                    type="datetime-local" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'} 
                    required
                  />

                  <label>Author:</label>
                  <input 
                    type="text" 
                    name="author" 
                    value={formData.author} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'} 
                    required
                  />

                  <label>Author Role:</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Principal">Principal</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                  
                  <label>Category:</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Important">Important</option>
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  
                  <label>Content:</label>
                  <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'}
                    required
                  />
                  
                  <label>Attachment:</label>
                  {modalMode === 'view' && formData.attachment_name ? (
                    <div className="view-attachment">
                      <a 
                        href={`http://mediumaquamarine-dunlin-251088.hostingersite.com/announcement.php?attachment_id=${formData.announcement_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formData.attachment_name}
                      </a>
                    </div>
                  ) : (
                    <div className="custom-file-upload-announce">
                      <label htmlFor="file-upload-announce" className="file-label-announce">
                        {formData.attachment ? formData.attachment.name : formData.attachment_name || "Choose File"}
                      </label>
                      <input
                        id="file-upload-announce"
                        type="file"
                        name="attachment"
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                      />
                    </div>
                  )}

                  <div className="modal-actions-announce-1">
                    {modalMode !== 'view' && (
                      <button type="submit" className="publish-btn-announce">
                        {modalMode === 'add' ? 'Add' : 'Update'}
                      </button>
                    )}
                    <button type="button" className="cancel-btn-announce" onClick={closeModal}>
                      {modalMode === 'view' ? 'Close' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {isSaveModalOpen && (
        <div className="modal-announce-1">
          <div className="modal-content-announce-1">
            <h3>Confirmation</h3>
            <p>Are you sure you want to {modalMode === 'add' ? 'add' : 'update'} this announcement?</p>
            <div className="modal-actions-announce-1">
              <button className="publish-btn-announce" onClick={handleSubmit}>
                Yes
              </button>
              <button className="cancel-btn-announce" onClick={closeSaveModal}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-announce-1">
          <div className="modal-content-announce-1">
            <h3>Confirmation</h3>
            <p>Are you sure you want to delete this announcement?</p>
            <div className="modal-actions-announce-1">
              <button className="publish-btn-announce" onClick={handleDelete}>
                Yes
              </button>
              <button className="cancel-btn-announce" onClick={closeDeleteModal}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Options Modal */}
      {isAttachmentModalOpen && currentAttachment && (
        <div className="modal-announce-1">
          <div className="modal-content-announce-1">
            <h3>Attachment Options</h3>
            <p>Choose an option for "{currentAttachment.attachment_name}"</p>
            <div className="modal-actions-announce-1">
              <button className="view-btn-announce attachment-action-btn" onClick={() => viewAttachment(currentAttachment)}>
                <FaEye /> View
              </button>
              <button className="edit-btn-announce attachment-action-btn" onClick={() => downloadAttachment(currentAttachment)}>
                <FaDownload /> Download
              </button>
              <button className="cancel-btn-announce" onClick={closeAttachmentModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcement;