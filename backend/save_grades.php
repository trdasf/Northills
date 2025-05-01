<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read and decode the JSON input
    $data = json_decode(file_get_contents("php://input"), true);

    $subject_id = $data["subject_id"] ?? null;
    $grades = $data["grades"] ?? [];

    // Validate input
    if (!$subject_id || empty($grades)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input data."]);
        exit();
    }

    // Fetch semester for the subject from the subjects table
    $stmt = $conn->prepare("SELECT semester FROM subjects WHERE subject_id = ?");
    $stmt->bind_param("i", $subject_id);
    $stmt->execute();
    $stmt->bind_result($semester);
    $stmt->fetch();
    $stmt->close();

    if (!$semester) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid subject ID or semester not found."]);
        exit();
    }

    // Loop through the grades array and save or update each student's grades
    foreach ($grades as $grade) {
        $student_id = $grade["student_id"];
        $first_quarter = $grade["first_quarter"] ?? null;
        $second_quarter = $grade["second_quarter"] ?? null;
        $final_grade = $grade["final_grade"] ?? null;
        $remarks = $grade["remarks"] ?? null;

        // Prepare the query to insert or update grades
        $stmt = $conn->prepare("
            INSERT INTO grades (subject_id, student_id, first_quarter, second_quarter, final_grade, remarks, semester)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            first_quarter = VALUES(first_quarter),
            second_quarter = VALUES(second_quarter),
            final_grade = VALUES(final_grade),
            remarks = VALUES(remarks),
            semester = VALUES(semester)
        ");

        if ($stmt) {
            $stmt->bind_param(
                "iiddsss",
                $subject_id,
                $student_id,
                $first_quarter,
                $second_quarter,
                $final_grade,
                $remarks,
                $semester // Pass the semester value here
            );

            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to execute query: " . $stmt->error]);
                $stmt->close();
                exit();
            }
            $stmt->close();
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to prepare statement: " . $conn->error]);
            exit();
        }
    }

    // Success response
    http_response_code(200);
    echo json_encode(["success" => true, "message" => $grades ? "Grades updated successfully." : "Grades saved successfully."]);
} else {
    // Handle invalid HTTP methods
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method. Only POST is allowed."]);
}

// Close the database connection
$conn->close();
?>
