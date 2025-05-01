<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

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

$response = [];

// Fetch PENDING applicants
$sql = "SELECT COUNT(*) AS pendingApplicants FROM finalstep WHERE status = 'PENDING'";
$result = $conn->query($sql);
$response['pendingApplicants'] = $result ? $result->fetch_assoc()['pendingApplicants'] : 0;

// Fetch APPROVED applicants (enrolled students)
$sql = "SELECT COUNT(*) AS enrolledStudents FROM finalstep WHERE status = 'APPROVE'";
$result = $conn->query($sql);
$response['enrolledStudents'] = $result ? $result->fetch_assoc()['enrolledStudents'] : 0;

// Fetch the number of subjects
$sql = "SELECT COUNT(*) AS subjects FROM subjects";
$result = $conn->query($sql);
$response['subjects'] = $result ? $result->fetch_assoc()['subjects'] : 0;

// Fetch the number of strands
$sql = "SELECT COUNT(*) AS strands FROM strands";
$result = $conn->query($sql);
$response['strands'] = $result ? $result->fetch_assoc()['strands'] : 0;

// Fetch the number of available slots
$sql = "SELECT SUM(slots) AS availableSlots FROM schedule";
$result = $conn->query($sql);
$response['availableSlots'] = $result ? $result->fetch_assoc()['availableSlots'] : 0;

// Fetch the number of faculties
$sql = "SELECT COUNT(*) AS faculties FROM faculty";
$result = $conn->query($sql);
$response['faculties'] = $result ? $result->fetch_assoc()['faculties'] : 0;

// Fetch the number of male and female students who are APPROVED
$sql = "
    SELECT pi.sex, COUNT(*) AS count 
    FROM personalinfo pi
    JOIN finalstep fs ON pi.student_id = fs.student_id
    WHERE fs.status = 'APPROVE'
    GROUP BY pi.sex";
$result = $conn->query($sql);
$genderCounts = ["male" => 0, "female" => 0];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $genderCounts[strtolower($row['sex'])] = $row['count'];
    }
}
$response['maleStudents'] = $genderCounts['male'];
$response['femaleStudents'] = $genderCounts['female'];

// Fetch enrollment data by school year from 2024 to 2030
$sql = "
    SELECT 
        LEFT(e.school_year, 4) AS year, 
        COUNT(*) AS count 
    FROM finalstep f
    JOIN enrollmentdata e ON f.student_id = e.student_id
    WHERE f.status = 'APPROVE' AND LEFT(e.school_year, 4) BETWEEN '2024' AND '2030'
    GROUP BY year 
    ORDER BY year ASC";
$result = $conn->query($sql);

$enrollmentData = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $enrollmentData[$row['year']] = $row['count'];
    }
} else {
    error_log("Enrollment data query failed: " . $conn->error);
}

// Fill missing years from 2024 to 2030 with 0
for ($year = 2024; $year <= 2030; $year++) {
    if (!isset($enrollmentData[$year])) {
        $enrollmentData[$year] = 0;
    }
}

// Sort the years to ensure proper order
ksort($enrollmentData);

// Prepare the response
$response['enrollmentData'] = [];
foreach ($enrollmentData as $year => $count) {
    $response['enrollmentData'][] = [
        "school_year" => $year,
        "count" => $count,
    ];
}

// Return the response
echo json_encode($response);

$conn->close();
?>