<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Respond OK to preflight
    exit();
}

// Database credentials
$servername = "localhost";
$username = "u572625467_groupV";
$password = "Northills_12345";
$dbname = "u572625467_northills";

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Function to format date
function formatDate($date) {
    if (empty($date)) return null;
    $timestamp = strtotime($date);
    return date('Y-m-d H:i', $timestamp);
}

// Remove from calendar
if (isset($_GET['remove_from_calendar'])) {
    // Get input data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['student_id']) || !isset($data['announcement_id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }
    
    $student_id = $data['student_id'];
    $announcement_id = intval($data['announcement_id']);
    
    // Delete from calendar
    $delete_query = "DELETE FROM parent_calendar_events WHERE student_id = ? AND announcement_id = ?";
    $delete_stmt = $conn->prepare($delete_query);
    $delete_stmt->bind_param("ii", $student_id, $announcement_id);
    
    if ($delete_stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Removed from calendar successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to remove from calendar: " . $delete_stmt->error]);
    }
    
    $delete_stmt->close();
    exit();
}

// Add event to calendar
if (isset($_GET['add_to_calendar'])) {
    // Get input data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['student_id']) || !isset($data['announcement_id']) || !isset($data['event_date']) || !isset($data['title'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }
    
    $student_id = $data['student_id'];
    $announcement_id = intval($data['announcement_id']);
    $event_date = $data['event_date'];
    $title = $data['title'];
    
    // Delete any existing entry first (to ensure we don't have duplicates)
    $delete_query = "DELETE FROM parent_calendar_events WHERE student_id = ? AND announcement_id = ?";
    $delete_stmt = $conn->prepare($delete_query);
    $delete_stmt->bind_param("ii", $student_id, $announcement_id);
    $delete_stmt->execute();
    $delete_stmt->close();
    
    // Insert the new event
    $insert_query = "INSERT INTO parent_calendar_events (student_id, announcement_id, event_date, title) VALUES (?, ?, ?, ?)";
    $insert_stmt = $conn->prepare($insert_query);
    $insert_stmt->bind_param("iiss", $student_id, $announcement_id, $event_date, $title);
    
    if ($insert_stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Event added to calendar successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to add event to calendar: " . $insert_stmt->error]);
    }
    
    $insert_stmt->close();
    exit();
}

// Get calendar events for a student
if (isset($_GET['get_calendar_events']) && isset($_GET['student_id'])) {
    $student_id = $_GET['student_id'];
    
    $query = "SELECT * FROM parent_calendar_events WHERE student_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
    
    echo json_encode(["success" => true, "events" => $events]);
    $stmt->close();
    exit();
}

// Mark announcement as read
if (isset($_GET['mark_as_read'])) {
    // Get input data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['student_id']) || !isset($data['announcement_id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }
    
    $student_id = $data['student_id'];
    $announcement_id = intval($data['announcement_id']);
    
    // Delete any existing read record first (to ensure clean state)
    $delete_query = "DELETE FROM parent_announcement_read WHERE student_id = ? AND announcement_id = ?";
    $delete_stmt = $conn->prepare($delete_query);
    $delete_stmt->bind_param("ii", $student_id, $announcement_id);
    $delete_stmt->execute();
    $delete_stmt->close();
    
    // Insert read record
    $insert_query = "INSERT INTO parent_announcement_read (student_id, announcement_id, read_date) VALUES (?, ?, NOW())";
    $insert_stmt = $conn->prepare($insert_query);
    $insert_stmt->bind_param("ii", $student_id, $announcement_id);
    
    if ($insert_stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Marked as read successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to mark as read: " . $insert_stmt->error]);
    }
    
    $insert_stmt->close();
    exit();
}

// Mark announcement as unread
if (isset($_GET['mark_as_unread'])) {
    // Get input data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['student_id']) || !isset($data['announcement_id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }
    
    $student_id = $data['student_id'];
    $announcement_id = intval($data['announcement_id']);
    
    // Delete read record
    $delete_query = "DELETE FROM parent_announcement_read WHERE student_id = ? AND announcement_id = ?";
    $delete_stmt = $conn->prepare($delete_query);
    $delete_stmt->bind_param("ii", $student_id, $announcement_id);
    
    if ($delete_stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Marked as unread successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to mark as unread: " . $delete_stmt->error]);
    }
    
    $delete_stmt->close();
    exit();
}

// Check if this is an attachment request
if (isset($_GET['attachment_id']) && !empty($_GET['attachment_id'])) {
    $announcement_id = intval($_GET['attachment_id']);
    
    $stmt = $conn->prepare("SELECT attachment, attachment_name, attachment_type FROM announcements WHERE announcement_id = ?");
    $stmt->bind_param("i", $announcement_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        if ($row['attachment']) {
            // Set appropriate headers for the file
            header("Content-Type: " . $row['attachment_type']);
            
            // Check if download is requested
            if (isset($_GET['download']) && $_GET['download'] == 'true') {
                header("Content-Disposition: attachment; filename=\"" . $row['attachment_name'] . "\"");
            } else {
                header("Content-Disposition: inline; filename=\"" . $row['attachment_name'] . "\"");
            }
            
            // Output the file content
            echo $row['attachment'];
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No attachment found for this announcement"]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Announcement not found"]);
    }
    
    $stmt->close();
    exit;
}

// GET request - Fetch all announcements
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    
    // Basic query to fetch announcements
    $query = "SELECT a.announcement_id, a.title, a.date, a.author, a.role, a.category, a.content, a.attachment_name, a.created_at, a.updated_at";
    
    // If student_id is provided, include read status
    if ($student_id) {
        $query .= ", CASE WHEN pr.student_id IS NOT NULL THEN '1' ELSE '0' END as read_status";
    } else {
        $query .= ", '0' as read_status";
    }
    
    $query .= " FROM announcements a";
    
    // Left join with read status if student_id is provided
    if ($student_id) {
        $query .= " LEFT JOIN parent_announcement_read pr ON a.announcement_id = pr.announcement_id AND pr.student_id = ?";
    }
    
    $query .= " ORDER BY a.date DESC";
    
    $stmt = $conn->prepare($query);
    
    // Bind student_id if provided
    if ($student_id) {
        $stmt->bind_param("i", $student_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $announcements]);
    $stmt->close();
}

// Close the database connection
$conn->close();
?>