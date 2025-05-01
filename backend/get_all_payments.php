<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Fetch all payments
$query = "SELECT * FROM payments";
$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    $payments = [];
    while ($row = $result->fetch_assoc()) {
        $payments[] = $row;
    }
    echo json_encode(["success" => true, "payments" => $payments]);
} else {
    echo json_encode(["success" => false, "message" => "No payments found."]);
}

$conn->close();
?>
