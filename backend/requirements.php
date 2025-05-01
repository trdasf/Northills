<?php
// Handle CORS Preflight (OPTIONS request)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Handle GET request to fetch existing data
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    header("Content-Type: application/json");

    $student_id = $_GET['student_id'] ?? null;

    if (!$student_id) {
        http_response_code(400);
        echo json_encode(["message" => "Student ID is required."]);
        exit();
    }

    $sql = "SELECT * FROM finalstep WHERE student_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode(["status" => "success", "requirements" => $row]);
    } else {
        echo json_encode(["status" => "error", "message" => "No records found for the student ID."]);
    }

    $stmt->close();
    $conn->close();
    exit();
}

// Handle POST request for updating or inserting data
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    header("Content-Type: application/json");

    $data = json_decode(file_get_contents("php://input"), true);

    $student_id = $data['student_id'] ?? null;
    $requirements = $data['requirements'] ?? null;
    $remark = $data['remark'] ?? "PENDING";
    $section = $data['section'] ?? null;

    if (!$student_id || !$requirements) {
        http_response_code(400);
        echo json_encode(["message" => "Student ID and requirements are required."]);
        exit();
    }

    $update_values = [];
    foreach ($requirements as $key => $status) {
        $update_values[$key] = $status;
    }

    $check_sql = "SELECT * FROM finalstep WHERE student_id = ?";
    $stmt_check = $conn->prepare($check_sql);
    $stmt_check->bind_param("i", $student_id);
    $stmt_check->execute();
    $result = $stmt_check->get_result();

    if ($result->num_rows > 0) {
        // Update existing record
        $update_sql = "UPDATE finalstep SET " . implode(', ', array_map(fn($col) => "$col = ?", array_keys($update_values))) . ", status = ? WHERE student_id = ?";
        $stmt_update = $conn->prepare($update_sql);

        if (!$stmt_update) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to prepare the update statement."]);
            exit();
        }

        $params = array_values($update_values);
        $params[] = $remark;
        $params[] = $student_id;
        $stmt_update->bind_param(str_repeat('s', count($update_values)) . 'si', ...$params);

        if ($stmt_update->execute()) {
            if ($section) {
                $section_sql = "UPDATE enrollmentdata SET section = ? WHERE student_id = ?";
                $stmt_section = $conn->prepare($section_sql);
                $stmt_section->bind_param("si", $section, $student_id);
                $stmt_section->execute();
                $stmt_section->close();
            }
            echo json_encode(["success" => true, "message" => "Requirements successfully updated."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update requirements and remark."]);
        }
        $stmt_update->close();
    } else {
        // Insert new record if not found
        $insert_sql = "INSERT INTO finalstep (student_id, " . implode(", ", array_keys($update_values)) . ", status) VALUES (?, " . implode(", ", array_fill(0, count($update_values), '?')) . ", ?)";
        $stmt_insert = $conn->prepare($insert_sql);

        if (!$stmt_insert) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to prepare the insert statement."]);
            exit();
        }

        $params = array_merge([$student_id], array_values($update_values), [$remark]);
        $stmt_insert->bind_param('i' . str_repeat('s', count($update_values)) . 's', ...$params);

        if ($stmt_insert->execute()) {
            if ($section) {
                $section_sql = "INSERT INTO enrollmentdata (student_id, section) VALUES (?, ?) ON DUPLICATE KEY UPDATE section = ?";
                $stmt_section = $conn->prepare($section_sql);
                $stmt_section->bind_param("iss", $student_id, $section, $section);
                $stmt_section->execute();
                $stmt_section->close();
            }
            echo json_encode(["success" => true, "message" => "New record created and requirements updated."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to insert new requirements record."]);
        }
        $stmt_insert->close();
    }

    $stmt_check->close();
    $conn->close();
}
?>
