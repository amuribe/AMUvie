<?php
require_once __DIR__ . "/response.php";

// validates an API key and returns the id of the user to who the key belongs.
// returned id will be null if the key does not exist or is invalid 
function getUserIdFromApiKey(PDO $pdo, string $apikey): ?int {
    $stmt = $pdo->prepare("SELECT id FROM amuvie_users WHERE api_key = ?");
    $stmt->execute([$apikey]);
    
    $row = $stmt->fetch();

    return $row ? (int) $row["id"] : null;
}

// Gets the current user id based on the x-api-key header
function getCurrentUserId(PDO $pdo): int {
    $apiKey = $_SERVER["HTTP_X_API_KEY"] ?? "";
    $userId = getUserIdFromApiKey($pdo, $apiKey);

    // User matching x-api-key does not exist (401  Unauthorized)
    if ($userId === null) {
        json_response(401, ["error" => "Api key is invalid"]);
    }

    return $userId;
}
// Helper function to check if a movie exists in the database
function movieExists(PDO $pdo, int $movieId): bool
{
    $stmt = $pdo->prepare("SELECT 1 FROM movies WHERE id = ?");
    $stmt->execute([$movieId]);
    return (bool) $stmt->fetchColumn();
}
?>