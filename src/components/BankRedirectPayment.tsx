import React from 'react';
import YandexPayment from './YandexPayment';

interface BankRedirectPaymentProps {
  amount: number;
  tourDetails: {
    title: string;
    fullName: string;
    phone: string;
    email: string;
    date: string;
    promoCode: string;
  };
  onPaymentComplete: (paymentId?: string) => void;
  onPaymentError?: (error: string) => void;
}

const BankRedirectPayment: React.FC<BankRedirectPaymentProps> = ({
  amount,
  tourDetails,
  onPaymentComplete,
  onPaymentError = () => {}
}) => {
  // Handle successful Yandex payment
  const handleYandexSuccess = (paymentId: string) => {
    console.log('Yandex payment successful:', paymentId);
    onPaymentComplete(paymentId);
  };

  // Handle Yandex payment error
  const handleYandexError = (error: string) => {
    console.error('Yandex payment error:', error);
    onPaymentError(error);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-6">Оплата экскурсии</h2>
      
      <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-yellow-600 font-bold text-2xl">🏦</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Онлайн-оплата картой</h3>
          <p className="text-gray-600 mb-4">Безопасная оплата через Яндекс Пей</p>
        </div>
      </div>

      {/* Yandex Payment Form */}
      <div className="mt-6">
        <YandexPayment
          amount={amount}
          orderId={`tour-${Date.now()}-${Math.floor(Math.random() * 1000)}`}
          onSuccess={handleYandexSuccess}
          onError={handleYandexError}
          description={`Оплата экскурсии: ${tourDetails.title}`}
          email={tourDetails.email}
          phone={tourDetails.phone}
        />
      </div>

      {/* Payment Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Как оплатить:</h3>
        <ol className="text-sm space-y-3">
          <li className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
              1
            </span>
            <span>Введите данные карты в открывшейся форме оплаты</span>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
              2
            </span>
            <span>Подтвердите платеж с помощью SMS или в приложении банка</span>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
              3
            </span>
            <span>После успешной оплаты вы получите билет на email</span>
          </li>
        </ol>
        
        <div className="mt-4 pt-4 border-t border-blue-100">
          <p className="text-xs text-gray-500">
            Оплата защищена по стандарту PCI DSS. Данные карт обрабатываются в платежном шлюзе Яндекс Пей.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankRedirectPayment;