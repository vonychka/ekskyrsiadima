import React, { useState } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { TinkoffPayment } from './TinkoffPayment';
import { YandexPay } from './YandexPay';

interface PaymentSelectorProps {
  amount: number;
  description: string;
  fullName: string;
  email: string;
  phone: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

type PaymentMethod = 'tinkoff' | 'yandex';

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  amount,
  description,
  fullName,
  email,
  phone,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('tinkoff');

  const orderId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handlePaymentSuccess = (paymentId: string) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentId);
    }
  };

  const handlePaymentError = (error: string) => {
    if (onPaymentError) {
      onPaymentError(error);
    }
  };

  return (
    <div className="payment-selector">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Выберите способ оплаты</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedMethod('tinkoff')}
            className={`p-4 border rounded-lg transition-all ${
              selectedMethod === 'tinkoff'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Тинькофф</div>
                <div className="text-sm text-gray-600">Банковские карты</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('yandex')}
            className={`p-4 border rounded-lg transition-all ${
              selectedMethod === 'yandex'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-yellow-600" />
              <div className="text-left">
                <div className="font-medium">Яндекс Пей</div>
                <div className="text-sm text-gray-600">Карта, кошелек, SberPay</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="payment-form">
        {selectedMethod === 'tinkoff' && (
          <TinkoffPayment
            amount={amount}
            orderId={orderId}
            description={description}
            fullName={fullName}
            email={email}
            phone={phone}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}

        {selectedMethod === 'yandex' && (
          <YandexPay
            amount={amount}
            description={description}
            fullName={fullName}
            email={email}
            phone={phone}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        )}
      </div>
    </div>
  );
};
