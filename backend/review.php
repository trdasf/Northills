<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection function
function getConnection() {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "northills";
    
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // Set a longer timeout and wait_timeout
    $conn->query("SET SESSION wait_timeout=600");
    $conn->query("SET SESSION interactive_timeout=600");
    
    return $conn;
}

// Check if connection is still alive, reconnect if needed
function ensureConnection($conn) {
    if (!$conn->ping()) {
        $conn->close();
        return getConnection();
    }
    return $conn;
}

// Function to resize and compress an image with improved compression
function resizeAndCompressImage($base64Image, $maxWidth = 600, $maxHeight = 600, $quality = 50) {
    if (empty($base64Image)) {
        return null;
    }
    
    // Check if GD library is available
    if (!function_exists('imagecreatefromstring')) {
        // If GD is not available, just return a small portion of the data to avoid packet issues
        if (strpos($base64Image, 'data:image') !== false) {
            list(, $base64Image) = explode(',', $base64Image);
        }
        
        // Limit the size to prevent MySQL packet errors
        $imageData = base64_decode($base64Image);
        if (strlen($imageData) > 1048576) { // 1MB limit
            return null; // Return null if too large and can't be processed
        }
        
        return $imageData;
    }
    
    // Extract the image data without the MIME type prefix
    if (strpos($base64Image, 'data:image') !== false) {
        list(, $base64Image) = explode(',', $base64Image);
    }
    
    $imageData = base64_decode($base64Image);
    
    // Create an image from the binary data
    $image = @imagecreatefromstring($imageData);
    if (!$image) {
        // If cannot create image, return null instead of original data
        return null;
    }
    
    // Get current dimensions
    $width = imagesx($image);
    $height = imagesy($image);
    
    // Calculate new dimensions
    $ratio = min($maxWidth / $width, $maxHeight / $height);
    
    // Always resize to maximum dimensions to reduce size
    $newWidth = floor($width * $ratio);
    $newHeight = floor($height * $ratio);
    
    // Create a new image with the new dimensions
    $newImage = imagecreatetruecolor($newWidth, $newHeight);
    imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    
    // Capture the output
    ob_start();
    imagejpeg($newImage, null, $quality);
    $compressedImage = ob_get_contents();
    ob_end_clean();
    
    // Free memory
    imagedestroy($image);
    imagedestroy($newImage);
    
    // Check final size and reduce further if needed
    if (strlen($compressedImage) > 1048576) { // Still over 1MB
        // Try with more aggressive settings
        return resizeAndCompressImage($base64Image, $maxWidth/2, $maxHeight/2, 30);
    }
    
    return $compressedImage;
}

try {
    $conn = getConnection();
    
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false, "message" => "Invalid data format."]);
        exit();
    }

    $conn->begin_transaction(); // Start the transaction

    // Process the image with adaptive compression based on size
    $image = null;
    if (isset($data['image']) && !empty($data['image'])) {
        // Calculate base64 image size
        $base64Data = strpos($data['image'], ',') !== false ? 
            explode(',', $data['image'], 2)[1] : $data['image'];
        $decodedSize = strlen(base64_decode($base64Data));
        
        // Apply different compression levels based on size
        if ($decodedSize > 5 * 1024 * 1024) { // Larger than 5MB
            $image = resizeAndCompressImage($data['image'], 300, 300, 30);
        } else if ($decodedSize > 2 * 1024 * 1024) { // Larger than 2MB
            $image = resizeAndCompressImage($data['image'], 400, 400, 40);
        } else if ($decodedSize > 1 * 1024 * 1024) { // Larger than 1MB
            $image = resizeAndCompressImage($data['image'], 500, 500, 50);
        } else {
            $image = resizeAndCompressImage($data['image'], 600, 600, 60);
        }
        
        // If compression failed, set to null
        if ($image === null) {
            error_log("Image compression failed or image too large - setting to NULL");
        }
    }

    // Step 1: Insert personal information and get student_id
    $conn = ensureConnection($conn);
    $stmt = $conn->prepare("INSERT INTO personalinfo (first_name, last_name, middle_name, extension_name, age, birthday, birthday_place, civil_status, sex, religion, citizenship, contact_number, email, picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error preparing personalinfo statement: " . $conn->error);
    }
    
    // Bind parameters with correct types
    $stmt->bind_param("ssssssssssssss", 
        $data['firstName'], 
        $data['lastName'], 
        $data['middleName'], 
        $data['extensionName'], 
        $data['age'], 
        $data['birthday'], 
        $data['birthdayPlace'], 
        $data['civilStatus'], 
        $data['sex'], 
        $data['religion'], 
        $data['citizenship'], 
        $data['contactNumber'], 
        $data['email'], 
        $image
    );
    $stmt->execute();
    $student_id = $conn->insert_id; // Get the generated student_id
    $stmt->close();

    // Step 2: Insert enrollment data
    $conn = ensureConnection($conn);
    $stmt = $conn->prepare("INSERT INTO enrollmentdata (student_id, LRN, grade_level, school_year, curriculum, strand_track, campus, sports, fav_subjects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error preparing enrollment_data statement: " . $conn->error);
    }
    $stmt->bind_param("issssssss", 
        $student_id, 
        $data['learnerReferenceNumber'], 
        $data['gradeLevel'], 
        $data['schoolYear'], 
        $data['curriculum'], 
        $data['strandTrack'], 
        $data['campus'], 
        $data['sports'], 
        $data['favoriteSubjects']
    );
    $stmt->execute();
    $stmt->close();

    // Step 3: Insert elementary data
    $conn = ensureConnection($conn);
    $stmt = $conn->prepare("INSERT INTO elementary (student_id, school_name, year_graduated, gwa, awards) VALUES (?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error preparing elementary statement: " . $conn->error);
    }
    $stmt->bind_param("issss", 
        $student_id, 
        $data['elementary'], 
        $data['yearGraduatedElem'], 
        $data['elementaryGwa'], 
        $data['elementaryAwards']
    );
    $stmt->execute();
    $stmt->close();

    // Step 4: Insert secondary data
    $conn = ensureConnection($conn);
    $stmt = $conn->prepare("INSERT INTO secondary (student_id, school_name, year_graduated, gwa, awards) VALUES (?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error preparing secondary statement: " . $conn->error);
    }
    $stmt->bind_param("issss", 
        $student_id, 
        $data['secondary'], 
        $data['yearGraduatedSec'], 
        $data['secondaryGwa'], 
        $data['secondaryAwards']
    );
    $stmt->execute();
    $stmt->close();

    // Step 5: Insert present address data
    $conn = ensureConnection($conn);
    $stmt = $conn->prepare("INSERT INTO present_address (student_id, house_no, barangay, municipality, province, zip_code) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error preparing present address statement: " . $conn->error);
    }
    $stmt->bind_param("isssss", 
        $student_id, 
        $data['presentAddress']['houseStreetPurok'], 
        $data['presentAddress']['barangay'], 
        $data['presentAddress']['municipality'], 
        $data['presentAddress']['province'], 
        $data['presentAddress']['zipcode']
    );
    $stmt->execute();
    $stmt->close();

    // Step 6: Insert permanent address data
    $conn = ensureConnection($conn);
    $stmt = $conn->prepare("INSERT INTO permanent_address (student_id, house_no, barangay, municipality, province, zip_code) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception("Error preparing permanent address statement: " . $conn->error);
    }
    $stmt->bind_param("isssss", 
        $student_id, 
        $data['permanentAddress']['houseStreetPurok'], 
        $data['permanentAddress']['barangay'], 
        $data['permanentAddress']['municipality'], 
        $data['permanentAddress']['province'], 
        $data['permanentAddress']['zipcode']
    );
    $stmt->execute();
    $stmt->close();

    // Step 7: Insert family details
    // Father details
    if (isset($data['familyDetails']['father'])) {
        $conn = ensureConnection($conn);
        $stmt = $conn->prepare("INSERT INTO father (student_id, father_fname, father_lname, father_midname, father_age, father_occupation, father_phoneNum, father_educAttainment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error preparing father statement: " . $conn->error);
        }
        $father = $data['familyDetails']['father'];
        $stmt->bind_param("isssisss", 
            $student_id, 
            $father['firstName'], 
            $father['lastName'], 
            $father['middleName'], 
            $father['age'], 
            $father['occupation'], 
            $father['phoneNumber'], 
            $father['educationAttainment']
        );
        $stmt->execute();
        $stmt->close();
    }

    // Mother details
    if (isset($data['familyDetails']['mother'])) {
        $conn = ensureConnection($conn);
        $stmt = $conn->prepare("INSERT INTO mother (student_id, mother_fname, mother_lname, mother_midname, mother_age, mother_occupation, mother_phoneNum, mother_educAttainment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error preparing mother statement: " . $conn->error);
        }
        $mother = $data['familyDetails']['mother'];
        $stmt->bind_param("isssisss", 
            $student_id, 
            $mother['firstName'], 
            $mother['lastName'], 
            $mother['middleName'], 
            $mother['age'], 
            $mother['occupation'], 
            $mother['phoneNumber'], 
            $mother['educationAttainment']
        );
        $stmt->execute();
        $stmt->close();
    }

    // Guardian details
    if (isset($data['familyDetails']['guardian'])) {
        $conn = ensureConnection($conn);
        $stmt = $conn->prepare("INSERT INTO guardian (student_id, guardian_fname, guardian_lname, guardian_midname, guardian_age, guardian_occupation, guardian_phoneNum, guardian_educAttainment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error preparing guardian statement: " . $conn->error);
        }
        $guardian = $data['familyDetails']['guardian'];
        $stmt->bind_param("isssisss", 
            $student_id, 
            $guardian['firstName'], 
            $guardian['lastName'], 
            $guardian['middleName'], 
            $guardian['age'], 
            $guardian['occupation'], 
            $guardian['phoneNumber'], 
            $guardian['educationAttainment']
        );
        $stmt->execute();
        $stmt->close();
    }

    // Siblings details
    if (isset($data['siblings']) && is_array($data['siblings'])) {
        foreach ($data['siblings'] as $sibling) {
            $conn = ensureConnection($conn);
            $stmt = $conn->prepare("INSERT INTO sibling (student_id, sibling_fname, sibling_lname, sibling_midname, sibling_age, sibling_occupation, sibling_phoneNum, sibling_educAttainment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            if (!$stmt) {
                throw new Exception("Error preparing sibling statement: " . $conn->error);
            }
            $stmt->bind_param("isssisss", 
                $student_id, 
                $sibling['firstName'], 
                $sibling['lastName'], 
                $sibling['middleName'], 
                $sibling['age'], 
                $sibling['occupation'], 
                $sibling['phoneNumber'], 
                $sibling['educationAttainment']
            );
            $stmt->execute();
            $stmt->close();
        }
    }
    
    // Step 8: Insert finalstep data if date and time are provided
    if (isset($data['date'], $data['time'])) {
        $conn = ensureConnection($conn);
        $stmt = $conn->prepare("
            INSERT INTO finalstep (
                student_id, 
                submission_date, 
                submission_time, 
                birth_certificate, 
                good_moral, 
                highschool_diploma, 
                TOR, 
                id_picture, 
                status
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        if (!$stmt) {
            throw new Exception("Error preparing finalstep statement: " . $conn->error);
        }
    
        $submissionDate = $data['date'];
        $submissionTime = $data['time'];
    
        // Set the default statuses for the requirements and overall status
        $notSubmitted = "NOT_SUBMITTED"; // Default status for requirements
        $pendingStatus = "PENDING"; // Default overall status
    
        // Bind parameters to insert all data
        $stmt->bind_param(
            "issssssss", 
            $student_id, 
            $submissionDate, 
            $submissionTime, 
            $notSubmitted, // birth_certificate
            $notSubmitted, // good_moral
            $notSubmitted, // highschool_diploma
            $notSubmitted, // TOR
            $notSubmitted, // id_picture
            $pendingStatus  // overall status
        );
    
        // Execute the query
        if (!$stmt->execute()) {
            throw new Exception("Error executing finalstep insert: " . $stmt->error);
        }
    
        $stmt->close();
        
        // Step 9: Update the schedule table to decrease the slots by 1
        $conn = ensureConnection($conn);
        $updateStmt = $conn->prepare("UPDATE schedule SET slots = slots - 1 WHERE date = ? AND time = ?");
        if (!$updateStmt) {
            throw new Exception("Error preparing schedule update statement: " . $conn->error);
        }
    
        $updateStmt->bind_param("ss", $submissionDate, $submissionTime);
        $updateStmt->execute();
        $updateStmt->close();
    }
    
    $conn = ensureConnection($conn);
    $conn->commit(); // Commit the transaction
    echo json_encode(["success" => true, "message" => "Data saved successfully!", "student_id" => $student_id]);
    
} catch (Exception $e) {
    // Check if connection is still valid before attempting rollback
    try {
        if (isset($conn) && $conn->ping()) {
            $conn->rollback(); // Rollback the transaction on error
        } else {
            // If connection is lost, try to reconnect and then rollback
            $conn = getConnection();
            $conn->rollback();
        }
    } catch (Exception $rollbackException) {
        // Just log the rollback error, but report the original error to the user
        error_log("Error during rollback: " . $rollbackException->getMessage());
    }
    
    error_log("Transaction failed: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error saving data: " . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>