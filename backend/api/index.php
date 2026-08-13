<?php
require_once __DIR__ . '/../includes/library.php';
require_once __DIR__ . '/includes/response.php';

// CORS
// * will be frontend in future
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$pdo = connectdb();

// Get the request uri, endpoint, and request method
$requestPath = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH) ?? "/";

// URL directory for the PHP entry file being executed (Remove whitespace make "/")
$scriptDirectory = rtrim(
  str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"])),
  "/"
);

// If url has base such as local api path, etc
$hasBasePrefix =
  $scriptDirectory !== ""
  &&
  (
    $requestPath === $scriptDirectory || strpos($requestPath, $scriptDirectory . '"/') === 0
  );

if ($hasBasePrefix) {
  $requestPath = substr($requestPath, strlen($scriptDirectory));
}


$endpoint = trim($requestPath, "/");
$method = $_SERVER["REQUEST_METHOD"];

// Separate parts of the url in an array to be used in a switch statement to handle routing
// e.g. $endpoint = "movies/{id}/rating -> ["movies", "{id}", "rating"]
// Trim to remove trailing slashes
$urlParts = explode('/', trim($endpoint, '/'));

// Resource is a directory in the api it should be the first part of the endpoint
$resource = $urlParts[0] ??  '';
// Second part of the endpoint e.g. towatchlist/entries (entries is the subresource)
$subResource = $urlParts[1] ??  '';

switch ($resource) {
  case 'movies':
    require_once __DIR__ . '/movies/movie.php';

    // GET METHODS //
    if ($method === "GET") {
      if (count($urlParts) === 1) {
        // GET /movies/
        getAllMovies($pdo);
      } elseif (count($urlParts) === 2) {
        // GET /movies/{id}
        $id = (int)$urlParts[1];
        getMovieById($pdo, $id);
      } elseif (count($urlParts) === 3 && $urlParts[2] === "rating") {
        // GET /movies/{id}/rating
        $id = (int)$urlParts[1];
        getRatingByMovieId($pdo, $id);
      }
      json_response(404, ["error" => "Endpoint not found"]);
    } else {
      // Not a GET request so not supported for this resource (405 Method Not Allowed)
      json_response(405, ["error" => "Method not allowed"]);
    }
    break;

  case 'towatchlist':
    // Before using the towatchlist resource, api key must be valid
    require_once __DIR__ . '/includes/auth.php';
    require_once __DIR__ . '/towatchlist/towatchlist.php';
    // responds 401 if invalid
    $userId = getCurrentUserId($pdo);
    // Ensure there are 2 or more parts of the url and subresource is entries exit
    if (count($urlParts) < 2 || $subResource != "entries") {
      json_response(404, ["error" => "Endpoint not found"]);
    }

    // Checks if id is present in the endpoint /towatchlist/entries/{id} 
    $entryId = $urlParts[2] ?? null;
    if ($method === "GET") {
      // Get specific entry if present in the endpoint 
      if ($entryId) {
        // GET /towatchlist/entries/{id}
        getUserToWatchListEntry($pdo, $entryId, $userId);
      } else {
        // GET /towatchlist/entries (view watchlist)
        // Gets the entire watchlist of the specified user. A userId cannot exist without a valid api-key
        getUserToWatchList($pdo, $userId);
      }
    } elseif ($method === "POST" && !$entryId) {
      // POST /towatchlist/entries
      createToWatchListEntry($pdo, $userId);
    } elseif ($method === "PATCH" && $entryId) {
      // Make sure endpoint targets priority /towatchlist/entries/{id}/priority
      if (isset($urlParts[3]) && $urlParts[3] === "priority") {
        // PATCH  /towatchlist/entries/{id}/priority
        updateToWatchListEntryPriority($pdo, $entryId, $userId);
      }
    } elseif ($method === "DELETE" && $entryId) {
      // DELETE /towatchlist/entries/{id}
      deleteToWatchListEntry($pdo, $entryId, $userId);
    } elseif ($method === "PUT" && $entryId) {
      // PUT /towatchlist/entries/{id}
      replaceToWatchListEntry($pdo, $entryId, $userId);
    } else {
      json_response(405, ["error" => "Method not allowed"]);
    }
    break;

  case 'completedwatchlist':
    // Before using the completedwatchlist resource, api key must be valid
    require_once __DIR__ . '/includes/auth.php';
    require_once __DIR__ . '/completedwatchlist/completedwatchlist.php';

    // Responds 401 if user is not validated
    $userId = getCurrentUserId($pdo);

    // Ensure there are 2 or more parts of the url and subresource is entries 404 otherwise
    if (count($urlParts) < 2 || $subResource != "entries") {
      json_response(404, ["error" => "Endpoint not found"]);
    }
    // Checks if id is present in the enpoint /completedwatchlist/entries/{id} 
    $entryId = $urlParts[2] ?? null;
    // The attribute of the subresource e.g. times-watched in /completedwatchlist/entries/{id}/times-watched
    $attribute = $urlParts[3] ?? null;

    if ($method === "GET" && !$entryId) {
      // GET /completedwatchlist/entries
      getUserCompletedWatchList($pdo, $userId);
    } elseif ($method === "GET" && $entryId && $attribute === "rating") {
      // GET /completedwatchlist/entries/{id}/rating
      getCompletedWatchListEntryRating($pdo, $entryId, $userId);
    } elseif ($method === "GET" && $entryId && $attribute === "times-watched") {
      // GET /completedwatchlist/entries/{id}/times-watched
      getCompletedWatchListEntryTimesWatched($pdo, $entryId, $userId);
    } elseif ($method === "POST" && !$entryId) {
      // POST /completedwatchlist/entries
      createCompletedWatchListEntry($pdo, $userId);
    } elseif ($method === "PATCH" && $entryId && $attribute === "rating") {
      // PATCH /completedwatchlist/entries/{id}/rating
      updateCompletedWatchListEntryRating($pdo, $entryId, $userId);
    } elseif ($method === "PATCH" && $entryId && $attribute === "times-watched") {
      // PATCH /completedwatchlist/entries/{id}/times-watched
      updateCompletedWatchListEntryTimesWatched($pdo, $entryId, $userId);
    } elseif ($method === "DELETE" && $entryId) {
      // DELETE /completedwatchlist/entries/{id}
      deleteCompletedWatchListEntry($pdo, $entryId, $userId);
    } else {
      json_response(405, ["error" => "Method not allowed"]);
    }
    break;

  case 'users':
    require_once __DIR__ . '/users/users.php';


    if ($method === "GET") {
      // Get the userId
      $userId = $urlParts[1] ?? null;
      // Subresource is urlPart[2] for case users since users/{id}/stats
      $subResource = $urlParts[2] ?? null;
      if ($userId && $subResource === "stats") {
        // GET /users/{id}/stats
        getUserStats($pdo, $userId);
      } else {
        json_response(404, ["error" => "Endpoint not found"]);
      }
    } elseif ($method === "POST" && $subResource === "session") {
      createSession($pdo);
    } else {
      json_response(405, ["error" => "Method not allowed"]);
    }
    break;



  default:
    // Resource did not match 'movies', 'towatchlist', 'completedwatchlist', or 'users' (404 Not Found)
    json_response(404, ["error" => "Endpoint not found"]);
}
