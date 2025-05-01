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
$username = "root";
$password = "";
$dbname = "northills";

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

// GET request - Fetch all announcements or a single announcement
else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $announcement_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($announcement_id) {
        // Fetch a single announcement
        $stmt = $conn->prepare("SELECT announcement_id, title, date, author, role, category, content, attachment_name, attachment_type, created_at, updated_at FROM announcements WHERE announcement_id = ?");
        $stmt->bind_param("i", $announcement_id);
    } else {
        // Fetch all announcements
        $stmt = $conn->prepare("SELECT announcement_id, title, date, author, role, category, content, attachment_name, created_at, updated_at FROM announcements ORDER BY date DESC");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($announcement_id) {
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo json_encode(["success" => true, "data" => $row]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Announcement not found"]);
        }
    } else {
        $announcements = [];
        while ($row = $result->fetch_assoc()) {
            $announcements[] = $row;
        }
        echo json_encode(["success" => true, "data" => $announcements]);
    }
    
    $stmt->close();
}

// POST request - Create a new announcement
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if this is a method override for PUT or DELETE
    if (isset($_POST['_method'])) {
        $method = strtoupper($_POST['_method']);
        
        if ($method === 'PUT') {
            // Handle as PUT request
            $announcement_id = intval($_POST['announcement_id']);
            
            if (!$announcement_id) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Announcement ID is required"]);
                exit();
            }
            
            $title = $_POST['title'] ?? '';
            $date = formatDate($_POST['date'] ?? '');
            $author = $_POST['author'] ?? '';
            $role = $_POST['role'] ?? '';
            $category = $_POST['category'] ?? '';
            $content = $_POST['content'] ?? '';
            
            // Handle file upload
            $attachment = null;
            $attachment_name = null;
            $attachment_type = null;
            $update_attachment = false;
            
            if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == 0) {
                $attachment = file_get_contents($_FILES['attachment']['tmp_name']);
                $attachment_name = $_FILES['attachment']['name'];
                $attachment_type = $_FILES['attachment']['type'];
                $update_attachment = true;
            }
            
            // Update announcement with or without attachment
            if ($update_attachment) {
                $stmt = $conn->prepare("UPDATE announcements SET title = ?, date = ?, author = ?, role = ?, category = ?, content = ?, attachment = ?, attachment_name = ?, attachment_type = ?, updated_at = NOW() WHERE announcement_id = ?");
                $stmt->bind_param("sssssssssi", $title, $date, $author, $role, $category, $content, $attachment, $attachment_name, $attachment_type, $announcement_id);
            } else {
                $stmt = $conn->prepare("UPDATE announcements SET title = ?, date = ?, author = ?, role = ?, category = ?, content = ?, updated_at = NOW() WHERE announcement_id = ?");
                $stmt->bind_param("ssssssi", $title, $date, $author, $role, $category, $content, $announcement_id);
            }
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Announcement updated successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update announcement: " . $stmt->error]);
            }
            
            $stmt->close();
            exit();
        }
        else if ($method === 'DELETE') {
            // Handle as DELETE request
            $announcement_id = intval($_POST['announcement_id']);
            
            if (!$announcement_id) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Announcement ID is required"]);
                exit();
            }
            
            $stmt = $conn->prepare("DELETE FROM announcements WHERE announcement_id = ?");
            $stmt->bind_param("i", $announcement_id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Announcement deleted successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete announcement: " . $stmt->error]);
            }
            
            $stmt->close();
            exit();
        }
    }
    
    // Regular POST - Create a new announcement
    $title = $_POST['title'] ?? '';
    $date = formatDate($_POST['date'] ?? '');
    $author = $_POST['author'] ?? '';
    $role = $_POST['role'] ?? '';
    $category = $_POST['category'] ?? '';
    $content = $_POST['content'] ?? '';
    
    // Handle file upload
    $attachment = null;
    $attachment_name = null;
    $attachment_type = null;
    
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == 0) {
        $attachment = file_get_contents($_FILES['attachment']['tmp_name']);
        $attachment_name = $_FILES['attachment']['name'];
        $attachment_type = $_FILES['attachment']['type'];
    }
    
    // Insert announcement into database
    $stmt = $conn->prepare("INSERT INTO announcements (title, date, author, role, category, content, attachment, attachment_name, attachment_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $stmt->bind_param("sssssssss", $title, $date, $author, $role, $category, $content, $attachment, $attachment_name, $attachment_type);
    
    if ($stmt->execute()) {
        $announcement_id = $conn->insert_id;
        echo json_encode(["success" => true, "message" => "Announcement created successfully", "id" => $announcement_id]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create announcement: " . $stmt->error]);
    }
    
    $stmt->close();
}

// Handle invalid HTTP methods
else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

// Close the database connection
$conn->close();
?>