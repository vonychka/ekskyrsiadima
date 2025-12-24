export interface Tour {
  id: string;
  title: string;
  description: string;
  pricing: {
    standard: number;
    child: number;
    family: number;
  };
  duration: string;
  image: string; // Главное фото
  gallery: string[];
  highlights: string[];
  category: string;
  isPopular?: boolean;
  maxGroupSize?: number;
  bookingCount?: number;
  rating?: number;
  reviews?: Review[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  tourId: string;
}

export interface TourSchedule {
  id: string;
  tourId: string;
  date: string;
  time: string;
  availableSpots: number;
  maxSpots: number;
}

export interface Booking {
  id: string;
  tourId: string;
  scheduleId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfPeople: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}