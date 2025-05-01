<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers for cross-origin requests
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
$username = "u572625467_groupV";
$password = "Northills_12345";
$dbname = "u572625467_northills";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Read and decode JSON data
$data = json_decode(file_get_contents("php://input"));

// Validate received data
if (!$data || !isset($data->email, $data->password)) {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$email = $conn->real_escape_string($data->email);
$password = $data->password;

// Prepare and execute query to fetch account_id and password for the given email
$stmt = $conn->prepare("SELECT account_id, password FROM account_registration WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($account_id, $hashedPassword);
    $stmt->fetch();

    // Verify the entered password against the hashed password
    if (password_verify($password, $hashedPassword)) {
        echo json_encode(["success" => true, "message" => "Login successful.", "account_id" => $account_id]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>
