<?php
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

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
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$faculty_id = isset($_GET['faculty_id']) ? $_GET['faculty_id'] : null;

if (!$faculty_id) {
    echo json_encode(["success" => false, "message" => "Faculty ID is required."]);
    exit();
}

try {
    // Fetch faculty info
    $stmt = $conn->prepare("SELECT * FROM facultyinfo WHERE faculty_id = ?");
    $stmt->bind_param("i", $faculty_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $faculty_info = $result->fetch_assoc();

        // Convert image_path (BLOB) to Base64 if available
        if (isset($faculty_info['image_path']) && $faculty_info['image_path'] !== null) {
            $faculty_info['image_path'] = base64_encode($faculty_info['image_path']);
        }

        // Fetch related data from other tables
        $related_tables = [
            "facultypresent" => "present_address",
            "facultypermanent" => "permanent_address",
            "facultyelem" => "elementary",
            "facultyjunior" => "junior",
            "facultycollege" => "college",
            "facultyfather" => "father",
            "facultymother" => "mother"
        ];

        foreach ($related_tables as $table => $key) {
            $stmt = $conn->prepare("SELECT * FROM $table WHERE faculty_id = ?");
            $stmt->bind_param("i", $faculty_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $faculty_info[$key] = $result->fetch_assoc();
            } else {
                $faculty_info[$key] = null; // If no data exists, set it to null
            }
        }

        // Debugging: Check if the education and family info are being fetched
        // Log these values to check what is being returned
        // For production, you might want to remove or comment out these debug logs
        file_put_contents('debug.log', print_r($faculty_info, true), FILE_APPEND);

        // Fetch siblings
        $stmt = $conn->prepare("SELECT * FROM facultysibling WHERE faculty_id = ?");
        $stmt->bind_param("i", $faculty_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $faculty_info['siblings'] = [];
        while ($row = $result->fetch_assoc()) {
            $faculty_info['siblings'][] = $row;
        }

        echo json_encode(["success" => true, "data" => $faculty_info]);
    } else {
        echo json_encode(["success" => false, "message" => "Faculty not found."]);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
}
?>
