import React, { useState, useEffect } from 'react';
import { useToursContext } from '../context/ToursContext';
import { Gift, CheckCircle, XCircle } from 'lucide-react';

interface PromoCodeInputProps {
    tourId: string;
    originalPrice: number;
    tariff?: 'standard' | 'child' | 'family';
    numberOfPeople?: number;
    appliedPromoCode?: string;
    onPromoApplied: (discountedPrice: number, discountAmount: number, promoCode: string) => void;
    onPromoRemoved: () => void;
  }

  const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
    tourId,
    originalPrice,
    tariff,
    numberOfPeople,
    appliedPromoCode,
    onPromoApplied,
    onPromoRemoved
  }) => {
  const { validatePromoCode, applyPromoCode } = useToursContext();
  const [promoCode, setPromoCode] = useState(appliedPromoCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    discountedPrice: number;
  } | null>(null);

  useEffect(() => {
    if (appliedPromoCode) {
      // Восстанавливаем состояние промокода только если он еще не применен
      if (!appliedPromo) {
        setAppliedPromo({
          code: appliedPromoCode,
          discountAmount: 0,
          discountedPrice: originalPrice
        });
      }
    }
  }, [appliedPromoCode, originalPrice, appliedPromo]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setError('Введите промокод');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Сначала проверяем валидность промокода
      const validationResult = await validatePromoCode(promoCode, tourId, tariff, numberOfPeople);
      
      if (validationResult === null) {
        setError('Нет такого промокода или не применим к этой экскурсии');
        return;
      }

      // Применяем промокод
      const result = await applyPromoCode(promoCode, tourId, originalPrice, tariff, numberOfPeople);
      
      setAppliedPromo({
        code: result.promoCode.code,
        discountAmount: result.discountAmount,
        discountedPrice: result.discountedPrice
      });
      
      setSuccess(`Промокод применен! Скидка: ${result.discountAmount.toLocaleString('ru-RU')} ₽`);
      
      if (typeof onPromoApplied === 'function') {
        onPromoApplied(result.discountedPrice, result.discountAmount, result.promoCode.code);
      } else {
        console.error('onPromoApplied is not a function:', onPromoApplied);
      }
      
    } catch (error) {
      setError(error.message || 'Ошибка при применении промокода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setError('');
    setSuccess('');
    onPromoRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyPromo();
    }
  };

  if (appliedPromo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Промокод применен</p>
              <p className="text-sm text-green-700">
                Код: {appliedPromo.code} • Скидка: {appliedPromo.discountAmount.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
          <button
            onClick={handleRemovePromo}
            className="text-red-600 hover:text-red-800 p-1"
            title="Удалить промокод"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-full">
      <div className="flex items-center space-x-2 mb-3">
        <Gift className="w-5 h-5 text-gray-600 flex-shrink-0" />
        <h3 className="font-medium text-gray-900">Промокод</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Введите промокод"
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          disabled={isLoading}
        />
        <button
          onClick={handleApplyPromo}
          disabled={isLoading || !promoCode.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap w-full sm:w-auto"
        >
          {isLoading ? 'Применяем...' : 'Применить'}
        </button>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mt-2 text-sm text-green-600 flex items-center space-x-1">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="break-words">{success}</span>
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;
