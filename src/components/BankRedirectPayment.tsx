import { useState } from 'react';
import YandexPayment from './YandexPayment';

interface BankRedirectPaymentProps {
  amount: number;
  tourDetails: {
    title: string;
    date: string;
    fullName: string;
    phone: string;
    email: string;
    promoCode?: string;
  };
  onPaymentError?: (error: string) => void;
}

const BankRedirectPayment: React.FC<BankRedirectPaymentProps> = ({
  amount,
  tourDetails,
  onPaymentError = () => {}
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'yookassa'>('card');

  // Handle Yandex payment error
  const handleYandexError = (error: string) => {
    console.error('Yandex payment error:', error);
    onPaymentError(error);
  };

  // Handle YooKassa payment (supports SBP)
  const handleYooKassaPayment = () => {
    // Создаем платеж через ЮKassa с поддержкой СБП
    const paymentData = {
      shopId: '338343', // Тестовый shopId ЮKassa
      sum: amount,
      orderNumber: `tour-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: `Оплата экскурсии: ${tourDetails.title}`,
      customer: {
        email: tourDetails.email,
        phone: tourDetails.phone,
        fullName: tourDetails.fullName
      },
      paymentType: 'AC', // Автоплатеж (поддерживает СБП)
      successURL: `http://localhost:5173/payment/success?orderId={orderNumber}&amount=${amount}&email=${encodeURIComponent(tourDetails.email)}`,
      failURL: `http://localhost:5173/payment/error?orderId={orderNumber}`
    };

    // Сохраняем данные для отправки билета
    sessionStorage.setItem('lastPaymentInfo', JSON.stringify({
      ...tourDetails,
      amount: amount,
      paymentMethod: 'yookassa'
    }));

    // Создаем URL для оплаты ЮKassa
    const params = new URLSearchParams();
    params.append('shopId', paymentData.shopId);
    params.append('sum', paymentData.sum.toString());
    params.append('orderNumber', paymentData.orderNumber);
    params.append('description', paymentData.description);
    params.append('customerEmail', paymentData.customer.email);
    params.append('customerPhone', paymentData.customer.phone);
    params.append('paymentType', paymentData.paymentType);
    params.append('successURL', paymentData.successURL);
    params.append('failURL', paymentData.failURL);

    // Открываем платежную форму ЮKassa
    const paymentUrl = `https://yoomoney.ru/quickpay/shop-widget?writer=seller&targets=${encodeURIComponent(paymentData.description)}&targets-hint=&default-sum=${amount}&button-text=11&payment-type-choice=on&mobile-payment-type-choice=on&comment=${paymentData.orderNumber}&hint=&successURL=${encodeURIComponent(paymentData.successURL)}&failURL=${encodeURIComponent(paymentData.failURL)}&quickpay=shop&account=4100116739925364`;
    
    window.open(paymentUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">Оплата экскурсии</h2>
      
      {/* Выбор способа оплаты */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Выберите способ оплаты:</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'card' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">💳</span>
              <span className="font-medium">ЮMoney</span>
              <span className="text-xs text-gray-500">Картой онлайн</span>
            </div>
          </button>
          
          <button
            onClick={() => setPaymentMethod('yookassa')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'yookassa' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">🏦</span>
              <span className="font-medium">ЮKassa</span>
              <span className="text-xs text-gray-500">СБП, Сбер, карты</span>
            </div>
          </button>
        </div>
      </div>

      {/* Платежная форма */}
      {paymentMethod === 'card' && (
        <div>
          <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-yellow-600 font-bold text-xl">ЮMoney</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Оплата картой</h3>
              <p className="text-gray-600 mb-4">Безопасная оплата через ЮMoney</p>
            </div>
          </div>

          <div className="mt-6">
            <YandexPayment
              amount={amount}
              orderId={`tour-${Date.now()}-${Math.floor(Math.random() * 1000)}`}
              onError={handleYandexError}
              description={`Оплата экскурсии: ${tourDetails.title}`}
              email={tourDetails.email}
              phone={tourDetails.phone}
            />
          </div>
        </div>
      )}

      {paymentMethod === 'yookassa' && (
        <div>
          <div className="mb-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold text-xl">ЮKassa</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Оплата через ЮKassa</h3>
              <p className="text-gray-600 mb-4">Поддерживает СБП, Сбер, карты</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleYooKassaPayment}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-xl">🏦</span>
              <span>Оплатить через ЮKassa</span>
            </button>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Способы оплаты:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• 💳 Банковские карты (Visa, Mastercard, МИР)</li>
              <li>• 📱 СБП (Система быстрых платежей)</li>
              <li>• 🏦 СберБанк Онлайн</li>
              <li>• 📱 Альфа-Банк, Тинькофф, ВТБ</li>
              <li>• 💰 ЮMoney, QIWI, WebMoney</li>
            </ul>
          </div>
        </div>
      )}

      {/* Общие инструкции */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Важная информация:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• После оплаты вы получите подтверждение на email</li>
          <li>• За 24 часа до экскурсии мы пришлем напоминание</li>
          <li>• При необходимости можно отменить бронирование за 48 часов</li>
          <li>• По вопросам оплаты: +7 (999) 140-80-94</li>
        </ul>
      </div>
    </div>
  );
};

export default BankRedirectPayment;