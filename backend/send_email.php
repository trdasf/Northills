<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle CORS
header("Access-Control-Allow-Origin: *"); // Adjust the origin as needed
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Respond to preflight (OPTIONS) request and exit
if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    http_response_code(200);
    exit();
}

// Load PHPMailer classes
require '../PHPMailer-master/src/Exception.php';
require '../PHPMailer-master/src/PHPMailer.php';
require '../PHPMailer-master/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Content-Type: application/json");

$response = [
    "success" => false,
    "message" => "Unknown error occurred"
];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    // Retrieve email, first name, and last name from POST data
    if (isset($data['email']) && !empty($data['email']) && isset($data['first_name']) && isset($data['last_name'])) {
        $userEmail = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
        $firstName = htmlspecialchars($data['first_name']);
        $lastName = htmlspecialchars($data['last_name']);
        $fullName = $firstName . ' ' . $lastName;

        $mail = new PHPMailer(true);

        try {
            // SMTP settings
            $mail->SMTPDebug = 0;
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'collegeofasianorthills@gmail.com';  // Your Gmail address
            $mail->Password = 'avzz uauu rtpq hrrd';   // Your Gmail App Password
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;

            // Set email parameters
            $mail->setFrom('collegeofasianorthills@gmail.com', 'Northills College of Asia');
            $mail->addAddress($userEmail);

            // Email content with user's name
            $mail->isHTML(true);
            $mail->Subject = 'Account Confirmation';
            $mail->Body = "
            <html>
            <body>
                <h2 style='color: #004d00;'>Welcome to Northills College of Asia, <strong>$fullName</strong>!</h2>
                <p>Your account has been successfully registered. Stay in touch for updates and more information!</p>
                <p>Thank you for joining us!</p>
                <p>Best regards,<br>Northills College of Asia Team</p>
            </body>
            </html>
        ";
        

            // Attempt to send the email
            if ($mail->send()) {
                $response["success"] = true;
                $response["message"] = "A confirmation email has been sent to " . htmlspecialchars($userEmail);
            } else {
                $response["success"] = false;
                $response["message"] = "Failed to send confirmation email.";
            }
        } catch (Exception $e) {
            $response["success"] = false;
            $response["message"] = "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    } else {
        $response["message"] = "Error: Email address, first name, and last name are required.";
    }
} else {
    $response["message"] = "Invalid request method.";
}

http_response_code(200); // Confirm successful handling of the request
echo json_encode($response);
?>
