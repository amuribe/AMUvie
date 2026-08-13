<?php

function json_response(int $status, array $data)
{

  // Encode data as json
  $responseJson = json_encode($data, JSON_PRETTY_PRINT);

  // SET HEADERS

  // Set content type
  header("Content-Type: application/json; charset=UTF-8");
  // Set content size
  header("Content-Length: " . strlen($responseJson));
  // Set status code
  http_response_code($status);

  echo $responseJson;

  exit();
}

// Read and decode JSON data from a request
function getJsonBody(): array
{

  $requestData = json_decode(file_get_contents('php://input'), true);
  // Ensure the json_data is not empty and is valid JSON
  if (json_last_error() !== JSON_ERROR_NONE) {
    // 400 Bad Request
    json_response(400, ["error" => "Invalid JSON in request body"]);
  }
  // ?? to treat json_decode returning null as an empty array
  return $requestData ?? [];
}
