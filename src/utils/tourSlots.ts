// Управление местами для экскурсий
export interface TourSlots {
  [tourId: string]: {
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
  };
}

// Начальные данные о местах для экскурсий
export const initialTourSlots: TourSlots = {
  'boiarskaia-ekskursiia': {
    totalSlots: 20,
    bookedSlots: 0,
    availableSlots: 20
  },
  'kreml-ekskursiia': {
    totalSlots: 15,
    bookedSlots: 0,
    availableSlots: 15
  },
  'nizhegorodskaya-yarmarka': {
    totalSlots: 25,
    bookedSlots: 0,
    availableSlots: 25
  }
};

// Получить доступные места
export const getAvailableSlots = (tourId: string): number => {
  const slots = initialTourSlots[tourId];
  return slots ? slots.availableSlots : 0;
};

// Забронировать места
export const bookSlots = (tourId: string, numberOfPeople: number): boolean => {
  const slots = initialTourSlots[tourId];
  if (!slots || slots.availableSlots < numberOfPeople) {
    return false;
  }
  
  slots.bookedSlots += numberOfPeople;
  slots.availableSlots -= numberOfPeople;
  
  return true;
};

// Освободить места (при отмене)
export const releaseSlots = (tourId: string, numberOfPeople: number): void => {
  const slots = initialTourSlots[tourId];
  if (slots) {
    slots.bookedSlots -= numberOfPeople;
    slots.availableSlots += numberOfPeople;
  }
};

// Получить информацию о местах
export const getSlotInfo = (tourId: string) => {
  return initialTourSlots[tourId] || {
    totalSlots: 0,
    bookedSlots: 0,
    availableSlots: 0
  };
};
