import { useState, useEffect } from 'react';
import { database } from '../firebase/config';
import { ref, push, set, get, update, remove, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { PromoCode, AppliedPromo } from '../types';

export const usePromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка всех промокодов
  useEffect(() => {
    const promoCodesRef = ref(database, 'promoCodes');
    const unsubscribe = onValue(promoCodesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const promoCodesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPromoCodes(promoCodesArray);
      } else {
        setPromoCodes([]);
      }
      setLoading(false);
    }, (error) => {
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Создание нового промокода
  const createPromoCode = async (promoData: Omit<PromoCode, 'id' | 'currentUses' | 'createdAt'>): Promise<PromoCode> => {
    try {
      const promoCodesRef = ref(database, 'promoCodes');
      const newPromoRef = push(promoCodesRef);
      
      const newPromoCode: PromoCode = {
        id: newPromoRef.key!,
        ...promoData,
        currentUses: 0,
        createdAt: new Date().toISOString()
      };

      await set(newPromoRef, newPromoCode);
      return newPromoCode;
    } catch (error) {
      throw new Error('Ошибка при создании промокода: ' + error.message);
    }
  };

  // Обновление промокода
  const updatePromoCode = async (promoId: string, updateData: Partial<PromoCode>): Promise<void> => {
    try {
      const promoRef = ref(database, `promoCodes/${promoId}`);
      await update(promoRef, updateData);
    } catch (error) {
      throw new Error('Ошибка при обновлении промокода: ' + error.message);
    }
  };

  // Удаление промокода
  const deletePromoCode = async (promoId: string): Promise<void> => {
    try {
      const promoRef = ref(database, `promoCodes/${promoId}`);
      await remove(promoRef);
    } catch (error) {
      throw new Error('Ошибка при удалении промокода: ' + error.message);
    }
  };

  // Проверка валидности промокода
  const validatePromoCode = async (code: string, tourId?: string, tariff?: 'standard' | 'child' | 'family', numberOfPeople?: number): Promise<PromoCode | null> => {
    try {
      const promoCodesRef = ref(database, 'promoCodes');
      const snapshot = await get(promoCodesRef);
      const data = snapshot.val();

      if (!data) return null;

      // Ищем промокод по коду
      const promoCodeEntry = Object.entries(data).find(([_, promo]: [string, any]) => 
        promo.code.toLowerCase() === code.toLowerCase() && promo.isActive
      );

      if (!promoCodeEntry) return null;

      const promoCode = { id: promoCodeEntry[0], ...promoCodeEntry[1] } as PromoCode;

      // Проверяем дату действия
      const now = new Date();
      const validFrom = new Date(promoCode.validFrom);
      if (now < validFrom) return null;

      if (promoCode.validUntil) {
        const validUntil = new Date(promoCode.validUntil);
        if (now > validUntil) return null;
      }

      // Проверяем количество использований
      if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        return null;
      }

      // Проверяем применимость к экскурсии
      if (promoCode.applicableTours && promoCode.applicableTours.length > 0) {
        if (!tourId || !promoCode.applicableTours.includes(tourId)) {
          return null;
        }
      }

      // Проверяем применимость к тарифу
      if (promoCode.applicableTariffs && promoCode.applicableTariffs.length > 0) {
        if (!tariff || !promoCode.applicableTariffs.includes(tariff)) {
          return null;
        }
      }

      // Проверяем максимальное количество персон
      if (promoCode.maxPeople && numberOfPeople && numberOfPeople > promoCode.maxPeople) {
        return null;
      }

      return promoCode;
    } catch (error) {
      throw new Error('Ошибка при проверке промокода: ' + error.message);
    }
  };

  // Применение промокода
  const applyPromoCode = async (code: string, tourId: string, originalPrice: number, tariff?: 'standard' | 'child' | 'family', numberOfPeople?: number): Promise<{
    promoCode: PromoCode;
    discountedPrice: number;
    discountAmount: number;
  }> => {
    const promoCode = await validatePromoCode(code, tourId, tariff, numberOfPeople);
    
    if (!promoCode) {
      throw new Error('Промокод недействителен или не применим к этой экскурсии/тарифу');
    }

    let discountAmount = 0;
    let discountedPrice = originalPrice;

    if (promoCode.discountType === 'free') {
      discountAmount = originalPrice;
      discountedPrice = 0;
    } else if (promoCode.discountType === 'percentage') {
      discountAmount = Math.round(originalPrice * promoCode.discountValue / 100);
      discountedPrice = originalPrice - discountAmount;
    } else if (promoCode.discountType === 'fixed') {
      discountAmount = Math.min(promoCode.discountValue, originalPrice);
      discountedPrice = originalPrice - discountAmount;
    }

    // Увеличиваем счетчик использований
    await updatePromoCode(promoCode.id, {
      currentUses: promoCode.currentUses + 1
    });

    return {
      promoCode,
      discountedPrice,
      discountAmount
    };
  };

  // Сохранение информации о примененном промокоде
  const saveAppliedPromo = async (bookingId: string, appliedPromo: AppliedPromo): Promise<void> => {
    try {
      const appliedPromoRef = ref(database, `appliedPromos/${bookingId}`);
      await set(appliedPromoRef, appliedPromo);
    } catch (error) {
      throw new Error('Ошибка при сохранении промокода: ' + error.message);
    }
  };

  // Получение примененного промокода для бронирования
  const getAppliedPromo = async (bookingId: string): Promise<AppliedPromo | null> => {
    try {
      const appliedPromoRef = ref(database, `appliedPromos/${bookingId}`);
      const snapshot = await get(appliedPromoRef);
      return snapshot.val();
    } catch (error) {
      throw new Error('Ошибка при получении промокода: ' + error.message);
    }
  };

  return {
    promoCodes,
    loading,
    error,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
    applyPromoCode,
    saveAppliedPromo,
    getAppliedPromo
  };
};
