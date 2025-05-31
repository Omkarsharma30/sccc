<?php
header('Content-Type: application/json');

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to validate email
function is_valid_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Function to validate phone number (basic validation)
function is_valid_phone($phone) {
    return preg_match('/^[0-9+\-\s()]{8,20}$/', $phone);
}

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    // Get and validate form data
    $name = isset($_POST['name']) ? sanitize_input($_POST['name']) : '';
    $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $courseType = isset($_POST['courseType']) ? sanitize_input($_POST['courseType']) : '';
    $course = isset($_POST['course']) ? sanitize_input($_POST['course']) : '';

    // Validation checks
    $errors = [];

    if (empty($name) || strlen($name) < 2) {
        $errors[] = "Please enter a valid name";
    }

    if (empty($email) || !is_valid_email($email)) {
        $errors[] = "Please enter a valid email address";
    }

    if (empty($phone) || !is_valid_phone($phone)) {
        $errors[] = "Please enter a valid phone number";
    }

    if (empty($courseType) || !in_array($courseType, ['computer', 'academic'])) {
        $errors[] = "Please select a valid course type";
    }

    if (empty($course)) {
        $errors[] = "Please select a course";
    }

    // If there are validation errors, throw exception
    if (!empty($errors)) {
        throw new Exception(implode(", ", $errors));
    }

    // Admin email
    $admin_email = "okssiwan720@gmail.com";
    
    // Email to admin
    $admin_subject = "New Course Enrollment Request";
    $admin_message = "New enrollment details:\n\n";
    $admin_message .= "Name: " . $name . "\n";
    $admin_message .= "Email: " . $email . "\n";
    $admin_message .= "Phone: " . $phone . "\n";
    $admin_message .= "Course Type: " . ucfirst($courseType) . "\n";
    $admin_message .= "Course: " . $course . "\n";
    $admin_message .= "\nReceived on: " . date('Y-m-d H:i:s');
    
    // Email headers
    $headers = "From: " . $admin_email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email to admin
    $admin_mail_sent = mail($admin_email, $admin_subject, $admin_message, $headers);
    
    // Email to user
    $user_subject = "Course Enrollment Confirmation - Study Care & Computer Classes";
    $user_message = "Dear " . $name . ",\n\n";
    $user_message .= "Thank you for enrolling at Study Care & Computer Classes.\n\n";
    $user_message .= "Your enrollment details:\n";
    $user_message .= "Course Type: " . ucfirst($courseType) . "\n";
    $user_message .= "Course: " . $course . "\n\n";
    $user_message .= "We have received your enrollment request and our team will contact you shortly at " . $phone . ".\n\n";
    $user_message .= "If you have any questions, please feel free to contact us.\n\n";
    $user_message .= "Best regards,\nStudy Care & Computer Classes";
    
    // Send confirmation email to user
    $user_mail_sent = mail($email, $user_subject, $user_message, $headers);
    
    // Check if both emails were sent successfully
    if (!$admin_mail_sent || !$user_mail_sent) {
        throw new Exception("There was an issue sending the confirmation emails. Please try again later.");
    }
    
    // Return success response
    echo json_encode([
        "success" => true, 
        "message" => "Thank you for enrolling! We have sent a confirmation email to your address."
    ]);

} catch (Exception $e) {
    // Return error response
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?> 