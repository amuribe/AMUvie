<?php

function connectdb(): PDO
{
  // Load configuration as an array.
  $configPaths = [
    dirname(__DIR__) . "/config.ini"
  ];
  $homeDirectory = getenv("HOME");

  if (is_string($homeDirectory) && $homeDirectory !== "") {
    $configPaths[] = rtrim($homeDirectory, "/\\") . "/pwd/config.ini";
  }

  $configPath = null;

  foreach ($configPaths as $candidate) {
    if (is_readable($candidate)) {
      $configPath = $candidate;
      break;
    }
  }

  // Make sure path is accessible
  if ($configPath === null) {
    throw new RuntimeException("Database configuration could not be found.");
  }


  // Read the config file to get db credentials
  $config = parse_ini_file(
    $configPath,
    false,
    INI_SCANNER_RAW
  );

  if ($config === false) {
    throw new RuntimeException(
      "Unable to read the database configuration."
    );
  }

  $username =
    $config["DB_USER"] ??
    $config["username"] ??
    null;

  $password =
    $config["DB_PASSWORD"] ??
    $config["password"] ??
    null;

  $host =
    $config["DB_HOST"] ??
    $config["host"] ??
    "localhost";

  $database =
    $config["DB_NAME"] ??
    $config["dbname"] ??
    $username;

  if (
    !is_string($username) ||
    $username === "" ||
    !is_string($password) ||
    $password === "" ||
    !is_string($database) ||
    $database === ""
  ) {
    throw new RuntimeException(
      "Database configuration is incomplete."
    );
  }

  $dsn = sprintf(
    "mysql:host=%s;dbname=%s;charset=utf8mb",
    $host,
    $database
  );

  try {

    $pdo = new PDO(
      $dsn,
      $username,
      $password,
      // Set PDO defaults
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
      ]
    );
  } catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
  }

  return $pdo;
}
