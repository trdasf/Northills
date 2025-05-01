<?php
// Set the correct headers for CORS
header("Access-Control-Allow-Origin: *"); // Or specify your frontend URL (e.g., http://localhost:3000)
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Allow GET, POST, and OPTIONS methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"); // Allow specific headers

// Handle preflight (OPTIONS) requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection variables
$servername = "localhost";
$username = "u572625467_groupV";
$password = "Northills_12345";
$dbname = "u572625467_northills";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Get the data from the request body
$data = json_decode(file_get_contents("php://input"), true);

// Check if the method is POST and if the required data is present
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $student_id = isset($data['student_id']) ? intval($data['student_id']) : null;
    $status = isset($data['status']) ? $data['status'] : null;

    // Validate input
    if ($student_id !== null && in_array($status, ['SUBMITTED', 'NOT_SUBMITTED'])) {
        // SQL query to update the requirements_status column
        $sql = "UPDATE finalstep SET requirements_status = ? WHERE student_id = ?";
        $stmt = $conn->prepare($sql);

        if ($stmt) {
            $stmt->bind_param("si", $status, $student_id);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "requirements_status updated successfully."]);
            } else {
                error_log("Database error: " . $stmt->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update requirements_status."]);
            }

            $stmt->close();
        } else {
            error_log("Query preparation error: " . $conn->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to prepare the query."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
}

// Close the database connection
$conn->close();
?>
