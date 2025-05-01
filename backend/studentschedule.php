<?php
// Allow CORS (Cross-Origin Resource Sharing)
header("Access-Control-Allow-Origin: http://localhost:5173"); // Allow requests from React app
header("Content-Type: application/json; charset=UTF-8"); // Set content type to JSON
header("Access-Control-Allow-Methods: GET, OPTIONS"); // Allow GET and OPTIONS methods
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true"); // Allow credentials if needed

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database credentials
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

// Handle GET request to fetch subjects
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get the faculty_id from query parameters
    $faculty_id = isset($_GET['faculty_id']) ? intval($_GET['faculty_id']) : 0;

    if ($faculty_id === 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid faculty ID."]);
        exit();
    }

    // Query to fetch subjects for the given faculty_id
    $stmt = $conn->prepare("
        SELECT s.subject_id AS subject_id, s.description, s.codeNo, s.semester, s.teacher, s.schedule, s.grade, s.section, s.strand, s.unit
        FROM subjects s
        WHERE s.faculty_id = ?
    ");
    $stmt->bind_param("i", $faculty_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $subjects = [];

        // Fetch rows and store in $subjects array
        while ($row = $result->fetch_assoc()) {
            $subjects[] = $row;
        }

        // Return success response with subjects
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "subjects" => $subjects
        ]);
    } else {
        // Return response if no subjects found
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No subjects found for this faculty."]);
    }

    $stmt->close();
}

$conn->close();
?>
