<?php
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content response for preflight
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

// Get the data from the request
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid data format."]);
    exit();
}

try {
    $faculty_id = $data['faculty_id'];

    // Check if faculty_id exists in the facultyinfo table
    $stmt = $conn->prepare("SELECT * FROM facultyinfo WHERE faculty_id = ?");
    $stmt->bind_param("i", $faculty_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 0) {
        echo json_encode(["success" => false, "message" => "Faculty ID not found."]);
        exit();
    }
    $stmt->close();

    // Begin transaction to ensure atomicity of all updates
    $conn->begin_transaction();

    // Convert the base64-encoded image to binary data for BLOB fields
    $image_data = isset($data['image_path']) ? base64_decode($data['image_path']) : null;

    // Update Faculty Information
    $stmt = $conn->prepare("
        UPDATE facultyinfo
        SET
            first_name = ?, last_name = ?, middle_name = ?, suffix = ?, age = ?, 
            birthday = ?, birthplace = ?, civil_status = ?, religion = ?, citizenship = ?, 
            sex = ?, contact_number = ?, email = ?, image_path = ? 
        WHERE faculty_id = ?
    ");
    $stmt->bind_param(
        "ssssssssssssssi",
        $data['first_name'],
        $data['last_name'],
        $data['middle_name'],
        $data['suffix'],
        $data['age'],
        $data['birthday'],
        $data['birthplace'],
        $data['civil_status'],
        $data['religion'],
        $data['citizenship'],
        $data['sex'],
        $data['contact_number'],
        $data['email'],
        $image_data,
        $faculty_id
    );
    if (!$stmt->execute()) {
        throw new Exception("Error updating faculty info: " . $stmt->error);
    }
    $stmt->close();

    // Update Present Address
    $stmt = $conn->prepare("
        UPDATE facultypresent
        SET
            house_street_purok = ?, barangay = ?, municipality = ?, province = ?, zip_code = ?
        WHERE faculty_id = ?
    ");
    $stmt->bind_param(
        "sssssi",
        $data['present_address']['house_street_purok'],
        $data['present_address']['barangay'],
        $data['present_address']['municipality'],
        $data['present_address']['province'],
        $data['present_address']['zip_code'],
        $faculty_id
    );
    if (!$stmt->execute()) {
        throw new Exception("Error updating present address: " . $stmt->error);
    }
    $stmt->close();

    // Update Permanent Address
    $stmt = $conn->prepare("
        UPDATE facultypermanent
        SET
            house_street_purok = ?, barangay = ?, municipality = ?, province = ?, zip_code = ?
        WHERE faculty_id = ?
    ");
    $stmt->bind_param(
        "sssssi",
        $data['permanent_address']['house_street_purok'],
        $data['permanent_address']['barangay'],
        $data['permanent_address']['municipality'],
        $data['permanent_address']['province'],
        $data['permanent_address']['zip_code'],
        $faculty_id
    );
    if (!$stmt->execute()) {
        throw new Exception("Error updating permanent address: " . $stmt->error);
    }
    $stmt->close();

    // Update Education Information for Elementary, Junior, and College Separately
    // Update Elementary Education
    if (isset($data['elementary'])) {
        $edu = $data['elementary'];
        $stmt = $conn->prepare("
            UPDATE facultyelem
            SET
                school_name = ?, year_graduated = ?
            WHERE faculty_id = ?
        ");
        $stmt->bind_param(
            "ssi",
            $edu['school_name'],
            $edu['year_graduated'],
            $faculty_id
        );
        if (!$stmt->execute()) {
            throw new Exception("Error updating elementary education: " . $stmt->error);
        }
        $stmt->close();
    }

    // Update Junior High Education
    if (isset($data['junior'])) {
        $edu = $data['junior'];
        $stmt = $conn->prepare("
            UPDATE facultyjunior
            SET
                school_name = ?, year_graduated = ?
            WHERE faculty_id = ?
        ");
        $stmt->bind_param(
            "ssi",
            $edu['school_name'],
            $edu['year_graduated'],
            $faculty_id
        );
        if (!$stmt->execute()) {
            throw new Exception("Error updating junior education: " . $stmt->error);
        }
        $stmt->close();
    }

    // Update College Education
    if (isset($data['college'])) {
        $edu = $data['college'];
        $stmt = $conn->prepare("
            UPDATE facultycollege
            SET
                school_name = ?, course = ?, year_graduated = ?
            WHERE faculty_id = ?
        ");
        $stmt->bind_param(
            "sssi",
            $edu['school_name'],
            $edu['course'],
            $edu['year_graduated'],
            $faculty_id
        );
        if (!$stmt->execute()) {
            throw new Exception("Error updating college education: " . $stmt->error);
        }
        $stmt->close();
    }

    // Update Father Information
    if (isset($data['father'])) {
        $father = $data['father'];
        $stmt = $conn->prepare("
            UPDATE facultyfather
            SET
                first_name = ?, last_name = ?, middle_name = ?, age = ?, occupation = ?, phone_number = ?, educational_attainment = ?
            WHERE faculty_id = ?
        ");
        $stmt->bind_param(
            "sssisssi",
            $father['first_name'],
            $father['last_name'],
            $father['middle_name'],
            $father['age'],
            $father['occupation'],
            $father['phone_number'],
            $father['educational_attainment'],
            $faculty_id
        );
        if (!$stmt->execute()) {
            throw new Exception("Error updating father's data: " . $stmt->error);
        }
        $stmt->close();
    }

    // Update Mother Information
    if (isset($data['mother'])) {
        $mother = $data['mother'];
        $stmt = $conn->prepare("
            UPDATE facultymother
            SET
                first_name = ?, last_name = ?, middle_name = ?, age = ?, occupation = ?, phone_number = ?, educational_attainment = ?
            WHERE faculty_id = ?
        ");
        $stmt->bind_param(
            "sssisssi",
            $mother['first_name'],
            $mother['last_name'],
            $mother['middle_name'],
            $mother['age'],
            $mother['occupation'],
            $mother['phone_number'],
            $mother['educational_attainment'],
            $faculty_id
        );
        if (!$stmt->execute()) {
            throw new Exception("Error updating mother's data: " . $stmt->error);
        }
        $stmt->close();
    }

    // Update Siblings Information Independently
    if (isset($data['siblings'])) {
        foreach ($data['siblings'] as $sibling) {
            $stmt = $conn->prepare("
                UPDATE facultysibling
                SET
                    first_name = ?, last_name = ?, middle_name = ?, age = ?, occupation = ?, phone_number = ?, educational_attainment = ?
                WHERE faculty_id = ?
            ");
            $stmt->bind_param(
                "sssisssi",
                $sibling['first_name'],
                $sibling['last_name'],
                $sibling['middle_name'],
                $sibling['age'],
                $sibling['occupation'],
                $sibling['phone_number'],
                $sibling['educational_attainment'],
                $faculty_id
            );
            if (!$stmt->execute()) {
                throw new Exception("Error updating sibling data: " . $stmt->error);
            }
            $stmt->close();
        }
    }

    // Commit the transaction
    $conn->commit();

    // Send success response
    echo json_encode(["success" => true, "message" => "Data has been updated successfully."]);

} catch (Exception $e) {
    // Rollback the transaction on error
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

// Close the connection
$conn->close();
?>
