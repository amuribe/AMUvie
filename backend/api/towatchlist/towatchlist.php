<?php
require_once __DIR__ . "/../includes/response.php";
require_once __DIR__ . "/../includes/auth.php";

// Gets all entries in the specified user's towatchlist
function getUserToWatchList(PDO $pdo, int $userId)
{
    // priority filter
    $priority = $_GET["priority"] ?? null;
    $detailed = isset($_GET["detailed"]) && $_GET["detailed"] === "true";
    // Build the query conditionally
    if ($detailed) {
        $query = "SELECT wl.id, wl.user_id, wl.movie_id, wl.priority, wl.notes, m.title, m.poster, m.vote_average
                  FROM amuvie_to_watch_list wl
                  JOIN movies m ON wl.movie_id = m.id";
    } else {
        $query = "SELECT wl.id, wl.user_id, wl.movie_id, wl.priority, wl.notes 
                  FROM amuvie_to_watch_list wl";
    }

    $conditions = ["wl.user_id = ?"];
    $parameters = [$userId];


    if (isset($priority) && is_numeric($priority)) {
        $conditions[] = "wl.priority = ?";
        $parameters[] = (int) $priority;
    }

    if (!empty($conditions)) {
        // Add the where clause and the conditions
        $query .= " WHERE " . implode(" AND ", $conditions);
    }

    // Order by priority then id
    $query .= " ORDER BY wl.priority DESC, wl.id ASC";
    $stmt = $pdo->prepare($query);
    $stmt->execute($parameters);
    $entries = $stmt->fetchAll();

    // If detailed, format joined db rows to json
    if ($detailed) {
        $entries = array_map(function ($row) {
            return [
                "id" => $row["id"],
                "user_id" => $row["user_id"],
                "movie_id" => $row["movie_id"],
                "priority" => $row["priority"],
                "notes" => $row["notes"],
                "movie" => [
                    "id" => $row["movie_id"],
                    "title" => $row["title"],
                    "poster" => $row["poster"],
                    "vote_average" => $row["vote_average"]
                ]
            ];
        }, $entries);
    }

    json_response(200, $entries);
}

// Gets a specific entry in the specified user's towatchlist
function getUserToWatchListEntry(PDO $pdo, int $entryId, int $userId)
{
    $stmt = $pdo->prepare("SELECT id, user_id, movie_id, priority, notes FROM amuvie_to_watch_list WHERE id = ? AND user_id = ?");
    $stmt->execute([$entryId, $userId]);
    $entry = $stmt->fetch();

    // Ensure entry exists
    if (!$entry) {
        // entry is null: failed to fetch from db and most likely does not exist (404 Not Found)
        json_response(404, ["error" => "ToWatchList entry $entryId not found"]);
    }

    json_response(200, $entry);
}



// Validate that a priority is a number between 1 and 10 and return default otherwise
function validatePriority($priority): int
{
    // If priority is not set return the default priority(5)
    if (!isset($priority)) {
        return 5;
    }
    // If priority is provided validate
    if (!is_numeric($priority) || (int)$priority < 1 || (int)$priority > 10) {
        json_response(400, ["error" => "priority must be a number between 1 and 10"]);
    }

    return (int) $priority;
}
// Validate movie_id, priority, and notes from decoded JSON in a request body
function validateToWatchListInput(PDO $pdo, array $requestBody): array
{

    // Ensure a movie ID is provided and is numeric
    if (!isset($requestBody["movie_id"]) || !is_numeric($requestBody["movie_id"])) {
        // Invalid requestBody (400 bad request)
        json_response(400, ["error" => "movie_id required in request and must be a number"]);
    }
    $movieId = (int) $requestBody["movie_id"];

    // Verify movie exists with id
    if (!movieExists($pdo, $movieId)) {
        // 404 not found
        json_response(404, ["error" => "Movie with ID $movieId not found"]);
    }

    // Priority is optional and defaulted to 5 if invalid
    $priority = validatePriority($requestBody["priority"] ?? null);

    // Notes are optional
    $notes = $requestBody["notes"] ?? null;

    return ["movie_id" => $movieId, "priority" => $priority, "notes" => $notes];
}

// Inserts a new entry into the specifie user's towatchlist
// Request body: {(required) movie_id: int, (optional default to 5) priority: int(1-10), (optional default empty) note: string }
function createToWatchListEntry(PDO $pdo, int $userId)
{
    $requestBody = getJsonBody();
    $requestData = validateToWatchListInput($pdo, $requestBody);

    // Check that user does not already have the movie in their watchlist
    $stmtCheck = $pdo->prepare("SELECT id FROM amuvie_to_watch_list WHERE user_id = ? AND movie_id = ?");
    $stmtCheck->execute([$userId, $requestData["movie_id"]]);
    if ($stmtCheck->fetchColumn() !== false) {
        // Movie already in watchlist 409 Conflict
        json_response(409, ["error" => "movie already in watchlist"]);
    }

    // insert

    $insertStmt = $pdo->prepare("INSERT INTO amuvie_to_watch_list (user_id, movie_id, priority, notes)
                                VALUES (?, ?, ?, ?)
    
    ");
    $insertStmt->execute([$userId, $requestData["movie_id"], $requestData["priority"], $requestData["notes"]]);

    // get the id of the row that was just inserted
    $newId = (int) $pdo->lastInsertId();

    // Entry was created 201
    json_response(201, [
        "id" => $newId,
        "user_id" => $userId,
        "movie_id" => $requestData["movie_id"],
        "priority" => $requestData["priority"],
        "notes" => $requestData["notes"],
    ]);
}

// Update the priority of an entry in the user's watchlist (PATCH)
function updateToWatchListEntryPriority(PDO $pdo, int $entryId, int $userId)
{
    $requestBody = getJsonBody();

    // PATCH endpoint requires priority so throw an error(400) if it's not provided before validation
    if (!isset($requestBody["priority"])) {
        json_response(400, ["error" => "priority is required"]);
    }

    // Since we know priority is in request we can validate it and return a more appropriate error message
    $priority = validatePriority($requestBody["priority"]);

    // Update the entry's priority in the database
    $updateStmt = $pdo->prepare("UPDATE amuvie_to_watch_list SET priority = ? WHERE id = ? AND user_id = ?");
    $updateStmt->execute([$priority, $entryId, $userId]);

    if ($updateStmt->rowCount() === 0) {
        json_response(404, ["error" => "ToWatchList entry not found or priority did not change"]);
    }
    json_response(200, ["success" => "priority updated succesfully"]);
}

// Delete an entry from the user watchlist (DELETE)
function deleteToWatchListEntry(PDO $pdo, int $entryId, int $userId)
{
    $deleteStmt = $pdo->prepare("DELETE FROM amuvie_to_watch_list WHERE id = ? AND user_id = ?");
    $deleteStmt->execute([$entryId, $userId]);

    // entry to delete was not found (404)
    if ($deleteStmt->rowCount() === 0) {
        json_response(404, ["error" => "ToWatchList entry not found"]);
    }

    // Successful delete no need for json response just return status code (204 No Content)
    http_response_code(204);
    exit();
}

// Replace a watchlist entry or create it if it doesn't exist (PUT)
function replaceToWatchListEntry(PDO $pdo, int $entryId, int $userId)
{
    $requestBody = getJsonBody();

    // Validate the new entry
    $requestData = validateToWatchListInput($pdo, $requestBody);

    // Check whether an entry with the given id exists
    $stmtCheck = $pdo->prepare("SELECT id FROM amuvie_to_watch_list WHERE id = ? AND user_id = ?");
    $stmtCheck->execute([$entryId, $userId]);
    $exists = $stmtCheck->fetchColumn();

    // If entry exists update it (update movie_id, priority, and notes)
    if ($exists) {
        $updateStmt = $pdo->prepare(
            "UPDATE amuvie_to_watch_list SET movie_id = ?, priority = ?, notes = ? 
            WHERE id = ? AND user_id = ?"
        );
        $updateStmt->execute([$requestData["movie_id"], $requestData["priority"], $requestData["notes"], $entryId, $userId]);
        json_response(200, ["success" => "successfully replaced entry"]);
    } else {
        // Entry with id does not exists: insert a new entry with the specified id
        $insertStmt = $pdo->prepare("INSERT INTO amuvie_to_watch_list (id, user_id, movie_id, priority, notes)
                                    VALUES (?, ?, ?, ?, ?)");
        $insertStmt->execute([$entryId, $userId, $requestData["movie_id"], $requestData["priority"], $requestData["notes"]]);
        // Entry was created 201
        json_response(201, [
            "id" => $entryId,
            "user_id" => $userId,
            "movie_id" => $requestData["movie_id"],
            "priority" => $requestData["priority"],
            "notes" => $requestData["notes"],
        ]);
    }
}
