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

if (!$data || !isset($data->user_id) || !isset($data->password)) {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$user_id = $conn->real_escape_string($data->user_id);
$password = $conn->real_escape_string($data->password);

// Validate user_id and password
$query = "
    SELECT student_id 
    FROM enrolledstudent 
    WHERE user_id = ? AND password = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $user_id, $password);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($student_id);
    $stmt->fetch();

    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "student_id" => $student_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid credentials. Please try again."
    ]);
}

$stmt->close();
$conn->close();
?>
