<?php
require_once __DIR__  . '/../includes/response.php';
// Return "all" movies in the database. Limited to 100 for now. Handles filters if present in the $_GET superglobal
function getAllMovies(PDO $pdo)
{
    // Checks if the get filter for title is provided
    $title = $_GET["title"] ?? null;
    // Checks if the get filter for genres is provided
    $genre = $_GET["genre"] ?? null;

    // Pagination parameters
    // Default 1 (use max in-case user inputs 0 or negative page)
    $page = max(1, (int)($_GET["page"] ?? 1));
    // Default 20 (same as page max logic min enforces max limit (max limit is 100))
    $limit = min(100, max(1, (int)($_GET["limit"] ?? 20)));
    $offset = ($page - 1) * $limit;


    $query = "SELECT m.id, m.title, m.poster, m.vote_average FROM movies m";
    // parameters e.g  [$title, $genre ] in execute()
    $parameters = array();
    // conditions e.g. g.name LIKE ?
    $conditions=  array();

    // Check for genre query first since it uses a join
    if ($genre) {
        $query .= " JOIN movie_genres mg on m.id = mg.movie_id JOIN genres g on mg.genre_id = g.id";
        $conditions[] = "g.name LIKE ?";
        $parameters[] = '%'  . $genre . '%';
    }

    if ($title) {
        $conditions[] = "m.title LIKE ?";
        $parameters[] = '%' . $title . '%';
    }

    // If there are conditions build the query and format conditions with WHERE (and) AND
    if(!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions); 
    }

    // Pagination metadata 
    // Use the existing parameters and conditions to construct the COUNT query, remove original column selection using regex
    $countQuery = preg_replace("/SELECT m\.id, m\.title, m\.poster, m\.vote_average/", "SELECT COUNT(DISTINCT m.id) as total", $query);

    // Fetch total unique rows selected by query
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($parameters);
    $totalCount = (int)$countStmt->fetchColumn();

    // Order query by movie id and apply pagination
    $parameters[] = $limit;
    $parameters[] = $offset;

    $query .= " ORDER BY m.id LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute($parameters);

    // Get the movies returned from the query
    $movies = $stmt->fetchAll();

    // Return movie data and pagination data
    $response = [
        "data" => $movies,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => $totalCount,
            "pages" => ceil($totalCount / $limit)
        ]
    ];

    json_response(200, $response);
}

// Get a single movie from the database with the given id
// returns all of the movie data for a specific movie, including data in the genres and production company tables.
// If it returns a null array, a movie with that id does not exist in the database
function getMovieById(PDO $pdo, int $id)
{
    // Get movie by id
    $stmtMovie = $pdo->prepare("SELECT * from movies where id = ?");
    $stmtMovie->execute([$id]);
    $movie = $stmtMovie->fetch();

    // Ensure movie exists
    if (!$movie) {
        // movie is null: failed to fetch from db and most likely does not exist (404 Not Found)
        json_response(404, ["error" => "Movie not found"]);
    }

    // add genre and production company info by using the helper functions
    $movie["genres"] = getGenresByMovieId($pdo, $id);
    $movie["production_companies"] = getCompaniesByMovieId($pdo, $id);

    json_response(200, $movie);
}

// Get genres assosciated with the given movieID
function getGenresByMovieId(PDO $pdo, int $movieId): array
{
    $stmt = $pdo->prepare("
        SELECT g.id, g.name
        FROM genres g
        JOIN movie_genres mg ON g.id = mg.genre_id 
        WHERE mg.movie_id = ?
    ");
    $stmt->execute([$movieId]);
    return $stmt->fetchAll();
}

// Get production_companies assosciated with the given movieID
function getCompaniesByMovieId(PDO $pdo, int $movieId): array
{
    $stmt = $pdo->prepare("
        SELECT pc.id, pc.name
        FROM production_companies pc
        JOIN movie_companies mc ON pc.id = mc.company_id
        WHERE mc.movie_id = ?
    ");
    $stmt->execute([$movieId]);
    return $stmt->fetchAll();
}

// Get the rating of a movie with the given id
function getRatingByMovieId(PDO $pdo, int $movieId)
{
    $stmt = $pdo->prepare("SELECT vote_average FROM movies WHERE id = ?");
    $stmt->execute([$movieId]);

    $rating = $stmt->fetchColumn();

    // Movie id does not exist
    if ($rating === false) {
        json_response(404, ["error" => "Movie not found"]);
    }

    json_response(200, ["rating" => $rating]);
}
