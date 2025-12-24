import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Copy, CheckCircle, AlertCircle, Download, Share2 } from 'lucide-react';

interface SBPPaymentProps {
  amount: number;
  tourDetails: {
    title: string;
    date: string;
    fullName: string;
    phone: string;
    email: string;
    promoCode?: string;
  };
  onPaymentComplete: () => void;
}

const SBPPayment: React.FC<SBPPaymentProps> = ({
  amount,
  tourDetails,
  onPaymentComplete
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending');
  const [qrGeneratedAt, setQrGeneratedAt] = useState<number | null>(null);
  const [qrExpiryTime, setQrExpiryTime] = useState<number>(15 * 60 * 1000); // 15 минут в миллисекундах
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Базовая ссылка СБП для оплаты (правильный формат)
  const BASE_SBP_URL = 'https://qr.nspk.ru';

  // Генерация URL для оплаты с правильными параметрами СБП
  const generatePaymentUrl = (): string => {
    // Используем формат с суммой, чтобы цена автоматически вписывалась в приложение банка
    const phoneNumber = '79991408094';
    
    // Формируем URL с суммой для автозаполнения в приложении (без лишнего умножения)
    const paymentUrl = `https://www.sberbank.com/sms/pbpn?requisiteNumber=${phoneNumber}&amount=${amount}`;
    
    return paymentUrl;
  };

  // Альтернативный метод - прямая ссылка на СБП для открытия в браузере
  const generateDirectSBPUrl = (): string => {
    // Используем тот же формат для кнопки "Открыть в приложении"
    return generatePaymentUrl();
  };

  // Открытие ссылки на оплату
  const openPaymentLink = () => {
    const paymentUrl = generateDirectSBPUrl();
    window.open(paymentUrl, '_blank');
  };

  // Генерация QR-кода
  const generateQRCode = async () => {
    try {
      const qrData = generatePaymentUrl();
      const qrCode = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
      setQrCodeUrl(qrCode);
      setShowQR(true);
      setQrGeneratedAt(Date.now());
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Обновление QR-кода
  const updateQRCode = () => {
    if (qrGeneratedAt && Date.now() - qrGeneratedAt > qrExpiryTime) {
      generateQRCode();
    }
  };

  // Копирование ссылки
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatePaymentUrl());
      setCopiedLink(true);
      setShowLinkCopied(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setTimeout(() => setShowLinkCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Поделиться ссылкой
  const sharePaymentLink = async () => {
    const shareData = {
      title: `Оплата экскурсии "${tourDetails.title}"`,
      text: `Ссылка для оплаты экскурсии "${tourDetails.title}" на сумму ${amount.toLocaleString('ru-RU')} ₽`,
      url: generatePaymentUrl()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Формирование текста для сообщения к платежу
  const getPaymentMessageText = () => {
    let message = `экс "${tourDetails.title}" : ${tourDetails.date} ФИО:${tourDetails.fullName} Тел:${tourDetails.phone} Поч:${tourDetails.email}`;
    
    // Если сообщение длиннее 140 символов, сокращаем
    if (message.length > 140) {
      const title = tourDetails.title.length > 20 ? tourDetails.title.substring(0, 20) + '...' : tourDetails.title;
      const name = tourDetails.fullName.length > 15 ? tourDetails.fullName.substring(0, 15) + '...' : tourDetails.fullName;
      message = `экс "${title}" : ${tourDetails.date} ФИО:${name} Тел:${tourDetails.phone}`;
      
      // Если все еще длинно, убираем ФИО
      if (message.length > 140) {
        message = `экс "${title}" : ${tourDetails.date} Тел:${tourDetails.phone}`;
      }
    }
    
    return message;
  };

  // Копирование сообщения к платежу
  const copyPaymentMessage = async () => {
    try {
      await navigator.clipboard.writeText(getPaymentMessageText());
      setCopiedLink(true);
      setShowLinkCopied(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setTimeout(() => setShowLinkCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy payment message: ', err);
    }
  };

  // Подтверждение оплаты (проверка при встрече)
  const handlePaymentConfirmation = () => {
    if (!tourDetails.fullName || !tourDetails.phone || !tourDetails.email) {
      alert('Пожалуйста, заполните все поля в деталях бронирования');
      return;
    }

    setPaymentStatus('processing');
    
    // Имитируем процесс подтверждения
    setTimeout(() => {
      setPaymentStatus('completed');
      onPaymentComplete();
    }, 2000);
  };

  // Генерация QR-кода при загрузке компонента
  useEffect(() => {
    generateQRCode();
    const intervalId = setInterval(updateQRCode, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Обновление таймера
  useEffect(() => {
    if (qrGeneratedAt) {
      const intervalId = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - qrGeneratedAt;
        const remaining = qrExpiryTime - elapsed;
        
        if (remaining > 0) {
          setTimeLeft(remaining);
        } else {
          setTimeLeft(0);
          clearInterval(intervalId);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [qrGeneratedAt, qrExpiryTime]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Smartphone className="w-6 h-6 text-green-600 mr-3" />
        <h3 className="text-xl font-bold">Оплата через СБП</h3>
      </div>

      {/* Информация о платеже */}
      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Сумма к оплате:</span>
          <span className="text-2xl font-bold text-green-600">{amount} ₽</span>
        </div>
      </div>

      {/* ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
          <h4 className="text-lg font-bold text-red-800">ВАЖНО!</h4>
        </div>
        
        <p className="text-red-700 mb-4 font-medium">
          После сканирования QR-кода ОБЯЗАТЕЛЬНО скопируйте текст ниже и вставьте его в сообщение к платежу:
        </p>
        
        <div className="bg-white border border-red-200 rounded p-4 mb-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {getPaymentMessageText()}
          </pre>
        </div>
        
        <button
          onClick={copyPaymentMessage}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>Скопировать текст</span>
        </button>
      </div>

      {/* QR-код */}
      <div className="text-center mb-6">
        {showQR ? (
          <div className="relative inline-block">
            <img 
              src={qrCodeUrl} 
              alt="QR-код для оплаты" 
              className="w-64 h-64 border-2 border-gray-200 rounded-lg"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full p-2">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
        
        <p className="text-sm text-gray-600 mt-3">
          Отсканируйте QR-код камерой телефона
        </p>
        
        {/* Кнопка для открытия QR-кода */}
        <button
          onClick={openPaymentLink}
          className="mt-4 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors mx-auto"
        >
          <Smartphone className="w-5 h-5" />
          <span>Перейти по QR-коду</span>
        </button>
        
        {/* Таймер и статус QR-кода */}
        {timeLeft > 0 ? (
          <p className="text-sm text-gray-600 mt-2">
            Время действия QR-кода: {Math.floor(timeLeft / 1000)} секунд
          </p>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-red-600 mb-2">
              Срок действия QR-кода истёк
            </p>
            <button
              onClick={generateQRCode}
              className="text-sm bg-orange-500 text-white py-1 px-3 rounded hover:bg-orange-600 transition-colors"
            >
              Обновить QR-код
            </button>
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={copyToClipboard}
          className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          {copiedLink ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Скопировано!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Копировать ссылку</span>
            </>
          )}
        </button>

        <button
          onClick={sharePaymentLink}
          className="flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium hover:bg-blue-200 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Поделиться</span>
        </button>

        <button
          onClick={handlePaymentConfirmation}
          disabled={paymentStatus === 'processing'}
          className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {paymentStatus === 'processing' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Проверка...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Я оплатил(а)</span>
            </>
          )}
        </button>
      </div>

      {/* Прямая ссылка */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-2">Прямая ссылка для оплаты:</h4>
        <div className="bg-white border border-gray-200 rounded p-2 text-sm text-gray-600 break-all">
          {generatePaymentUrl()}
        </div>
      </div>

      {/* Прямая ссылка на СБП с номером телефона */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-2">Прямая ссылка на СБП с номером телефона:</h4>
        <div className="bg-white border border-gray-200 rounded p-2 text-sm text-gray-600 break-all">
          {generateDirectSBPUrl()}
        </div>
      </div>

      {/* Инструкция */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Как оплатить:</h4>
        <ol className="text-sm space-y-2">
          <li className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
            <span>Отсканируйте QR-код камерой телефона или нажмите на ссылку</span>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
            <span>Откройте банковское приложение (СберБанк, Тинькофф и др.)</span>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
            <span>Подтвердите платеж (сумма уже будет заполнена)</span>
          </li>
          <li className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
            <span>Нажмите "Я оплатил(а)" для подтверждения</span>
          </li>
        </ol>
      </div>

      {/* Уведомления */}
      {showLinkCopied && (
        <div className="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 bg-green-500 text-white">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Ссылка скопирована!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SBPPayment;
