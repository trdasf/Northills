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
        if ($_GET['type'] == 'faculty') {
            // Fetch faculty data
            $sql = "SELECT * FROM faculty";
            $result = $conn->query($sql);
            $faculty = [];
            while ($row = $result->fetch_assoc()) {
                $faculty[] = $row;
            }
            echo json_encode($faculty);
        } elseif ($_GET['type'] == 'strands') {
            // Fetch only strand names from the strands table (without strand_id)
            $sql = "SELECT strand FROM strands";
            $result = $conn->query($sql);

            if ($result) {
                $strands = [];
                while ($row = $result->fetch_assoc()) {
                    $strands[] = $row['strand']; // Only add the strand name
                }
                echo json_encode($strands);  // Send an array of strand names only
            } else {
                // If no strands are found or query fails, send an error response
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to fetch strands data."]);
            }
        }
        break;

    case "POST":
        if (!empty($data->facultyName) && !empty($data->email) && !empty($data->contactNum) && !empty($data->strand) && !empty($data->facultyStatus)) {
            $stmt = $conn->prepare("INSERT INTO faculty (facultyName, email, contactNum, strand, facultyStatus) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $data->facultyName, $data->email, $data->contactNum, $data->strand, $data->facultyStatus);
            if ($stmt->execute()) {
                // Get the last inserted faculty_id
                $faculty_id = $conn->insert_id;

                // Insert the faculty_id into the related tables
                $relatedTables = [
                    "facultyinfo",
                    "facultyelem",
                    "facultyjunior",
                    "facultycollege",
                    "facultyfather",
                    "facultymother",
                    "facultysibling",
                    "facultypermanent",
                    "facultypresent"
                ];

                $allSuccess = true;

                foreach ($relatedTables as $table) {
                    $sql = "INSERT INTO $table (faculty_id) VALUES (?)";
                    $relatedStmt = $conn->prepare($sql);
                    $relatedStmt->bind_param("i", $faculty_id);

                    if (!$relatedStmt->execute()) {
                        $allSuccess = false;
                        break;
                    }

                    $relatedStmt->close();
                }

                if ($allSuccess) {
                    echo json_encode(["success" => true, "message" => "Faculty and related data added successfully."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Failed to add data to related tables."]);
                }
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to add faculty."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for faculty."]);
        }
        break;

    case "PUT":
        if (!empty($data->faculty_id) && !empty($data->facultyName) && !empty($data->email) && !empty($data->contactNum) && !empty($data->strand) && !empty($data->facultyStatus)) {
            $stmt = $conn->prepare("UPDATE faculty SET facultyName = ?, email = ?, contactNum = ?, strand = ?, facultyStatus = ? WHERE faculty_id = ?");
            $stmt->bind_param("sssssi", $data->facultyName, $data->email, $data->contactNum, $data->strand, $data->facultyStatus, $data->faculty_id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Faculty updated successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update faculty."]);
            }
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data for update."]);
        }
        break;

    case "DELETE":
        if (!empty($data->faculty_id)) {
            // Delete from related tables first
            $relatedTables = [
                "facultyinfo",
                "facultyelem",
                "facultyjunior",
                "facultycollege",
                "facultyfather",
                "facultymother",
                "facultysibling",
                "facultypermanent",
                "facultypresent"
            ];

            $allSuccess = true;

            foreach ($relatedTables as $table) {
                $sql = "DELETE FROM $table WHERE faculty_id = ?";
                $relatedStmt = $conn->prepare($sql);
                $relatedStmt->bind_param("i", $data->faculty_id);

                if (!$relatedStmt->execute()) {
                    $allSuccess = false;
                    break;
                }

                $relatedStmt->close();
            }

            if ($allSuccess) {
                // Delete from the main faculty table
                $stmt = $conn->prepare("DELETE FROM faculty WHERE faculty_id = ?");
                $stmt->bind_param("i", $data->faculty_id);
                if ($stmt->execute()) {
                    echo json_encode(["success" => true, "message" => "Faculty and related data deleted successfully."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Failed to delete faculty."]);
                }
                $stmt->close();
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete data from related tables."]);
            }
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
