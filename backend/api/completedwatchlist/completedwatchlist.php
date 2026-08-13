<?php
require_once __DIR__ . "/../includes/response.php";
require_once __DIR__ . "/../includes/auth.php";

// Gets all entries in the specified user's completedwatchlist
function getUserCompletedWatchList(PDO $pdo, int $userId)
{
	// Query parameters
	$detailed = isset($_GET["detailed"]) && $_GET["detailed"] === "true";
	$minRating  = $_GET["min_rating"] ?? null;
	$maxRating  = $_GET["max_rating"] ?? null;
	if ($detailed) {
		$query =  "SELECT cw.id, cw.user_id, cw.movie_id, cw.rating, cw.notes,
                          cw.date_first_watched, cw.date_last_watched, cw.times_watched, 
						  m.title, m.poster, m.vote_average
                  FROM amuvie_completed_watch_list cw
                  JOIN movies m ON cw.movie_id = m.id";
	} else {
		$query = "SELECT cw.id, cw.user_id, cw.movie_id, cw.rating, cw.notes, 
                         cw.date_first_watched, cw.date_last_watched, cw.times_watched 
                  FROM amuvie_completed_watch_list cw";
	}

	$conditions = ["cw.user_id = ?"];
	$parameters = [$userId];

	if (isset($minRating) && is_numeric($minRating)) {
		$conditions[] = "cw.rating >= ?";
		$parameters[] = (float) $minRating;
	}

	if (isset($maxRating) && is_numeric($maxRating)) {
		$conditions[] =  "cw.rating <= ?";
		$parameters[] = (float) $maxRating;
	}

	if (!empty($conditions)) {
		$query .= " WHERE " . implode(" AND ", $conditions);
	}

	$query .= " ORDER BY date_last_watched DESC";
	$stmt = $pdo->prepare($query);
	$stmt->execute($parameters);

	$entries = $stmt->fetchAll();

	// If detailed, format joined tables 
	if ($detailed) {
		$entries = array_map(function ($row) {
			return [
				"id" => $row["id"],
				"user_id" => $row["user_id"],
				"movie_id" => $row["movie_id"],
				"rating" => $row["rating"],
				"notes" => $row["notes"],
				"date_first_watched" => $row["date_first_watched"],
				"date_last_watched" => $row["date_last_watched"],
				"times_watched" => $row["times_watched"],
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

// Gets the user's rating for the specified entry
function getCompletedWatchListEntryRating(PDO $pdo, int $entryId, int $userId)
{
	$stmt = $pdo->prepare("SELECT rating FROM amuvie_completed_watch_list WHERE id = ? and user_id = ?");
	$stmt->execute([$entryId, $userId]);

	$rating = $stmt->fetchColumn();
	if ($rating === false) {
		json_response(404, ["error" => "entry not found"]);
	}

	json_response(200, ["rating" => (float)$rating]);
}
// Get the amount of times the user has watched the specified entry
function getCompletedWatchListEntryTimesWatched(PDO $pdo, int $entryId, int $userId)
{
	$stmt = $pdo->prepare("SELECT times_watched FROM amuvie_completed_watch_list WHERE id = ? and user_id = ?");
	$stmt->execute([$entryId, $userId]);

	$rating = $stmt->fetchColumn();
	if ($rating === false) {
		json_response(404, ["error" => "entry not found"]);
	}

	json_response(200, ["times_watched" => (int)$rating]);
}

// Validate movie_id, rating, and set optional field to defaults if not set
function validateCompletedWatchListInput(PDO $pdo, array $requestBody): array
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

	// Ensure a rating is provided and is numeric
	if (!isset($requestBody["rating"]) || !is_numeric($requestBody["rating"])) {
		json_response(400, ["error" => "rating required in request and must be a number between 0.0 and 10.0"]);
	}
	$rating = (float) $requestBody["rating"];

	// Ensure a rating is between 0.0 and 10.0
	if ($rating < 0.0 || $rating > 10.0) {
		json_response(400, ["error" => "rating must be between 0.0 and 10.0"]);
	}

	// Get optional fields and set to default if it isn't set
	$notes = $requestBody["notes"] ?? null;
	// Defaults to the current date
	$dateFirstWatched = $requestBody["date_first_watched"] ?? date("Y-m-d");
	$dateLastWatched = $requestBody["date_last_watched"] ?? $dateFirstWatched;

	// If movie is in completed watchlist it must have been watched at least once
	$timesWatched = $requestBody["times_watched"] ?? 1;
	if (!isset($timesWatched) || $timesWatched < 1) {
		json_response(400, ["error" => "times_watched must be at least 1"]);
	}

	// Input is validated and can be returned
	return [
		"movie_id" => $movieId,
		"rating" => $rating,
		"notes" => $notes,
		"date_first_watched" => $dateFirstWatched,
		"date_last_watched" => $dateLastWatched,
		"times_watched" => $timesWatched
	];
}


// Create a new completedwatchlist entry 
function createCompletedWatchListEntry(PDO $pdo, int $userId)
{
	$requestBody = getJsonBody();
	// Validate the request body
	$requestData = validateCompletedWatchListInput($pdo, $requestBody);

	// Since creating a completedwatchlist entry means updating the shared movies table,
	// Execute the sql as a transaction to prevent concurrency issues
	// If an exception is thrown at any point rollback the transaction

	try {
		$pdo->beginTransaction();

		// Get the movie rating data and lock the row using FOR UPDATE to prevent a race condition
		$stmt = $pdo->prepare("SELECT vote_average, vote_count FROM movies where id = ? FOR UPDATE");
		$stmt->execute([$requestData["movie_id"]]);
		// Holds the average rating and vote count
		$movie = $stmt->fetch();
		// Ensure entry doesn't already exist
		$stmtCheck = $pdo->prepare("SELECT id FROM amuvie_completed_watch_list WHERE user_id = ? AND movie_id = ?");
		$stmtCheck->execute([$userId, $requestData["movie_id"]]);

		if ($stmtCheck->fetchColumn() !== false) {
			// Entry for movie already exists
			// Rollback transaction and throw error (409 Conflict)
			$pdo->rollBack();
			json_response(409, ["error" => "movie already in the completed watchlist, use PATCH to update"]);
		}

		// New entry is valid and is ready to be inserted
		$insertStmt = $pdo->prepare("INSERT INTO amuvie_completed_watch_list
                (user_id, movie_id, rating, notes, date_first_watched, date_last_watched, times_watched)
                VALUES (?, ?, ?, ?, ?, ?, ?)");
		$insertStmt->execute([
			$userId,
			$requestData["movie_id"],
			$requestData["rating"],
			$requestData["notes"],
			$requestData["date_first_watched"],
			$requestData["date_last_watched"],
			$requestData["times_watched"]
		]);
		$newEntryId = (int) $pdo->lastInsertId();

		// Recalculate the movie's rating
		$oldAvgRating = (float) $movie["vote_average"];
		$oldRatingCount = (float) $movie["vote_count"];

		$newCount = $oldRatingCount + 1;
		$newAvgRating = (($oldAvgRating * $oldRatingCount) + $requestData["rating"]) / $newCount;

		// Update the movies table with the new average
		$updateStmt = $pdo->prepare("UPDATE movies SET vote_average = ?, vote_count = ? WHERE id = ?");
		$updateStmt->execute([$newAvgRating, $newCount, $requestData["movie_id"]]);

		// Commit the transaction changes
		$pdo->commit();

		// Entry was created 201
		json_response(201, [
			"id" => $newEntryId,
			"user_id" => $userId,
			"movie_id" => $requestData["movie_id"],
			"rating" => $requestData["rating"],
			"notes" => $requestData["notes"],
			"date_first_watched" => $requestData["date_first_watched"],
			"date_last_watched" => $requestData["date_last_watched"],
			"times_watched" => $requestData["times_watched"],
			"new_average_movie_rating" => $newAvgRating
		]);
	} catch (\PDOException $e) {
		// Roll back the transaction and throw 500 Internal Server Error
		$pdo->rollBack();
		// json_response(500, ["error" => "Database error: " . $e->getMessage()]); // Uncomment for debugging (exposes db schema)
		json_response(500, ["error" => "internal server error occured"]);
	}
}

// Update the rating specified entry's rating and update the movie's rating in the movies table
function updateCompletedWatchListEntryRating(PDO $pdo, int $entryId, $userId)
{
	$requestBody = getJsonBody();

	// Ensure a numeric rating is provided
	if (!isset($requestBody["rating"]) || !is_numeric($requestBody["rating"])) {
		json_response(400, ["error" => "rating required in request and must be a number between 0.0 and 10.0"]);
	}
	$newRating = (float) $requestBody["rating"];
	// Ensure a rating is between 0.0 and 10.0
	if ($newRating < 0.0 || $newRating > 10.0) {
		json_response(400, ["error" => "rating must be between 0.0 and 10.0"]);
	}

	// Execute SQL as a transaction to prevent race conditions in the movies table
	try {
		$pdo->beginTransaction();

		// Get the entry's current rating and movie_id
		$stmtEntry = $pdo->prepare("SELECT movie_id, rating FROM amuvie_completed_watch_list WHERE id = ? AND user_id = ?");
		$stmtEntry->execute([$entryId, $userId]);

		$entry = $stmtEntry->fetch();

		// Entry does not exist rollback and 404
		if (!$entry) {
			$pdo->rollBack();
			json_response(404, ["error" => "entry not found"]);
		}

		$oldRating = (float)$entry["rating"];
		$movieId = (int)$entry["movie_id"];

		// If rating hasn't changed rollback and return early
		if ($oldRating === $newRating) {
			$pdo->rollBack();
			json_response(200, ["message" => "rating unchanged"]);
		}

		// Get the movie's rating and vote count, and lock the row
		$stmtMovie = $pdo->prepare("SELECT vote_average, vote_count FROM movies WHERE id = ? FOR UPDATE");
		$stmtMovie->execute([$movieId]);
		$movie = $stmtMovie->fetch();
		// Movie does not exist rollback and 404
		if (!$movie) {
			$pdo->rollBack();
			json_response(404, ["error" => "movie not found"]);
		}
		$oldAvgRating = (float)$movie["vote_average"];
		$voteCount = (int)$movie["vote_count"];

		// Calculate the new average rating (vote count does not change since we are updating a review/vote not creating a new one)
		$newAvgRating = (($oldAvgRating * $voteCount) - $oldRating + $newRating) / $voteCount;

		// Update entry
		$updateEntryStmt = $pdo->prepare("UPDATE amuvie_completed_watch_list SET rating = ? WHERE id = ?");
		$updateEntryStmt->execute([$newRating, $entryId]);

		// Update movie rating
		$updateMovieStmt = $pdo->prepare("UPDATE movies SET vote_average = ? WHERE id = ?");
		$updateMovieStmt->execute([$newAvgRating, $movieId]);

		// Complete the transaction and commit changes
		$pdo->commit();

		json_response(200, [
			"success" => "rating updated successfully",
			"new_rating" => $newRating,
			"new_average_movie_rating" => $newAvgRating
		]);
	} catch (\PDOException $e) {
		$pdo->rollBack();
		// json_response(500, ["error" => "Database error: " . $e->getMessage()]); // Uncomment for debugging (exposes db schema)
		json_response(500, ["error" => "internal server error occured"]);
	}
}

// Update the number of times watched and the last date watched for the specified entry
function updateCompletedWatchListEntryTimesWatched(PDO $pdo, int $entryId, int $userId)
{
	$requestBody = getJsonBody();

	// Ensure times_watched is provided and is a number
	if (!isset($requestBody["times_watched"]) || !is_numeric($requestBody["times_watched"])) {
		json_response(400, ["error" => "times_watched is required, must be at least 1 and a number"]);
	}
	$timesWatched = (int)$requestBody["times_watched"];
	// A movie can't be completed if it hasn't been watched i.e times_watched < 1
	if ($timesWatched < 1) {
		json_response(400, ["error" => "times_watched be at least 1"]);
	}

	// Default last watch date to current date if not provided
	$dateLastWatched = $requestBody["date_last_watched"] ?? date("Y-m-d");

	// Update the entry in the database
	$updateStmt = $pdo->prepare("UPDATE amuvie_completed_watch_list
            SET times_watched = ?, date_last_watched = ? 
            WHERE id = ? AND user_id = ?");
	$updateStmt->execute([$timesWatched, $dateLastWatched, $entryId, $userId]);
	// Entry doesn't exist or new values are identical to old 404
	if ($updateStmt->rowCount() === 0) {
		json_response(404, ["error" => "entry not found or new values identical to old"]);
	}
	json_response(200, [
		"success" => "times watched and last watched date updated successfully",
		"new_times_watched" => $timesWatched,
		"new_last_watched_date" => $dateLastWatched
	]);
}

// Delete an entry from the user's completedwatchlist and update the movie's average_rating
function deleteCompletedWatchListEntry(PDO $pdo, int $entryId, int $userId)
{
	// Execute SQL as a transaction to prevent race condition while modifying movie's average_rating
	try {
		$pdo->beginTransaction();

		// Get the entry being deleted's current rating and movie_id
		$stmtEntry = $pdo->prepare("SELECT movie_id, rating FROM amuvie_completed_watch_list WHERE id = ? AND user_id = ?");
		$stmtEntry->execute([$entryId, $userId]);
		$entry = $stmtEntry->fetch();

		// Entry does not exist rollback and 404
		if (!$entry) {
			$pdo->rollBack();
			json_response(404, ["error" => "entry not found"]);
		}

		$movieId = (int)$entry["movie_id"];
		$deletedRating = (float)$entry["rating"];

		// Get the movie's average_rating and vote count, and lock the row
		$stmtMovie = $pdo->prepare("SELECT vote_average, vote_count FROM movies WHERE id = ? FOR UPDATE");
		$stmtMovie->execute([$movieId]);
		$movie = $stmtMovie->fetch();

		// Movie does not exist rollback and 404
		if (!$movie) {
			$pdo->rollBack();
			json_response(404, ["error" => "movie not found"]);
		}
		$oldAvgRating = (float)$movie["vote_average"];
		$oldCount = (int)$movie["vote_count"];
		// Decrease vote count since we are deleting the entry
		$newCount = $oldCount - 1;
		// Prevent division by 0 if new count equals zero
		if ($newCount > 0) {
			// Calculate new average rating
			$newAvgRating = (($oldAvgRating * $oldCount) - $deletedRating) / $newCount;
		} else {
			// No votes means no rating
			$newAvgRating = 0.0;
		}

		// Delete the entry
		$deleteStmt = $pdo->prepare("DELETE FROM amuvie_completed_watch_list WHERE id = ? AND user_id = ?");
		$deleteStmt->execute([$entryId, $userId]);

		// Update the movies table with the new average_rating and vote_count
		$deleteStmt = $pdo->prepare("UPDATE movies SET vote_average = ?, vote_count = ? WHERE id = ?");
		$deleteStmt->execute([$newAvgRating, $newCount, $movieId]);

		$pdo->commit();

		// Success respond 204 No Content
		http_response_code(204);
		exit();
	} catch (\PDOException $e) {
		$pdo->rollBack();
		// json_response(500, ["error" => "Database error: " . $e->getMessage()]); // Uncomment for debugging (exposes db schema)
		json_response(500, ["error" => "internal server error occured"]);
	}
}
