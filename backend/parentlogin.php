<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "northills";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Retrieve input from the request body
    $data = json_decode(file_get_contents("php://input"));

    $parent_user_id = isset($data->parent_user_id) ? $data->parent_user_id : '';
    $parent_password = isset($data->parent_password) ? $data->parent_password : '';

    if (empty($parent_user_id) || empty($parent_password)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Username and password are required."]);
        exit();
    }

    // Prepare SQL query to check if the credentials exist in the enrolledstudents table
    $stmt = $conn->prepare("SELECT student_id, parent_user_id, parent_password FROM enrolledstudent WHERE parent_user_id = ? AND parent_password = ?");
    
    // Check if the prepare statement was successful
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
        exit();
    }

    $stmt->bind_param("ss", $parent_user_id, $parent_password); // Bind parameters
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Successful login, retrieve student_id
        $row = $result->fetch_assoc();
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login successful.",
            "student_id" => $row['student_id'] // Pass the student_id in the response
        ]);
    } else {
        // Invalid credentials
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid username or password."]);
    }

    $stmt->close();
}

$conn->close();
?>
