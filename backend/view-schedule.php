<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Database connection
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

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $date = isset($_GET['date']) ? $_GET['date'] : null;
    $time = isset($_GET['time']) ? $_GET['time'] : null;

    // Log received parameters for debugging
    error_log("Received Date: $date, Time: $time");

    if ($date && $time) {
        $sql = "
        SELECT 
            fs.student_id,
            pi.last_name, 
            pi.first_name, 
            pi.email, 
            pi.contact_number,
            ed.LRN, 
            ed.strand_track,
            fs.birth_certificate,
            fs.good_moral,
            fs.highschool_diploma,
            fs.TOR,
            fs.id_picture
        FROM finalstep fs
        JOIN personalinfo pi ON fs.student_id = pi.student_id
        JOIN enrollmentdata ed ON fs.student_id = ed.student_id
        WHERE fs.submission_date = ? AND fs.submission_time = ?;
        ";

        $stmt = $conn->prepare($sql);
        if ($stmt) {
            // Bind parameters and execute query
            $stmt->bind_param("ss", $date, $time);
            $stmt->execute();
            $result = $stmt->get_result();

            $students = [];
            while ($row = $result->fetch_assoc()) {
                $students[] = [
                    "student_id" => $row["student_id"],
                    "name" => $row["first_name"] . " " . $row["last_name"],
                    "email" => $row["email"],
                    "contact_number" => $row["contact_number"],
                    "LRN" => $row["LRN"],
                    "strand" => $row["strand_track"],
                    "birth_certificate" => $row["birth_certificate"], // "SUBMITTED" or "NOT_SUBMITTED"
                    "good_moral" => $row["good_moral"],               // "SUBMITTED" or "NOT_SUBMITTED"
                    "highschool_diploma" => $row["highschool_diploma"], // "SUBMITTED" or "NOT_SUBMITTED"
                    "TOR" => $row["TOR"],                             // "SUBMITTED" or "NOT_SUBMITTED"
                    "id_picture" => $row["id_picture"],               // "SUBMITTED" or "NOT_SUBMITTED"
                ];
            }

            echo json_encode(["success" => true, "students" => $students]);
        } else {
            // Log query error
            error_log("Query Preparation Error: " . $conn->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to execute query."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid parameters."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed."]);
}

$conn->close();
?>
