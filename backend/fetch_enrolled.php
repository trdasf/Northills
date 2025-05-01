<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection setup
$servername = "localhost";
$username = "u572625467_groupV";
$password = "Northills_12345";
$dbname = "u572625467_northills";

// Create the connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// SQL query to fetch approved applicants
$sql = "SELECT personalinfo.student_id, 
                CONCAT(personalinfo.last_name, ', ', personalinfo.first_name) AS name,
                personalinfo.email, 
                enrollmentdata.strand_track AS strand, 
                enrollmentdata.grade_level AS gradeLevel, 
                enrollmentdata.section 
        FROM finalstep
        JOIN personalinfo ON finalstep.student_id = personalinfo.student_id
        JOIN enrollmentdata ON personalinfo.student_id = enrollmentdata.student_id
        WHERE finalstep.status = 'APPROVE'";

$result = $conn->query($sql);

// Check if data exists and output as JSON
$applicants = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $applicants[] = [
            "student_id" => $row["student_id"],
            "name" => $row["name"],
            "email" => $row["email"],
            "strand" => $row["strand"],
            "gradeLevel" => $row["gradeLevel"],
            "section" => $row["section"]
        ];
    }
    echo json_encode(["success" => true, "applicants" => $applicants]);
} else {
    // Return an empty list instead of a message
    echo json_encode(["success" => true, "applicants" => []]);
}

// Close the database connection
$conn->close();
?>
