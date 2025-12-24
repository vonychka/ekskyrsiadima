<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получаем данные из запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$amount = $data['amount'] ?? null;
$orderId = $data['orderId'] ?? null;
$description = $data['description'] ?? null;
$email = $data['email'] ?? null;
$phone = $data['phone'] ?? null;
$apiKey = $data['apiKey'] ?? null;

// Валидация
if (!$amount || !$orderId || !$description || !$email || !$phone || !$apiKey) {
    http_response_code(400);
    echo json_encode(['error' => 'VALIDATION_ERROR', 'message' => 'Не все обязательные поля заполнены']);
    exit;
}

// Проверка API ключа
if ($apiKey !== '19c1e757-cf1e-4789-b576-48c30474c6d8') {
    http_response_code(401);
    echo json_encode(['error' => 'INVALID_API_KEY', 'message' => 'Неверный API ключ']);
    exit;
}

// Данные для заказа Яндекс Пей
$orderData = [
    'orderId' => $orderId,
    'cart' => [
        'items' => [[
            'productId' => 'tour-' . time(),
            'title' => substr($description, 0, 2048),
            'quantity' => [
                'count' => '1'
            ],
            'total' => number_format($amount / 100, 2, '.', ''),
            'receipt' => [
                'tax' => 1, // Без НДС
                'paymentMethodType' => 1, // Полная предварительная оплата
                'paymentSubjectType' => 4 // Услуга
            ]
        ]],
        'total' => [
            'amount' => number_format($amount / 100, 2, '.', '')
        ]
    ],
    'currencyCode' => 'RUB',
    'redirectUrls' => [
        'onSuccess' => 'https://ekskyrsiadima.ru/payment/success?orderId=' . $orderId,
        'onError' => 'https://ekskyrsiadima.ru/payment/error?orderId=' . $orderId
    ],
    'metadata' => [
        'email' => $email,
        'phone' => $phone,
        'description' => $description
    ]
];

// Отправляем запрос в Яндекс Пей API
$ch = curl_init('https://pay.yandex.ru/api/merchant/v1/orders');

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
    'Idempotence-Key: ' . $orderId
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'CURL_ERROR', 'message' => $error]);
    exit;
}

$result = json_decode($response, true);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    $errorMsg = $result['description'] ?? $result['message'] ?? 'Ошибка создания платежа';
    echo json_encode(['error' => $result['type'] ?? 'PAYMENT_ERROR', 'message' => $errorMsg]);
    exit;
}

// Возвращаем успешный ответ
echo json_encode([
    'status' => 'success',
    'data' => [
        'paymentUrl' => $result['data']['paymentUrl'] ?? null,
        'orderId' => $result['data']['orderId'] ?? $orderId
    ]
]);
?>
