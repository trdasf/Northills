<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->student_id)) {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$student_id = $conn->real_escape_string($data->student_id);
$user_id = $conn->real_escape_string($data->user_id);
$password = $conn->real_escape_string($data->password);
$parent_user_id = $conn->real_escape_string($data->parent_user_id);
$parent_password = $conn->real_escape_string($data->parent_password);

// Check if the student already exists
$check_query = "SELECT COUNT(*) FROM enrolledstudent WHERE student_id = ?";
$check_stmt = $conn->prepare($check_query);
if (!$check_stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit();
}

$check_stmt->bind_param("s", $student_id);
$check_stmt->execute();
$check_stmt->bind_result($count);
$check_stmt->fetch();
$check_stmt->close();

// If the student exists, return a message indicating the student is already enrolled
if ($count > 0) {
    echo json_encode(["success" => false, "message" => "Student already enrolled."]);
    exit();
}

// Insert new credentials into the database
$insert_stmt = $conn->prepare("INSERT INTO enrolledstudent (user_id, password, parent_user_id, parent_password, status, student_id, created_at, updated_at) 
                              VALUES (?, ?, ?, ?, 'Approved', ?, NOW(), NOW())");

if (!$insert_stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit();
}

$insert_stmt->bind_param("ssssi", $user_id, $password, $parent_user_id, $parent_password, $student_id);

if ($insert_stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Data inserted successfully",
        "user_id" => $user_id,
        "password" => $password,
        "parent_user_id" => $parent_user_id,
        "parent_password" => $parent_password,
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Execute failed: " . $insert_stmt->error]);
}

$insert_stmt->close();
$conn->close();
?>
