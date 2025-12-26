export default async function handler(req, res) {
  try {
    console.log('=== ТЕСТ ЛОГИРОВАНИЯ VERCEL ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Timestamp:', new Date().toISOString());
    
    // Тестовые данные
    const testData = {
      SuccessURL: 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=test-123',
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL: 'https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-webhook'
    };
    
    console.log('SuccessURL:', testData.SuccessURL);
    console.log('FailURL:', testData.FailURL);
    console.log('NotificationURL:', testData.NotificationURL);
    console.log('Отправляем в Тинькофф:', JSON.stringify(testData, null, 2));
    
    res.status(200).json({ 
      success: true, 
      message: 'Тест логирования работает',
      data: testData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка в тесте:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
