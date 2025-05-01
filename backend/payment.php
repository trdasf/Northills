<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection setup
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Fetch the name parameter from the query string
$name = isset($_GET['name']) ? $_GET['name'] : '';

// Sanitize input
$name = $conn->real_escape_string($name);

// SQL query to fetch student data based on the name
$sql = "SELECT 
            personalinfo.student_id, 
            CONCAT(personalinfo.last_name, ', ', personalinfo.first_name) AS name,
            enrollmentdata.grade_level, 
            enrollmentdata.section, 
            enrollmentdata.strand_track
        FROM personalinfo
        JOIN enrollmentdata ON personalinfo.student_id = enrollmentdata.student_id
        WHERE CONCAT(personalinfo.first_name, ' ', personalinfo.last_name) LIKE ?";

$stmt = $conn->prepare($sql);

// Check for errors in preparing the query
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Failed to prepare query: " . $conn->error]);
    exit();
}

// Bind parameters and execute the query
$searchName = "%$name%";
$stmt->bind_param('s', $searchName);
$stmt->execute();
$result = $stmt->get_result();

// Check if data is found
$applicants = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $studentId = $row["student_id"];

        // Check for existing payments for the student
        $paymentQuery = "SELECT balance FROM payments WHERE student_id = ? ORDER BY payment_id DESC LIMIT 1";
        $paymentStmt = $conn->prepare($paymentQuery);
        $paymentStmt->bind_param('i', $studentId);
        $paymentStmt->execute();
        $paymentResult = $paymentStmt->get_result();

        // Fetch the latest balance or set default to 5000
        $latestBalance = 5000; // Default balance
        if ($paymentResult && $paymentResult->num_rows > 0) {
            $latestBalance = $paymentResult->fetch_assoc()['balance'];
        }

        $applicants[] = [
            "student_id" => $row["student_id"],
            "name" => $row["name"],
            "grade_level" => $row["grade_level"],
            "section" => $row["section"],
            "strand" => $row["strand_track"],
            "latest_balance" => $latestBalance // Add the latest balance
        ];

        $paymentStmt->close();
    }
    echo json_encode(["success" => true, "applicants" => $applicants]);
} else {
    echo json_encode(["success" => false, "message" => "No students found."]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>
