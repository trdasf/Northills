<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$requestMethod = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"));

switch ($requestMethod) {
    case "GET":
        $sql = "SELECT * FROM strands";
        $result = $conn->query($sql);
        $strands = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $strands[] = $row;
            }
        }
        echo json_encode($strands);
        break;

    case "POST":
        if (!empty($data->strand) && !empty($data->description) && !empty($data->start) && !empty($data->end) && !empty($data->curriculum) && !empty($data->grade)) {
            $stmt = $conn->prepare("INSERT INTO strands (strand, description, section, start, end, curriculum, grade) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssss", $data->strand, $data->description, $data->section, $data->start, $data->end, $data->curriculum, $data->grade);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Strand added successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to add strand."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for strand."]);
        }
        break;

    case "PUT":
        if (!empty($data->strand_id) && !empty($data->strand) && !empty($data->description) && !empty($data->start) && !empty($data->end) && !empty($data->curriculum) && !empty($data->grade)) {
            $stmt = $conn->prepare("UPDATE strands SET strand = ?, description = ?, section = ?, start = ?, end = ?, curriculum = ?, grade = ? WHERE strand_id = ?");
            $stmt->bind_param("sssssssi", $data->strand, $data->description, $data->section, $data->start, $data->end, $data->curriculum, $data->grade, $data->strand_id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Strand updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update strand."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for update."]);
        }
        break;

    case "DELETE":
        if (!empty($data->strand_id)) {
            $stmt = $conn->prepare("DELETE FROM strands WHERE strand_id = ?");
            $stmt->bind_param("i", $data->strand_id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Strand deleted successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete strand."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for deletion."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
        break;
}

$conn->close();
?>
