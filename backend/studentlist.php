<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Get parameters from the request
$subject_id = isset($_GET['subject_id']) ? $_GET['subject_id'] : null;
$grade_level = isset($_GET['grade_level']) ? $_GET['grade_level'] : null;
$strand_track = isset($_GET['strand_track']) ? $_GET['strand_track'] : null;
$section = isset($_GET['section']) ? $_GET['section'] : null;

// Validate required parameters
if (!$subject_id || !$grade_level || !$strand_track || !$section) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required parameters."]);
    exit();
}

// Step 1: Extract numeric grade level and strand abbreviation
$numeric_grade_level = preg_replace('/[^0-9]/', '', $grade_level); // Extract numeric grade
$strand_abbreviation = strtok($strand_track, ' -'); // Extract strand abbreviation

// Step 2: Fetch students from enrollmentdata and join with personalinfo
$studentsQuery = "
    SELECT e.student_id, p.first_name, p.last_name, e.grade_level, e.strand_track, e.section
    FROM enrollmentdata e
    JOIN personalinfo p ON e.student_id = p.student_id
    JOIN finalstep f ON e.student_id = f.student_id
    WHERE e.grade_level LIKE ? 
      AND e.strand_track LIKE ? 
      AND e.section = ? 
      AND f.status = 'APPROVE'";

$stmt = $conn->prepare($studentsQuery);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error in query: " . $conn->error]);
    exit();
}

// Bind parameters
$grade_level_like = "%$numeric_grade_level%";
$strand_like = "$strand_abbreviation%";
$stmt->bind_param("sss", $grade_level_like, $strand_like, $section);
$stmt->execute();
$result = $stmt->get_result();

// Check if students are found
if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "No students found in enrollmentdata."]);
    exit();
}

// Step 3: Process the fetched students
$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = [
        "student_id" => $row["student_id"],
        "first_name" => $row["first_name"],
        "last_name" => $row["last_name"],
        "grade_level" => preg_replace('/[^0-9]/', '', $row["grade_level"]), // Extract numeric grade
        "strand_track" => strtok($row["strand_track"], ' -'), // Extract strand abbreviation
        "section" => $row["section"]
    ];
}

// Return students
http_response_code(200);
echo json_encode(["success" => true, "students" => $students]);

$stmt->close();
$conn->close();
?>
