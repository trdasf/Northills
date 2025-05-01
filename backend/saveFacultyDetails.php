<?php
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    if ($result->num_rows > 0) {
        // If faculty_id exists, proceed with updating the data
        // You can fetch the existing data here if you need to return it to the client (optional)
        // $faculty_info = $result->fetch_assoc(); // Already fetched at the start

        echo json_encode(["success" => true, "message" => "Faculty already exists. Proceeding with updates."]);

        // No need to insert; just update all related tables as needed (refer to the insert/update logic below)
    } else {
        // If faculty_id does not exist, insert new data
        echo json_encode(["success" => true, "message" => "Faculty not found. Adding new record."]);
    }

    // Begin transaction to ensure atomicity of all inserts/updates
    $conn->begin_transaction();

    // Convert the base64-encoded image to binary data for BLOB fields
    $image_data = isset($data['image_path']) ? base64_decode($data['image_path']) : null;

    // Insert or Update Faculty Information
    $stmt = $conn->prepare("
        INSERT INTO facultyinfo (faculty_id, first_name, last_name, middle_name, suffix, age, birthday, birthplace, civil_status, religion, citizenship, sex, contact_number, email, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        middle_name = VALUES(middle_name),
        suffix = VALUES(suffix),
        age = VALUES(age),
        birthday = VALUES(birthday),
        birthplace = VALUES(birthplace),
        civil_status = VALUES(civil_status),
        religion = VALUES(religion),
        citizenship = VALUES(citizenship),
        sex = VALUES(sex),
        contact_number = VALUES(contact_number),
        email = VALUES(email),
        image_path = VALUES(image_path)
    ");
    $stmt->bind_param(
        "isssisssssssssb",
        $faculty_id,
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
        $image_data
    );
    $stmt->send_long_data(14, $image_data); // Send binary image data for BLOB field
    $stmt->execute();
    $stmt->close();

    // Insert or Update Present Address
    $stmt = $conn->prepare("
        INSERT INTO facultypresent (faculty_id, house_street_purok, barangay, municipality, province, zip_code)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        house_street_purok = VALUES(house_street_purok),
        barangay = VALUES(barangay),
        municipality = VALUES(municipality),
        province = VALUES(province),
        zip_code = VALUES(zip_code)
    ");
    $stmt->bind_param(
        "isssss",
        $faculty_id,
        $data['present_address']['house_street_purok'],
        $data['present_address']['barangay'],
        $data['present_address']['municipality'],
        $data['present_address']['province'],
        $data['present_address']['zip_code']
    );
    $stmt->execute();
    $stmt->close();

    // Insert or Update Permanent Address (similar to Present Address)
    $stmt = $conn->prepare("
        INSERT INTO facultypermanent (faculty_id, house_street_purok, barangay, municipality, province, zip_code)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        house_street_purok = VALUES(house_street_purok),
        barangay = VALUES(barangay),
        municipality = VALUES(municipality),
        province = VALUES(province),
        zip_code = VALUES(zip_code)
    ");
    $stmt->bind_param(
        "isssss",
        $faculty_id,
        $data['permanent_address']['house_street_purok'],
        $data['permanent_address']['barangay'],
        $data['permanent_address']['municipality'],
        $data['permanent_address']['province'],
        $data['permanent_address']['zip_code']
    );
    $stmt->execute();
    $stmt->close();

    // Insert or Update Education (for each education level)
    $education_fields = [
        'elementary' => "facultyelem",
        'junior' => "facultyjunior",
        'senior' => "facultysenior",
        'college' => "facultycollege"
    ];

    foreach ($education_fields as $key => $table) {
        $edu = $data['education'][$key];
        $stmt = $conn->prepare("
            INSERT INTO $table (faculty_id, school_name, year_graduated)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
            school_name = VALUES(school_name),
            year_graduated = VALUES(year_graduated)
        ");
        $stmt->bind_param(
            "iss",
            $faculty_id,
            $edu['school_name'],
            $edu['year_graduated']
        );
        $stmt->execute();
        $stmt->close();
    }

    // Insert or Update Family (Father, Mother, and Siblings)
    $family_roles = ['father', 'mother'];
    foreach ($family_roles as $role) {
        $family = $data['family'][$role];
        $table = "faculty$role";
        $stmt = $conn->prepare("
            INSERT INTO $table (faculty_id, first_name, last_name, middle_name, age, occupation, phone_number, educational_attainment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            middle_name = VALUES(middle_name),
            age = VALUES(age),
            occupation = VALUES(occupation),
            phone_number = VALUES(phone_number),
            educational_attainment = VALUES(educational_attainment)
        ");
        $stmt->bind_param(
            "isssisss",
            $faculty_id,
            $family['first_name'],
            $family['last_name'],
            $family['middle_name'],
            $family['age'],
            $family['occupation'],
            $family['phone_number'],
            $family['education']
        );
        $stmt->execute();
        $stmt->close();
    }

    // Handle siblings in the same way as family members (Father, Mother)
    foreach ($data['family']['siblings'] as $sibling) {
        $stmt = $conn->prepare("
            INSERT INTO facultysibling (faculty_id, first_name, last_name, middle_name, age, occupation, phone_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            middle_name = VALUES(middle_name),
            age = VALUES(age),
            occupation = VALUES(occupation),
            phone_number = VALUES(phone_number)
        ");
        $stmt->bind_param(
            "isssiss",
            $faculty_id,
            $sibling['first_name'],
            $sibling['last_name'],
            $sibling['middle_name'],
            $sibling['age'],
            $sibling['occupation'],
            $sibling['phone_number']
        );
        $stmt->execute();
        $stmt->close();
    }

    // Commit transaction to save all changes
    $conn->commit();
    echo json_encode(["success" => true, "message" => "Faculty record updated/inserted successfully."]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$conn->close();
?>
