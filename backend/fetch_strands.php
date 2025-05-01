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
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$query = "SELECT strand FROM strands"; // Adjust the field name as per your database
$result = $conn->query($query);

if ($result->num_rows > 0) {
    $strands = [];
    while ($row = $result->fetch_assoc()) {
        $strands[] = $row;
    }
    echo json_encode(["success" => true, "strands" => $strands]);
} else {
    echo json_encode(["success" => false, "message" => "No strands found."]);
}

$conn->close();
?>
