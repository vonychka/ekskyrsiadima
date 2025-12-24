export interface Tour {
  id: string;
  title: string;
  description: string;
  pricing: Pricing;
  duration: string;
  image: string; // Главное фото
  gallery: string[]; // Галерея дополнительных фото
  category: string;
  highlights: string[];
  address: string; // Адрес встречи для экскурсии
}

export interface Pricing {
  standard: number;
  child: number;
  family: number;
  discountAmount?: number;    // Fixed discount amount (if any)
  discountEndDate?: string;   // ISO date string when discount ends
  originalPrice?: number;     // Original price before discount
  discountPercentage?: number; // Discount percentage (e.g., 20 for 20%)
}

export interface TourSchedule {
  id: string;
  tourId: string;
  date: string;
  time: string;
  availableSpots: number;
  maxSpots: number;
  bookedSpots: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free';
  discountValue: number; // процент или сумма в рублях
  description: string;
  isActive: boolean;
  maxUses?: number; // максимальное количество использований
  currentUses: number; // текущее количество использований
  validFrom: string; // дата начала действия
  validUntil?: string; // дата окончания действия
  applicableTours?: string[]; // ID экскурсий, к которым применяется
  applicableTariffs?: ('standard' | 'child' | 'family')[]; // тарифы, к которым применяется промокод
  maxPeople?: number; // максимальное количество персон для промокода
  createdBy: string; // кто создал
  createdAt: string; // когда создан
}

export interface AppliedPromo {
  promoCodeId: string;
  code: string;
  discountAmount: number;
  appliedAt: string;
}
