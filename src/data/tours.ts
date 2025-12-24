import { Tour, TourSchedule } from '../types';

export const tours: Tour[] = [
  {
    id: '1',
    title: 'Историческая прогулка по Нижнему Новгороду',
    description: 'Увлекательная экскурсия по историческому центру Нижнего Новгорода. Посетите Кремль, Чкаловскую лестницу, Большую Покровскую улицу и другие знаковые места города.',
    pricing: {
      standard: 1500,
      child: 800,
      family: 1200,
      discountEndDate: '2025-10-10T23:59:59',
      originalPrice: 2000,
      discountPercentage: 25
    },
    duration: '3 часа',
    image: 'https://images.pexels.com/photos/1570826/pexels-photo-1570826.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    gallery: [
      'https://images.pexels.com/photos/1570826/pexels-photo-1570826.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/3889856/pexels-photo-3889856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1470138/pexels-photo-1470138.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ],
    highlights: [
      'Нижегородский Кремль',
      'Чкаловская лестница',
      'Большая Покровская улица',
      'Рождественская церковь',
      'Волжская набережная'
    ],
    category: 'Исторические',
    rating: 4.8,
    reviewCount: 89
  },
  {
    id: '2',
    title: 'Вечерняя прогулка по набережной Волги',
    description: 'Сочельник на набережной Волги - это романтика и красота. Посетите набережную Волги и насладитесь прекрасными видами на реку.',
    pricing: {
      standard: 1200,
      child: 600,
      family: 1000
    },
    duration: '2 часа',
    image: 'https://images.pexels.com/photos/3889856/pexels-photo-3889856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    gallery: [
      'https://images.pexels.com/photos/3889856/pexels-photo-3889856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1470138/pexels-photo-1470138.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1570826/pexels-photo-1570826.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ],
    highlights: [
      'Набережная Волги',
      'Кремль',
      'Чкаловская лестница',
      'Волжская набережная'
    ],
    category: 'Романтические',
    rating: 4.5,
    reviewCount: 67
  },
  {
    id: '3',
    title: 'Архитектурное наследие Нижнего Новгорода',
    description: 'Откройте для себя уникальную архитектуру города: от старинных купеческих особняков до современных зданий.',
    pricing: {
      standard: 1800,
      child: 900,
      family: 1500
    },
    duration: '4 часа',
    image: 'https://images.pexels.com/photos/1470138/pexels-photo-1470138.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    gallery: [
      'https://images.pexels.com/photos/1470138/pexels-photo-1470138.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/1570826/pexels-photo-1570826.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      'https://images.pexels.com/photos/3889856/pexels-photo-3889856.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    ],
    highlights: [
      'Большая Покровская улица',
      'Купеческие особняки',
      'Рождественская церковь',
      'Современная архитектура'
    ],
    category: 'Архитектурные',
    rating: 4.9,
    reviewCount: 124
  }
];

export const tourSchedules: TourSchedule[] = [
  {
    id: 's1',
    tourId: '1',
    date: '2025-09-13',
    time: '10:00',
    availableSpots: 15,
    maxSpots: 20
  },
  {
    id: 's2',
    tourId: '1',
    date: '2025-09-13',
    time: '14:00',
    availableSpots: 12,
    maxSpots: 20
  },
  {
    id: 's3',
    tourId: '1',
    date: '2025-09-14',
    time: '10:00',
    availableSpots: 18,
    maxSpots: 20
  },
  {
    id: 's4',
    tourId: '1',
    date: '2025-09-14',
    time: '14:00',
    availableSpots: 20,
    maxSpots: 20
  },
  {
    id: 's5',
    tourId: '1',
    date: '2025-09-15',
    time: '10:00',
    availableSpots: 15,
    maxSpots: 20
  },
  {
    id: 's6',
    tourId: '1',
    date: '2025-09-15',
    time: '14:00',
    availableSpots: 12,
    maxSpots: 20
  }
];

// Функция для фильтрации прошедших дат
export const getUpcomingSchedules = (schedules: TourSchedule[]): TourSchedule[] => {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // Получаем сегодняшнюю дату в формате YYYY-MM-DD
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return schedules.filter(schedule => {
    const scheduleDate = schedule.date;
    const scheduleTime = schedule.time.split(':');
    const scheduleHour = parseInt(scheduleTime[0]);
    const scheduleMinute = parseInt(scheduleTime[1]);
    
    // Если дата в будущем - оставляем
    if (scheduleDate > today) {
      return true;
    }
    
    // Если дата сегодня - проверяем время
    if (scheduleDate === today) {
      // Если время экскурсии еще не наступило - оставляем
      return (scheduleHour > currentHour) || 
             (scheduleHour === currentHour && scheduleMinute > currentMinute);
    }
    
    // Если дата в прошлом - удаляем
    return false;
  });
};

// Функция для получения актуальных расписаний
export const getAvailableSchedules = (schedules: TourSchedule[]): TourSchedule[] => {
  return getUpcomingSchedules(schedules).filter(schedule => schedule.availableSpots > 0);
};

// Функция для расчета оставшихся мест для тура
export const calculateAvailableSpots = (tourId: string, schedules: TourSchedule[] = []): number => {
  const tourSchedules = schedules.filter(schedule => schedule.tourId === tourId);
  const availableSchedules = getAvailableSchedules(tourSchedules);
  
  if (availableSchedules.length === 0) return 0;
  
  // Возвращаем минимальное количество доступных мест среди всех актуальных расписаний
  return Math.min(...availableSchedules.map(schedule => schedule.availableSpots));
};

// Функция для получения количества мест в ближайшей экскурсии
export const getNearestTourSpots = (tourId: string, schedules: TourSchedule[] = []): number => {
  const tourSchedules = schedules.filter(schedule => schedule.tourId === tourId);
  const upcomingSchedules = getUpcomingSchedules(tourSchedules);
  
  if (upcomingSchedules.length === 0) return 0;
  
  // Сортируем по дате и времени и берем ближайшую
  const sortedSchedules = upcomingSchedules.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
  
  return sortedSchedules[0].availableSpots;
};

// Функция для получения общего количества отзывов для тура
export const getTourReviewCount = (tour: Tour): number => {
  return tour.reviews?.length || 0;
};

// Функция для расчета среднего рейтинга тура
export const calculateTourRating = (tour: Tour): number => {
  if (!tour.reviews || tour.reviews.length === 0) {
    return tour.rating || 4.5;
  }
  
  const totalRating = tour.reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((totalRating / tour.reviews.length) * 10) / 10;
};