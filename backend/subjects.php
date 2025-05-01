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
        if (isset($_GET['type'])) {
            if ($_GET['type'] === 'strands') {
                $sql = "SELECT strand FROM strands";
                $result = $conn->query($sql);
                $strands = [];
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $strands[] = $row;
                    }
                } else {
                    error_log("Error fetching strands: " . $conn->error);
                }
                echo json_encode($strands);
            } elseif ($_GET['type'] === 'faculty') {
                $sql = "SELECT faculty_id, facultyName FROM faculty"; // Corrected to use faculty_id
                $result = $conn->query($sql);
                $faculty = [];
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $faculty[] = $row;
                    }
                } else {
                    error_log("Error fetching faculty: " . $conn->error);
                }
                echo json_encode($faculty);
            } elseif ($_GET['type'] === 'sections') {
                if (isset($_GET['strand'])) {
                    $strand = $conn->real_escape_string($_GET['strand']);
                    $sql = "SELECT section FROM strands WHERE strand = '$strand'";
                } else {
                    $sql = "SELECT section FROM strands";
                }
            
                $result = $conn->query($sql);
                $sections = [];
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $sections[] = $row;
                    }
                } else {
                    error_log("Error fetching sections: " . $conn->error);
                }
                echo json_encode($sections);
            }
            
        } else {
            // Default to fetching subjects
            $sql = "SELECT * FROM subjects";
            $result = $conn->query($sql);
            $subjects = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $subjects[] = $row;
                }
            } else {
                error_log("Error fetching subjects: " . $conn->error);
            }
            echo json_encode($subjects);
        }
        break;

    case "POST":
        // Log received POST data
        error_log("Received POST data: " . json_encode($data));

        // Check if the necessary fields are provided in the POST request
        if (!empty($data->description) && !empty($data->codeNo) && !empty($data->semester) && !empty($data->teacher) && !empty($data->schedule) && !empty($data->grade) && !empty($data->section) && !empty($data->strand) && !empty($data->unit) && !empty($data->faculty_id)) {
            
            $stmt = $conn->prepare("INSERT INTO subjects (description, codeNo, semester, teacher, schedule, grade, section, strand, unit, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            if ($stmt === false) {
                error_log("Error preparing statement: " . $conn->error); // Log statement preparation error
                echo json_encode(["success" => false, "message" => "Error preparing the SQL statement."]);
                exit();
            }

            // Bind the parameters and execute the query
            $stmt->bind_param("sssssssssi", $data->description, $data->codeNo, $data->semester, $data->teacher, $data->schedule, $data->grade, $data->section, $data->strand, $data->unit, $data->faculty_id);
            $executeResult = $stmt->execute();

            if ($executeResult) {
                echo json_encode(["success" => true]);
            } else {
                error_log("Error executing statement: " . $stmt->error); // Log execution error
                echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Missing required data."]);
        }
        break;

    case "PUT":
        error_log("Incoming PUT data: " . json_encode($data));  // Log incoming data
        
        if (empty($data->subject_id)) {
            echo json_encode(["success" => false, "message" => "subject_id is required for update."]);
            exit();
        }
    
        $updateFields = [];
        $updateValues = [];
    
        if (!empty($data->description)) {
            $updateFields[] = "description = ?";
            $updateValues[] = $data->description;
        }
        if (!empty($data->codeNo)) {
            $updateFields[] = "codeNo = ?";
            $updateValues[] = $data->codeNo;
        }
        if (!empty($data->semester)) {
            $updateFields[] = "semester = ?";
            $updateValues[] = $data->semester;
        }
        if (!empty($data->teacher)) {
            $updateFields[] = "teacher = ?";
            $updateValues[] = $data->teacher;
        }
        if (!empty($data->schedule)) {
            $updateFields[] = "schedule = ?";
            $updateValues[] = $data->schedule;
        }
        if (!empty($data->grade)) {
            $updateFields[] = "grade = ?";
            $updateValues[] = $data->grade;
        }
        if (!empty($data->section)) {
            $updateFields[] = "section = ?";
            $updateValues[] = $data->section;
        }
        if (!empty($data->strand)) {
            $updateFields[] = "strand = ?";
            $updateValues[] = $data->strand;
        }
        if (!empty($data->unit)) {
            $updateFields[] = "unit = ?";
            $updateValues[] = $data->unit;
        }
        if (!empty($data->faculty_id)) {
            $updateFields[] = "faculty_id = ?";  // Update faculty_id
            $updateValues[] = $data->faculty_id;
        }
    
        $updateValues[] = $data->subject_id; // Ensure subject_id is at the end for binding

    if (count($updateFields) > 0) {
        $sql = "UPDATE subjects SET " . implode(", ", $updateFields) . " WHERE subject_id = ?";
        error_log("SQL Query: " . $sql); // Log the query for debugging
        error_log("Update Values: " . implode(", ", $updateValues)); // Log the values

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(str_repeat("s", count($updateValues) - 1) . "i", ...$updateValues);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Subject updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => $stmt->error]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "No fields to update."]);
    }
    break;

    case "DELETE":
        if (!empty($data->subject_id)) {
            $stmt = $conn->prepare("DELETE FROM subjects WHERE subject_id = ?");
            $stmt->bind_param("i", $data->subject_id);
            
            if ($stmt->execute()) {
                // Check if any rows were deleted
                if ($conn->affected_rows > 0) {
                    echo json_encode(["success" => true, "message" => "Subject deleted successfully."]);
                } else {
                    // If no rows were deleted
                    echo json_encode(["success" => false, "message" => "Subject ID not found or already deleted."]);
                }
            } else {
                echo json_encode(["success" => false, "message" => $stmt->error]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Invalid subject_id."]);
        }
        break;
    }    

$conn->close();
?>
