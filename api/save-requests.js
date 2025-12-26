export default async function handler(req, res) {
  try {
    // Сохраняем все данные запроса для доказательства
    const requestData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    };

    // Если это POST запрос с данными для Тинькофф
    if (req.method === 'POST' && req.body) {
      const { amount, description, orderId, fullName, email, phone } = req.body;
      
      // Создаем полный запрос к Тинькофф как в основном API
      const cleanDescription = String(description || '').replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
      const referer = req.headers.referer || '';
      let successUrl = 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId || 'test');
      
      if (referer.includes('cv91330.tw1.ru')) {
        successUrl = 'https://cv91330.tw1.ru/ticket?success=true&paymentId=' + String(orderId || 'test');
      }

      const receipt = {
        Email: email,
        Phone: phone,
        EmailCompany: 'sokovdima3@gmail.com',
        TaxationSystem: 'USNIncome',
        Items: [{
          Name: cleanDescription.substring(0, 128),
          Price: Math.round((amount || 1000) * 100),
          Quantity: 1,
          Amount: Math.round((amount || 1000) * 100),
          Tax: 'none',
          PaymentMethod: 'full_prepayment',
          PaymentObject: 'service'
        }]
      };

      const paymentData = {
        TerminalKey: '1766479140318',
        Amount: Math.round((amount || 1000) * 100),
        OrderId: String(orderId || 'test-order'),
        Description: cleanDescription.substring(0, 250),
        CustomerKey: String(orderId || 'test-order'),
        PayType: 'O',
        Recurrent: 'N',
        SuccessURL: successUrl,
        FailURL: 'https://ekskyrsiadima.ru/payment-error',
        NotificationURL: 'https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-webhook',
        Receipt: receipt
      };

      // Возвращаем полный запрос как доказательство
      return res.status(200).json({
        success: true,
        message: 'Данные запроса к Тинькофф сохранены',
        evidence: {
          original_request: requestData,
          tinkoff_request: paymentData,
          success_url_details: {
            successUrl: successUrl,
            referer: referer,
            orderId: orderId
          }
        }
      });
    }

    // Для GET запросов возвращаем информацию
    res.status(200).json({
      success: true,
      message: 'Endpoint для сохранения запросов работает',
      current_request: requestData
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
