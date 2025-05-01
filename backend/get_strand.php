<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$requestMethod = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"));

switch ($requestMethod) {
    case "GET":
        $sql = "SELECT strand FROM strands";  // Fetch only the strand column
        $result = $conn->query($sql);
        $strands = [];
        while ($row = $result->fetch_assoc()) {
            $strands[] = $row['strand'];
        }
        echo json_encode($strands);
        break;

    default:
        echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

$conn->close();
?>
