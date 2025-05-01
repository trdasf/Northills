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

// Initialize response array
$response = ['success' => true];

// Get the columns from both tables to ensure we're using the correct ones
$columnsQuery = "DESCRIBE personalinfo";
$columnsResult = $conn->query($columnsQuery);
$personalInfoColumns = [];
if ($columnsResult && $columnsResult->num_rows > 0) {
    while ($row = $columnsResult->fetch_assoc()) {
        $personalInfoColumns[] = $row['Field'];
    }
}

$columnsQuery = "DESCRIBE enrollmentdata";
$columnsResult = $conn->query($columnsQuery);
$enrollmentColumns = [];
if ($columnsResult && $columnsResult->num_rows > 0) {
    while ($row = $columnsResult->fetch_assoc()) {
        $enrollmentColumns[] = $row['Field'];
    }
}

// Fetch strands from the strands table for dropdown
$strandsSql = "SELECT DISTINCT strand FROM strands ORDER BY strand";
$strandsResult = $conn->query($strandsSql);
$strandOptions = [];

if ($strandsResult && $strandsResult->num_rows > 0) {
    while ($row = $strandsResult->fetch_assoc()) {
        $strandOptions[] = $row['strand'];
    }
}
$response['strandOptions'] = $strandOptions;

// Fetch sections from enrollmentdata table for dropdown
$sectionSql = "SELECT DISTINCT section FROM enrollmentdata WHERE section IS NOT NULL AND section != '' ORDER BY section";
$sectionResult = $conn->query($sectionSql);
$sectionOptions = [];

if ($sectionResult && $sectionResult->num_rows > 0) {
    while ($row = $sectionResult->fetch_assoc()) {
        $sectionOptions[] = $row['section'];
    }
}
$response['sectionOptions'] = $sectionOptions;

// Fetch school years from enrollmentdata table for dropdown
$schoolYearSql = "SELECT DISTINCT school_year FROM enrollmentdata WHERE school_year IS NOT NULL AND school_year != '' ORDER BY school_year DESC";
$schoolYearResult = $conn->query($schoolYearSql);
$schoolYearOptions = [];

if ($schoolYearResult && $schoolYearResult->num_rows > 0) {
    while ($row = $schoolYearResult->fetch_assoc()) {
        $schoolYearOptions[] = $row['school_year'];
    }
}
$response['schoolYearOptions'] = $schoolYearOptions;

// Get search parameters
$name = isset($_GET['name']) ? $_GET['name'] : null;
$municipality = isset($_GET['municipality']) ? $_GET['municipality'] : null;
$birthday = isset($_GET['birthday']) ? $_GET['birthday'] : null;
$religion = isset($_GET['religion']) ? $_GET['religion'] : null;
$gender = isset($_GET['gender']) ? $_GET['gender'] : null;
$strand = isset($_GET['strand']) ? $_GET['strand'] : null;
$section = isset($_GET['section']) ? $_GET['section'] : null;
$yearLevel = isset($_GET['yearLevel']) ? $_GET['yearLevel'] : null;
$schoolYear = isset($_GET['schoolYear']) ? $_GET['schoolYear'] : null;
$ageFrom = isset($_GET['ageFrom']) ? (int)$_GET['ageFrom'] : null;
$ageTo = isset($_GET['ageTo']) ? (int)$_GET['ageTo'] : null;
$grades = isset($_GET['grades']) ? (float)$_GET['grades'] : null;

// Track which fields were used in the search for dynamic column display
$searchedFields = ['name']; // Always include name

// Add fields based on which parameters were provided
if (!empty($municipality)) $searchedFields[] = 'municipality';
if (!empty($birthday)) $searchedFields[] = 'birthday';
if (!empty($religion)) $searchedFields[] = 'religion';
if (!empty($gender)) $searchedFields[] = 'gender';
if (!empty($strand)) $searchedFields[] = 'strand';
if (!empty($section)) $searchedFields[] = 'section';
if (!empty($yearLevel)) $searchedFields[] = 'grade_level';
if (!empty($schoolYear)) $searchedFields[] = 'school_year';
if (!empty($ageFrom) && !empty($ageTo)) $searchedFields[] = 'age';
if (!empty($grades)) $searchedFields[] = 'grades';

// Special cases
if (!empty($name)) {
    $searchedFields = ['name', 'email', 'grade_level', 'strand', 'section'];
}

// Base SQL query - Check if birthday or date_of_birth is the right column
$birthdayColumn = in_array('birthday', $personalInfoColumns) ? 'birthday' : 'date_of_birth';

$sql = "SELECT 
            p.student_id,
            p.first_name,
            p.middle_name,
            p.last_name,
            p.sex AS gender,
            p.$birthdayColumn AS birthday,
            p.religion,
            p.email,
            e.grade_level,
            e.strand_track,
            e.section,
            e.school_year,
            pa.municipality
        FROM 
            personalinfo p
        LEFT JOIN 
            enrollmentdata e ON p.student_id = e.student_id
        LEFT JOIN 
            permanent_address pa ON p.student_id = pa.student_id";

// For grades filter, we need to join with the grades table and calculate the average
if ($grades !== null) {
    $sql = "SELECT 
                p.student_id,
                p.first_name,
                p.middle_name,
                p.last_name,
                p.sex AS gender,
                p.$birthdayColumn AS birthday,
                p.religion,
                p.email,
                e.grade_level,
                e.strand_track,
                e.section,
                e.school_year,
                pa.municipality,
                (
                    SELECT AVG(final_grade) 
                    FROM grades 
                    WHERE student_id = p.student_id
                    GROUP BY student_id
                ) AS final_grade
            FROM 
                personalinfo p
            LEFT JOIN 
                enrollmentdata e ON p.student_id = e.student_id
            LEFT JOIN 
                permanent_address pa ON p.student_id = pa.student_id
            INNER JOIN (
                SELECT 
                    student_id,
                    AVG(final_grade) as avg_grade
                FROM grades
                GROUP BY student_id
                HAVING AVG(final_grade) = ?
            ) g ON p.student_id = g.student_id";
    
    $where_added = true;
    $params = [$grades];
    $types = "d";
} else {
    // If not using grades filter, start with WHERE 1=1
    $sql .= " WHERE 1=1";
    $where_added = true;
    $params = [];
    $types = "";
}

// Add conditions based on search parameters
if ($name) {
    // Split the name to search in first, middle, or last name
    $nameParts = explode(" ", $name);
    $nameConditions = [];
    
    // Create a more comprehensive search for names
    foreach ($nameParts as $part) {
        if (trim($part) !== "") {
            $nameConditions[] = "(LOWER(p.first_name) LIKE LOWER(?) OR LOWER(p.middle_name) LIKE LOWER(?) OR LOWER(p.last_name) LIKE LOWER(?))";
            $part = "%$part%";
            $params[] = $part;
            $params[] = $part;
            $params[] = $part;
            $types .= "sss";
        }
    }
    
    if (!empty($nameConditions)) {
        $sql .= " AND (" . implode(" OR ", $nameConditions) . ")";
    }
}

if ($municipality) {
    $sql .= " AND LOWER(pa.municipality) LIKE LOWER(?)";
    $params[] = "%$municipality%";
    $types .= "s";
}

if ($birthday) {
    $sql .= " AND p.$birthdayColumn = ?";
    $params[] = $birthday;
    $types .= "s";
}

if ($religion) {
    $sql .= " AND LOWER(p.religion) LIKE LOWER(?)";
    $params[] = "%$religion%";
    $types .= "s";
}

if ($gender) {
    $sql .= " AND LOWER(p.sex) = LOWER(?)";
    $params[] = $gender;
    $types .= "s";
}

if ($strand) {
    // Make the strand search case-insensitive for better matching
    $sql .= " AND LOWER(e.strand_track) = LOWER(?)";
    $params[] = $strand;
    $types .= "s";
}

if ($section) {
    // Make the section search case-insensitive for better matching
    $sql .= " AND LOWER(e.section) = LOWER(?)";
    $params[] = $section;
    $types .= "s";
}

if ($yearLevel) {
    // Handle both formats: "Grade 11" and "11"
    $numericYearLevel = preg_replace('/[^0-9]/', '', $yearLevel);
    
    // Create condition to match both "Grade 11" and "11"
    $sql .= " AND (e.grade_level = ? OR e.grade_level = ? OR e.grade_level = ?)";
    $params[] = $numericYearLevel;
    $params[] = "Grade " . $numericYearLevel;
    $params[] = "grade " . $numericYearLevel;
    $types .= "sss";
}

if ($schoolYear) {
    $sql .= " AND e.school_year = ?";
    $params[] = $schoolYear;
    $types .= "s";
}

if ($ageFrom !== null && $ageTo !== null) {
    // Calculate date range based on age - INCLUDE the boundary ages
    $currentDate = date('Y-m-d');
    // To include age=15, we need to use "<= toDate" (up to and including the last day of age 15)
    // To include age=21, we need to use ">= fromDate" (starting from the first day of age 21)
    $fromDate = date('Y-m-d', strtotime("-" . ($ageTo + 1) . " years +1 day", strtotime($currentDate)));
    $toDate = date('Y-m-d', strtotime("-$ageFrom years", strtotime($currentDate)));
    
    $sql .= " AND p.$birthdayColumn BETWEEN ? AND ?";
    $params[] = $fromDate;
    $params[] = $toDate;
    $types .= "ss";
}

// If there are no search parameters, return all students
$students = [];

// Execute query with prepared statement if there are parameters
if (!empty($params)) {
    $stmt = $conn->prepare($sql);
    
    // Check if prepare was successful
    if ($stmt === false) {
        error_log("Prepare failed: " . $conn->error);
        $response['success'] = false;
        $response['message'] = "Database query preparation failed: " . $conn->error;
        $response['query'] = $sql;
        echo json_encode($response);
        exit();
    }
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Format date if needed
            if (isset($row['birthday'])) {
                $row['birthday'] = date('Y-m-d', strtotime($row['birthday']));
            }
            
            // Calculate age
            if (isset($row['birthday'])) {
                $birthDate = new DateTime($row['birthday']);
                $today = new DateTime('today');
                $age = $birthDate->diff($today)->y;
                $row['age'] = $age;
            }
            
            // If grades weren't already fetched in the query, fetch them separately
            if ($grades === null && !isset($row['final_grade']) && in_array('grades', $searchedFields)) {
                // Get grades for this student
                $gradesSql = "SELECT semester, final_grade FROM grades WHERE student_id = ?";
                $gradesStmt = $conn->prepare($gradesSql);
                $gradesStmt->bind_param("s", $row['student_id']);
                $gradesStmt->execute();
                $gradesResult = $gradesStmt->get_result();
                
                $firstSem = 0;
                $secondSem = 0;
                $hasFistSem = false;
                $hasSecondSem = false;
                
                if ($gradesResult && $gradesResult->num_rows > 0) {
                    while ($gradeRow = $gradesResult->fetch_assoc()) {
                        if ($gradeRow['semester'] == '1ST') {
                            $firstSem = (float)$gradeRow['final_grade'];
                            $hasFistSem = true;
                        } else if ($gradeRow['semester'] == '2ND') {
                            $secondSem = (float)$gradeRow['final_grade'];
                            $hasSecondSem = true;
                        }
                    }
                    
                    // Calculate final grade if both semesters have grades
                    if ($hasFistSem && $hasSecondSem) {
                        $row['final_grade'] = ($firstSem + $secondSem) / 2;
                    } else if ($hasFistSem) {
                        $row['final_grade'] = $firstSem;
                    } else if ($hasSecondSem) {
                        $row['final_grade'] = $secondSem;
                    } else {
                        $row['final_grade'] = null;
                    }
                }
                
                $gradesStmt->close();
            }
            
            $students[] = $row;
        }
    }
    
    $stmt->close();
} else {
    // If no search parameters, execute simple query
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Format date if needed
            if (isset($row['birthday'])) {
                $row['birthday'] = date('Y-m-d', strtotime($row['birthday']));
            }
            
            // Calculate age
            if (isset($row['birthday'])) {
                $birthDate = new DateTime($row['birthday']);
                $today = new DateTime('today');
                $age = $birthDate->diff($today)->y;
                $row['age'] = $age;
            }
            
            // Get grades for this student
            if (in_array('grades', $searchedFields)) {
                $gradesSql = "SELECT semester, final_grade FROM grades WHERE student_id = ?";
                $gradesStmt = $conn->prepare($gradesSql);
                $gradesStmt->bind_param("s", $row['student_id']);
                $gradesStmt->execute();
                $gradesResult = $gradesStmt->get_result();
                
                $firstSem = 0;
                $secondSem = 0;
                $hasFistSem = false;
                $hasSecondSem = false;
                
                if ($gradesResult && $gradesResult->num_rows > 0) {
                    while ($gradeRow = $gradesResult->fetch_assoc()) {
                        if ($gradeRow['semester'] == '1ST') {
                            $firstSem = (float)$gradeRow['final_grade'];
                            $hasFistSem = true;
                        } else if ($gradeRow['semester'] == '2ND') {
                            $secondSem = (float)$gradeRow['final_grade'];
                            $hasSecondSem = true;
                        }
                    }
                    
                    // Calculate final grade if both semesters have grades
                    if ($hasFistSem && $hasSecondSem) {
                        $row['final_grade'] = ($firstSem + $secondSem) / 2;
                    } else if ($hasFistSem) {
                        $row['final_grade'] = $firstSem;
                    } else if ($hasSecondSem) {
                        $row['final_grade'] = $secondSem;
                    } else {
                        $row['final_grade'] = null;
                    }
                }
                
                $gradesStmt->close();
            }
            
            $students[] = $row;
        }
    }
}

$response['students'] = $students;
$response['count'] = count($students);
$response['searched_fields'] = $searchedFields; // Include which fields were searched

// Create PDF function with proper formatting
function createPDF($students, $reportTitle, $searchedFields) {
    require_once('fpdf/fpdf.php');
    
    class PDF extends FPDF {
        // Page header
        function Header() {
            // Logo
            $this->Image('school_logo.png', 10, 10, 30);
            // School name
            $this->SetFont('Arial', 'B', 14);
            $this->Cell(30); // Move to the right of the logo
            $this->Cell(0, 10, 'NORTHILLS COLLEGE OF ASIA (NCA), INC.', 0, 1, 'C');
            $this->SetFont('Arial', '', 12);
            $this->Cell(30); // Move to the right of the logo
            $this->Cell(0, 10, 'Daet, Camarines Norte', 0, 1, 'C');
            $this->Ln(20);
        }
        
        // Page footer
        function Footer() {
            // Position at 1.5 cm from bottom
            $this->SetY(-15);
            // Arial italic 8
            $this->SetFont('Arial', 'I', 8);
            // Admin and date
            $this->Cell(0, 10, 'Admin          ' . date('F j, Y g:ia'), 0, 0, 'R');
        }
    }
    
    // Create new PDF document
    $pdf = new PDF();
    $pdf->AddPage();
    
    // Report title
    $pdf->SetFont('Arial', 'B', 14);
    $pdf->Cell(0, 10, strtoupper($reportTitle), 0, 1, 'C');
    $pdf->Ln(10);
    
    // Table header
    $pdf->SetFont('Arial', 'B', 12);
    
    // Determine which columns to show
    $columns = ['name'];
    
    // Add other columns based on searched fields
    foreach ($searchedFields as $field) {
        if ($field !== 'name') {
            if ($field === 'grade_level') {
                $columns[] = 'grade level';
            } else if ($field === 'strand_track' || $field === 'strand') {
                $columns[] = 'strand';
            } else if ($field === 'grades') {
                $columns[] = 'grades';
            } else {
                $columns[] = $field;
            }
        }
    }
    
    // If grades was searched, always add the grades column
    if (in_array('grades', $searchedFields) && count($columns) == 2 && $columns[1] == 'grades') {
        $pdf->Cell(100, 10, 'NAME', 1, 0, 'C');
        $pdf->Cell(90, 10, 'GRADES', 1, 1, 'C');
    } else {
        // Calculate column widths
        $columnCount = count($columns);
        $columnWidth = 190 / $columnCount;
        
        // Print column headers
        foreach ($columns as $column) {
            $pdf->Cell($columnWidth, 10, strtoupper($column), 1, 0, 'C');
        }
        $pdf->Ln();
    }
    
    // Table rows
    $pdf->SetFont('Arial', '', 12);
    
    if (in_array('grades', $searchedFields) && count($columns) == 2 && $columns[1] == 'grades') {
        // Special case for grades report
        foreach ($students as $student) {
            $name = $student['last_name'] . ', ' . $student['first_name'] . 
                  ($student['middle_name'] ? ' ' . substr($student['middle_name'], 0, 1) . '.' : '');
            $pdf->Cell(100, 10, $name, 1, 0);
            $pdf->Cell(90, 10, number_format($student['final_grade'], 0), 1, 1, 'C');
        }
    } else {
        // General case for other types of reports
        foreach ($students as $student) {
            foreach ($columns as $column) {
                $value = getStudentValue($student, $column);
                $pdf->Cell($columnWidth, 10, $value, 1, 0);
            }
            $pdf->Ln();
        }
    }
    
    // Output PDF file
    $pdf->Output('D', $reportTitle . '.pdf');
    exit;
}

// Create Excel/CSV function
function createExcel($students, $reportTitle, $searchedFields) {
    // Simple CSV export
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $reportTitle . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Always include name plus the searched fields
    $columns = ['name'];
    
    foreach ($searchedFields as $field) {
        if ($field !== 'name') {
            if ($field === 'grade_level') {
                $columns[] = 'grade level';
            } else if ($field === 'strand_track' || $field === 'strand') {
                $columns[] = 'strand';
            } else if ($field === 'grades') {
                $columns[] = 'grades';
            } else {
                $columns[] = $field;
            }
        }
    }
    
    // Add headers
    $headers = array_merge(['No.'], array_map('strtoupper', $columns));
    fputcsv($output, $headers);
    
    // Add data rows
    foreach ($students as $index => $student) {
        $row = [$index + 1];
        
        foreach ($columns as $column) {
            $row[] = getStudentValue($student, $column);
        }
        
        fputcsv($output, $row);
    }
    
    fclose($output);
    exit;
}

// Helper function to get the student value for a specific column
function getStudentValue($student, $column) {
    switch (strtolower($column)) {
        case 'name':
            return $student['last_name'] . ', ' . $student['first_name'] . 
                  ($student['middle_name'] ? ' ' . substr($student['middle_name'], 0, 1) . '.' : '');
        case 'email':
            return $student['email'] ?? '-';
        case 'gender':
            return $student['gender'] ?? '-';
        case 'birthday':
            return $student['birthday'] ?? '-';
        case 'religion':
            return $student['religion'] ?? '-';
        case 'municipality':
            return $student['municipality'] ?? '-';
        case 'strand':
            return $student['strand_track'] ?? '-';
        case 'grade level':
            return $student['grade_level'] ?? '-';
        case 'section':
            return $student['section'] ?? '-';
        case 'school year':
            return $student['school_year'] ?? '-';
        case 'age':
            return $student['age'] ?? '-';
        case 'grades':
            return isset($student['final_grade']) ? number_format($student['final_grade'], 0) : '-';
        default:
            return '-';
    }
}

// Check if export functionality is requested
$exportType = isset($_GET['export']) ? $_GET['export'] : null;
$reportTitle = isset($_GET['reportTitle']) ? $_GET['reportTitle'] : 'Student Report';

if ($exportType) {
    switch($exportType) {
        case 'pdf':
            createPDF($students, $reportTitle, $searchedFields);
            break;
        case 'excel':
        case 'csv':
            createExcel($students, $reportTitle, $searchedFields);
            break;
        default:
            $response['export'] = ["success" => false, "message" => "Invalid export type"];
    }
}

// Return the response
echo json_encode($response);

// Close the database connection
$conn->close();
?>