<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection setup
$servername = "localhost";
$username = "u572625467_groupV";
$password = "Northills_12345";
$dbname = "u572625467_northills";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Validate and get the student_id from the request
$student_id = isset($_GET['student_id']) && is_numeric($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "Invalid or missing student_id."]);
    exit();
}

// Fetch the strand_track and grade_level of the student
$studentQuery = "SELECT strand_track, grade_level FROM enrollmentdata WHERE student_id = ?";
$stmt = $conn->prepare($studentQuery);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No enrollment data found for the student_id."]);
    exit();
}

$studentData = $result->fetch_assoc();
$strandTrack = $studentData['strand_track'];
$gradeLevel = $studentData['grade_level'];

// Extract the numeric part from grade_level (e.g., "Grade 11" -> "11")
preg_match('/\d+/', $gradeLevel, $matches);
$grade = $matches[0] ?? null;

if (!$grade) {
    echo json_encode(["success" => false, "message" => "Invalid grade_level format."]);
    exit();
}

// Extract the prefix (e.g., ABM) from the strand_track
$strandPrefix = strtok($strandTrack, " ");

// Search for sections in the strands table based on the strand prefix and grade
$strandsQuery = "SELECT section FROM strands WHERE strand LIKE CONCAT('%', ?, '%') AND grade = ?";
$stmt = $conn->prepare($strandsQuery);
$stmt->bind_param("ss", $strandPrefix, $grade);
$stmt->execute();
$result = $stmt->get_result();

$sections = [];
while ($row = $result->fetch_assoc()) {
    $sections[] = $row['section'];
}

if (empty($sections)) {
    echo json_encode(["success" => false, "message" => "No matching sections found for the strand and grade."]);
} else {
    echo json_encode(["success" => true, "sections" => $sections]);
}

$conn->close();
?>
