<?php
// Bowling Shirt Designer -- PHP microservice
// Run: php -S 127.0.0.1:5060 -t /path/to/bowling-php
// Flask (bowling_blueprint.py) proxies /bowling/* here when BOWLING_PHP_AVAILABLE=1.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$sessDir = __DIR__ . '/sessions';
if (!is_dir($sessDir)) mkdir($sessDir, 0755, true);

if ($uri === '/patterns' && $method === 'GET') {
    echo json_encode(['patterns' => ['none','starburst','pins','argyle','polka','chevrons','bowtie']]);
} elseif ($uri === '/health' && $method === 'GET') {
    echo json_encode(['status' => 'ok', 'mode' => 'php']);
} elseif ($uri === '/session' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    if ($body === null) $body = [];
    $id = bin2hex(random_bytes(8));
    file_put_contents("$sessDir/$id.json", json_encode(['id' => $id, 'ts' => time(), 'data' => $body]));
    echo json_encode(['id' => $id]);
} elseif (preg_match('#^/session/([a-zA-Z0-9_-]+)$#', $uri, $m) && $method === 'GET') {
    $f = "$sessDir/{$m[1]}.json";
    if (!file_exists($f)) {
        http_response_code(404);
        echo json_encode(['error' => 'not found']);
    } else {
        echo file_get_contents($f);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'not found']);
}
