<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
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
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Retrieve JSON data from the request body
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

// Extract data from request
$studentId = $data['student_id'];
$name = $data['name'];
$strand = $data['strand'];
$gradeLevel = $data['gradeLevel'];
$section = $data['section'];
$modeOfPayment = $data['modeOfPayment'];
$status = $data['status'];
$payment = $data['payment'];
$date = $data['date'];
$totalFee = $data['totalFee'];
$amountPaid = $data['amountPaid'];
$balance = $data['balance'];
$remarks = $data['remarks'];

// Generate receipt number
$receiptQuery = "SELECT MAX(CAST(receipt_number AS UNSIGNED)) AS last_receipt FROM payments";
$result = $conn->query($receiptQuery);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $lastReceipt = $row['last_receipt'];

    if ($lastReceipt) {
        // Increment the last receipt number
        $receiptNumber = str_pad((int)$lastReceipt + 1, 5, "0", STR_PAD_LEFT);
    } else {
        // If no receipt found, start with 00001
        $receiptNumber = "00001";
    }
} else {
    // If query fails, start with 00001
    $receiptNumber = "00001";
}

// Insert the payment record
$insertQuery = "INSERT INTO payments 
    (student_id, name, strand, grade_level, section, mode_of_payment, status, payment, date, total_fee, amount_paid, balance, remarks, receipt_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($insertQuery);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Failed to prepare query: " . $conn->error]);
    exit();
}

// Bind parameters and execute
$stmt->bind_param(
    "issssssssddiss",
    $studentId, $name, $strand, $gradeLevel, $section, $modeOfPayment, $status,
    $payment, $date, $totalFee, $amountPaid, $balance, $remarks, $receiptNumber
);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Payment saved successfully.", "receiptNumber" => $receiptNumber]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to save payment: " . $stmt->error]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>
