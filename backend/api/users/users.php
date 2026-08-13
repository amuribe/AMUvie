<?php
require_once __DIR__ . "/../includes/response.php";
require_once __DIR__ . "/../../includes/validation.php";

// Return stats for the specified user
function getUserStats(PDO $pdo, int $userId)
{
    // Check that the user exists, since api key is not required user may not exist
    $stmtUser = $pdo->prepare("SELECT id FROM amuvie_users WHERE id = ?");
    $stmtUser->execute([$userId]);
    if (!$stmtUser->fetch()) {
        json_response(404, ["error" => "user with id $userId not found"]);
    }

    // Get and calculate stats from user's completed watchlist
    // total movies watched, total time watched, average rating, 
    $stmtCompletedWatchlist = $pdo->prepare("SELECT 
            COUNT(*) AS total_movies_watched,
            SUM(cwl.times_watched) as total_times_watched,
            ROUND(AVG(cwl.rating), 2) AS average_rating,
            SUM(m.runtime * cwl.times_watched) as total_minutes_watched,
            ROUND(SUM(m.runtime * cwl.times_watched) / 60, 1) as total_hours_watched
            FROM amuvie_completed_watch_list cwl
            JOIN movies m on cwl.movie_id = m.id
            WHERE cwl.user_id = ?
    ");
    $stmtCompletedWatchlist->execute([$userId]);
    $completedWatchListStats = $stmtCompletedWatchlist->fetch();

    // Get and calculate stats from user's toWatchlist
    $stmtToWatchList = $pdo->prepare("SELECT
        COUNT(*) AS total_to_watch,
        ROUND(SUM(m.runtime) / 60, 1) as total_hours_to_watch
        FROM amuvie_to_watch_list twl
        JOIN movies m on twl.movie_id = m.id
        WHERE twl.user_id = ? 
    ");
    $stmtToWatchList->execute([$userId]);
    $toWatchListStats = $stmtToWatchList->fetch();

    json_response(200, [
        "user_id" => $userId,
        "completed_watchlist_stats" => [
            "total_movies_watched"  => (int)($completedWatchListStats["total_movies_watched"] ?? 0),
            "total_times_watched"   => (int)($completedWatchListStats["total_times_watched"] ?? 0),
            "average_rating"        => (float)($completedWatchListStats["average_rating"] ?? 0),
            "total_minutes_watched" => (int)($completedWatchListStats["total_minutes_watched"] ?? 0),
            "total_hours_watched"   => (float)($completedWatchListStats["total_hours_watched"] ?? 0)
        ],
        "to_watchlist_stats" => [
            "total_to_watch"       => (int)($toWatchListStats["total_to_watch"] ?? 0),
            "total_hours_to_watch" => (float)($toWatchListStats["total_hours_to_watch"] ?? 0)
        ]
    ]);
}

// Takes in a username and password in request and returns an api key (same as login page just for api)
function createSession(PDO $pdo)
{
    $requestBody = getJsonBody();

    $username = trim($requestBody["username"] ?? "");
    $password = $requestBody["password"];

    // Ensure both fields are provided
    if (empty($username) || empty($password)) {
        json_response(400, ["error" => "username and password are required"]);
    }

    $stmt = $pdo->prepare("SELECT id, username, password, api_key FROM amuvie_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    // Verify user exists and password is correct
    if (!$user || !password_verify($password, $user["password"])) {
        json_response(401, ["error" => "incorrect username or password"]);
    }
    // User is valid return api key and userid
    json_response(200, [
        "id" => $user["id"],
        "api_key" => $user["api_key"],
    ]);
}
