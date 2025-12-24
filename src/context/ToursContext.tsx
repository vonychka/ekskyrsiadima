import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Tour, TourSchedule, PromoCode, AppliedPromo } from '../types';
import { useTours } from '../hooks/useTours';
import { usePromoCodes } from '../hooks/usePromoCodes';

interface ToursContextType {
  // Tour related
  tours: Tour[];
  schedules: TourSchedule[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  setPage: (page: number) => void;
  addTour: (tourData: Omit<Tour, 'id'>) => Promise<Tour>;
  updateTour: (tourId: string, tourData: Partial<Tour>) => Promise<void>;
  deleteTour: (tourId: string) => Promise<void>;
  addSchedule: (scheduleData: Omit<TourSchedule, 'id'>) => Promise<TourSchedule>;
  updateSchedule: (scheduleId: string, scheduleData: Partial<TourSchedule>) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  updateScheduleSpots: (scheduleId: string, availableSpots: number) => Promise<void>;
  loadMoreTours: () => Promise<void>;
  
  // Promo code related
  promoCodes: PromoCode[];
  promoCodesLoading: boolean;
  createPromoCode: (promoData: Omit<PromoCode, 'id' | 'currentUses' | 'createdAt'>) => Promise<PromoCode>;
  updatePromoCode: (promoId: string, updateData: Partial<PromoCode>) => Promise<void>;
  deletePromoCode: (promoId: string) => Promise<void>;
  validatePromoCode: (code: string, tourId?: string, tariff?: 'standard' | 'child' | 'family', numberOfPeople?: number) => Promise<PromoCode | null>;
  applyPromoCode: (
    code: string, 
    tourId: string, 
    originalPrice: number, 
    tariff?: 'standard' | 'child' | 'family', 
    numberOfPeople?: number
  ) => Promise<{
    promoCode: PromoCode;
    discountedPrice: number;
    discountAmount: number;
  } | null>;
  saveAppliedPromo: (bookingId: string, appliedPromo: AppliedPromo) => Promise<void>;
  getAppliedPromo: (bookingId: string) => Promise<AppliedPromo | null>;
}

const ToursContext = createContext<ToursContextType | undefined>(undefined);

export const useToursContext = () => {
  const context = useContext(ToursContext);
  if (!context) {
    throw new Error('useToursContext must be used within a ToursProvider');
  }
  return context;
};

interface ToursProviderProps {
  children: ReactNode;
}

export const ToursProvider: React.FC<ToursProviderProps> = ({ children }) => {
  // Get all data from hooks
  const {
    tours,
    schedules,
    loading,
    error,
    hasMore,
    page,
    setPage,
    addTour,
    updateTour,
    deleteTour,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateScheduleSpots,
    loadMoreTours,
  } = useTours();

  const {
    promoCodes,
    loading: promoCodesLoading,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
    applyPromoCode,
    saveAppliedPromo,
    getAppliedPromo,
  } = usePromoCodes();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Tour related
    tours,
    schedules,
    loading,
    error,
    hasMore,
    page,
    setPage,
    addTour,
    updateTour,
    deleteTour,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateScheduleSpots,
    loadMoreTours,
    
    // Promo code related
    promoCodes,
    promoCodesLoading,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
    applyPromoCode,
    saveAppliedPromo,
    getAppliedPromo,
  }), [
    // Dependencies for tour related
    tours,
    schedules,
    loading,
    error,
    hasMore,
    page,
    setPage,
    addTour,
    updateTour,
    deleteTour,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateScheduleSpots,
    loadMoreTours,
    
    // Dependencies for promo code related
    promoCodes,
    promoCodesLoading,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
    applyPromoCode,
    saveAppliedPromo,
    getAppliedPromo,
  ]);

  return (
    <ToursContext.Provider value={contextValue}>
      {children}
    </ToursContext.Provider>
  );
};