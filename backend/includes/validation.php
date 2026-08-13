<?php
// Functions to validate form fields 

/**
A valid password:
    - is >= 10 characters in length,
    - includes at least one uppercase letter,
    - includes at least one number
returns an error array
if array is empty password is valid
*/
function validatePasswordStrength(string $password): array {
    $errors = array();

    if (strlen($password) < 10) {
        $errors[] = "Password must be at least 10 characters long.";
    }

    // Regex check for inclusion of an uppercase letter
    if (!preg_match("/[A-Z]/", $password)) {
        $errors[] = "Password must contain at least 1 uppercase letter.";
    }

    // Regex check for inclusion of a number
    if (!preg_match("/[0-9]/", $password)) {
        $errors[] = "Password must contain at least 1 number.";
    }

    // Regex check for inclusion of a symbol
    if (!preg_match("/[^A-Za-z0-9]/", $password)) {
        $errors[] = "Password must contain at least 1 symbol (e.g. !@#$%).";
    }

    return $errors;
}

// Simple wrapper for FILTER_VALIDATE_EMAIL

function isValidEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Username must be 3-32 characters, letters, numbers, and underscores only
function isValidUsername(string $username): bool {
    if(preg_match("/^[A-Za-z0-9_]{3,32}$/", $username)) {
        return true; 
    }
    return false;
}

function generateApiKey(): string {
    return bin2hex(random_bytes(32));
}
?>