<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

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

// Get the student_id from the request
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

// Validate the student_id
if (!$student_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing or invalid student_id"]);
    exit();
}

// Fetch grades for the given student_id
$query = "
    SELECT g.student_id, g.first_quarter, g.second_quarter, g.final_grade, g.remarks, 
           s.description AS subject_description, s.teacher AS subject_teacher, s.semester
    FROM grades g
    JOIN subjects s ON g.subject_id = s.subject_id
    WHERE g.student_id = ?
";

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to prepare SQL statement: " . $conn->error]);
    exit();
}

$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

// Check if any grades were found
$grades = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $grades[] = [
            "student_id" => $row["student_id"],
            "subject_description" => $row["subject_description"],
            "first_quarter" => $row["first_quarter"],
            "second_quarter" => $row["second_quarter"],
            "final_grade" => $row["final_grade"],
            "remarks" => $row["remarks"],
            "subject_teacher" => $row["subject_teacher"],
            "semester" => $row["semester"]  // Add semester data
        ];
    }
} else {
    // Log no data scenario (optional)
    error_log("No grades found for student_id: $student_id");
}

// Return grades with semester info
http_response_code(200);
echo json_encode([
    "success" => true,
    "grades" => $grades
]);

$stmt->close();
$conn->close();
?>
