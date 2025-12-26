import React from 'react';
import { CreditCard } from 'lucide-react';
import { TinkoffPayment } from './TinkoffPayment';

interface PaymentSelectorProps {
  amount: number;
  description: string;
  fullName: string;
  email: string;
  phone: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  amount,
  description,
  fullName,
  email,
  phone,
  onPaymentSuccess,
  onPaymentError
}) => {
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
        <h3 className="text-lg font-semibold mb-4">Оплата через T-Pay</h3>
        
        <div className="mb-6">
          <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">T-Pay</div>
                <div className="text-sm text-gray-600">Банковские карты и СБП</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="payment-form">
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
      </div>
    </div>
  );
};
