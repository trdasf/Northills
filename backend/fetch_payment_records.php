<?php
header("Access-Control-Allow-Origin: *"); // Allow all origins
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fetching the student_id
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing student_id parameter"]);
    exit();
}

$query = "SELECT * FROM payments WHERE student_id = ?";
$stmt = $conn->prepare($query);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
    exit();
}

$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$payment_records = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $payment_records[] = $row;
    }
}

echo json_encode(["success" => true, "payment_records" => $payment_records]);

$stmt->close();
$conn->close();
?>
