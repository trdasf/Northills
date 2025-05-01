<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers to handle preflight requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection setup
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Read and decode JSON data
$data = json_decode(file_get_contents("php://input"));

// Validate received data
if (!$data || !isset($data->first_name, $data->last_name, $data->email, $data->password)) {
    error_log("Incomplete data provided.");
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$first_name = $conn->real_escape_string($data->first_name);
$last_name = $conn->real_escape_string($data->last_name);
$email = $conn->real_escape_string($data->email);
$password = password_hash($data->password, PASSWORD_DEFAULT);

// Check if the email is already registered
$stmt = $conn->prepare("SELECT * FROM account_registration WHERE email = ?");
if (!$stmt) {
    error_log("Preparation failed for email check: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Database error."]);
    exit();
}

$stmt->bind_param("s", $email);
$stmt->execute();
$emailCheckResult = $stmt->get_result();

if ($emailCheckResult->num_rows > 0) {
    error_log("Account already registered for email: " . $email);
    echo json_encode(["success" => false, "message" => "Account already registered."]);
    $stmt->close();
    $conn->close();
    exit();
}

// Insert the new account without the 'Pending' status
$stmt = $conn->prepare("INSERT INTO account_registration (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    error_log("Preparation failed for insert statement: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Database error."]);
    exit();
}

$stmt->bind_param("ssss", $first_name, $last_name, $email, $password);

if ($stmt->execute()) {
    error_log("Registration successful for email: " . $email);
    echo json_encode(["success" => true, "message" => "Registration successful."]);
} else {
    error_log("Error executing insert statement: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Error occurred during registration."]);
}

$stmt->close();
$conn->close();
?>
