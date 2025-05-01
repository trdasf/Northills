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
        $sql = "SELECT * FROM schedule";
        $result = $conn->query($sql);
        $schedule = [];
        while ($row = $result->fetch_assoc()) {
            $schedule[] = $row;
        }
        echo json_encode($schedule);
        break;

    case "POST":
        if (!empty($data->date) && !empty($data->time) && !empty($data->slots)) {
            // Insert new schedule
            $stmt = $conn->prepare("INSERT INTO schedule (date, time, slots) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $data->date, $data->time, $data->slots);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Schedule added successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to add schedule."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for schedule."]);
        }
        break;

    case "PUT":
        // Log incoming data to debug
        error_log(print_r($data, true)); // Log the received data
        
        // Make sure schedule_id is not empty
        if (!empty($data->schedule_id) && !empty($data->date) && !empty($data->time) && !empty($data->slots)) {
            $stmt = $conn->prepare("UPDATE schedule SET date = ?, time = ?, slots = ? WHERE schedule_id = ?");
            $stmt->bind_param("sssi", $data->date, $data->time, $data->slots, $data->schedule_id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Schedule updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update schedule."]);
            }
            $stmt->close();
        } else {
            // Log the invalid data to debug
            error_log("Invalid data for update: " . json_encode($data));
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for update."]);
        }
        break;
        
    case "DELETE":
        if (!empty($data->schedule_id)) {
            $stmt = $conn->prepare("DELETE FROM schedule WHERE schedule_id = ?");
            $stmt->bind_param("i", $data->schedule_id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Schedule deleted successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete schedule."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for deletion."]);
        }
        break;

    case "UPDATE_SLOTS":
        // Check the number of students who selected this schedule (same date and time)
        if (!empty($data->date) && !empty($data->time)) {
            // Get the number of students who selected this date and time
            $query = "SELECT COUNT(*) as student_count FROM finalstep WHERE submission_date = ? AND submission_time = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ss", $data->date, $data->time);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $studentCount = $row['student_count'];

            // Subtract the student count from available slots
            $updateQuery = "UPDATE schedule SET slots = slots - ? WHERE date = ? AND time = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bind_param("iss", $studentCount, $data->date, $data->time);
            if ($updateStmt->execute()) {
                echo json_encode(["success" => true, "message" => "Slots updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update slots."]);
            }

            $stmt->close();
            $updateStmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for updating slots."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
        break;
}

$conn->close();
?>
