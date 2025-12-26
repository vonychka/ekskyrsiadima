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
  // Handle Yandex payment error
  const handleYandexError = (error: string) => {
    console.error('Yandex payment error:', error);
    onPaymentError(error);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
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
  );
};

export default BankRedirectPayment;