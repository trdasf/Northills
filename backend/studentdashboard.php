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
$username = "u572625467_groupV";
$password = "Northills_12345";
$dbname = "u572625467_northills";

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

// Fetch student details
$query = "
    SELECT last_name, first_name
    FROM personalinfo
    WHERE student_id = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($last_name, $first_name);
    $stmt->fetch();

    echo json_encode([
        "success" => true,
        "last_name" => $last_name,
        "first_name" => $first_name
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Student details not found."]);
}

$stmt->close();
$conn->close();
?>
