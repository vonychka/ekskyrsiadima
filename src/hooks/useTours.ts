import { useState, useEffect, useCallback, useRef } from 'react';
import { Tour, TourSchedule } from '../types';
import { tours as initialTours, tourSchedules as initialSchedules } from '../data/tours';
import { database } from '../firebase/config';
import { ref, set, get, update, remove, query, orderByChild, limitToFirst } from 'firebase/database';

// Ключи для кэширования
const CACHE_KEYS = {
  TOURS: 'tours_cache',
  SCHEDULES: 'schedules_cache',
  TIMESTAMP: 'cache_timestamp'
};

// Время жизни кэша (30 минут)
const CACHE_TTL = 30 * 60 * 1000;

// Количество элементов для пагинации
const ITEMS_PER_PAGE = 6;

// Функции для работы с кэшем
const saveToCache = (tours: Tour[], schedules: TourSchedule[]) => {
  const cacheData = {
    tours,
    schedules,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEYS.TOURS, JSON.stringify(tours));
  localStorage.setItem(CACHE_KEYS.SCHEDULES, JSON.stringify(schedules));
  localStorage.setItem(CACHE_KEYS.TIMESTAMP, JSON.stringify(cacheData.timestamp));
};

const loadFromCache = () => {
  try {
    const cachedTours = localStorage.getItem(CACHE_KEYS.TOURS);
    const cachedSchedules = localStorage.getItem(CACHE_KEYS.SCHEDULES);
    const cachedTimestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    
    if (cachedTours && cachedSchedules && cachedTimestamp) {
      const timestamp = JSON.parse(cachedTimestamp);
      const now = Date.now();
      
      // Проверяем, не устарел ли кэш
      if (now - timestamp < CACHE_TTL) {
        return {
          tours: JSON.parse(cachedTours),
          schedules: JSON.parse(cachedSchedules),
          isValid: true
        };
      }
    }
  } catch (error) {
    console.error('Error loading from cache:', error);
  }
  
  return { tours: [], schedules: [], isValid: false };
};

export const useTours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  // Загрузка данных из кэша
  useEffect(() => {
    const cachedData = loadFromCache();
    if (cachedData.isValid) {
      setTours(cachedData.tours);
      setSchedules(cachedData.schedules);
      setLoading(false);
    }
  }, []);

  // Загрузка данных с пагинацией
  const loadMoreTours = useCallback(async () => {
    // Используем ref вместо state для проверки загрузки, чтобы избежать лишних ререндеров
    if (loadingRef.current || !hasMore) {
      console.log('Пропускаем загрузку - уже загружается или нет данных', { 
        loading: loadingRef.current, 
        hasMore 
      });
      return;
    }

    console.log('Начало загрузки данных...');
    loadingRef.current = true;
    setLoading(true);

    try {
      // Проверяем кэш
      const cachedData = loadFromCache();
      if (cachedData.isValid && page === 1) {
        console.log('Используем кэшированные данные');
        setTours(cachedData.tours);
        setSchedules(cachedData.schedules);
        return;
      }

      console.log('Загрузка из Firebase...');
      const toursRef = ref(database, 'tours');
      const toursQuery = query(
        toursRef,
        orderByChild('createdAt'),
        limitToFirst(ITEMS_PER_PAGE * page)
      );

      const [toursSnapshot, schedulesSnapshot] = await Promise.all([
        get(toursQuery),
        get(ref(database, 'schedules'))
      ]);

      if (toursSnapshot.exists()) {
        const toursData = toursSnapshot.val();
        const newTours = Object.entries(toursData).map(([id, data]: [string, any]) => ({
          ...data,
          id,
          loading: 'lazy',
          fetchpriority: page === 1 ? 'high' : 'low'
        }));

        const schedulesData = schedulesSnapshot.exists() 
          ? Object.values(schedulesSnapshot.val()) 
          : [];
        
        saveToCache(newTours, schedulesData);
        
        setTours(newTours);
        setSchedules(schedulesData);
        setHasMore(newTours.length === ITEMS_PER_PAGE * page);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Ошибка загрузки туров');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, hasMore]);

  // Загрузка данных при монтировании и изменении страницы
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        await loadMoreTours();
      } catch (error) {
        console.error('Ошибка в fetchData:', error);
        if (isMounted) {
          setError('Ошибка загрузки данных');
          loadingRef.current = false;
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [page, loadMoreTours]); // Добавляем loadMoreTours обратно в зависимости, так как используем useCallback с правильными зависимостями

  // Функция для обновления данных
  const refreshData = useCallback(async () => {
    try {
      // Очищаем кэш и загружаем заново
      localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
      setPage(1);
      setHasMore(true);
      
      const schedulesRef = ref(database, 'schedules');
      const schedulesSnapshot = await get(schedulesRef);

      if (schedulesSnapshot.exists()) {
        const initialToursWithoutStudent = initialTours;  
        const toursRef = ref(database, 'tours');
        await set(toursRef, initialToursWithoutStudent.reduce<Record<string, Tour>>((acc, tour) => {
          acc[tour.id] = tour;
          return acc;
        }, {}));
      }

      if (!schedulesSnapshot.exists()) {
        await set(schedulesRef, initialSchedules.reduce<Record<string, TourSchedule>>((acc, schedule) => {
          acc[schedule.id] = schedule;
          return acc;
        }, {}));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Cleanup if needed in the future
    };
  }, []);

  // Сохраняем данные в кэш при изменении
  useEffect(() => {
    if (tours.length > 0 && schedules.length > 0) {
      saveToCache(tours, schedules);
    }
  }, [tours, schedules]);

  const addTour = useCallback(async (tourData: Omit<Tour, 'id'>) => {
    // Используем существующие тарифы
    const pricing = tourData.pricing;
    const newTour: Tour = {
      ...tourData,
      pricing,
      id: Date.now().toString()
    };

    try {
      await set(ref(database, `tours/${newTour.id}`), newTour);
      return newTour;
    } catch (error) {
      console.error('Error adding tour:', error);
      setError('Ошибка добавления тура');
      throw error;
    }
  }, []);

  const updateTour = useCallback(async (tourId: string, tourData: Omit<Tour, 'id'>) => {
    try {
      setLoading(true);
      console.log('Updating tour in Firebase:', { tourId, tourData });
      
      // Обновляем в Firebase
      await update(ref(database, `tours/${tourId}`), {
        ...tourData,
        updatedAt: Date.now() // Добавляем метку времени обновления
      });

      // Обновляем локальное состояние
      setTours(prevTours => 
        prevTours.map(tour => 
          tour.id === tourId ? { ...tour, ...tourData } : tour
        )
      );

      // Обновляем кэш
      const cachedData = loadFromCache();
      if (cachedData.isValid) {
        const updatedTours = cachedData.tours.map(tour => 
          tour.id === tourId ? { ...tour, ...tourData } : tour
        );
        saveToCache(updatedTours, cachedData.schedules);
      }

      console.log('Tour updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating tour:', error);
      setError('Ошибка обновления тура');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTour = useCallback(async (tourId: string) => {
    console.log('deleteTour called with tourId:', tourId);
    try {
      console.log('Attempting to remove tour from Firebase...');
      await remove(ref(database, `tours/${tourId}`));
      console.log('Tour removed from Firebase successfully');
      
      // Удаляем связанные расписания - но только если они существуют
      console.log('Attempting to remove related schedules...');
      const schedulesRef = ref(database, 'schedules');
      const snapshot = await get(schedulesRef);
      if (snapshot.exists()) {
        const schedules = snapshot.val();
        console.log('Found schedules:', schedules);
        const schedulePromises = Object.entries(schedules)
          .filter(([key, schedule]: [string, any]) => schedule.tourId === tourId)
          .map(([key]) => {
            console.log('Removing schedule:', key);
            return remove(ref(database, `schedules/${key}`));
          });
        
        await Promise.all(schedulePromises);
        console.log('All related schedules removed');
      }
      console.log('deleteTour completed successfully');
    } catch (error) {
      console.error('Error in deleteTour:', error);
      setError('Ошибка удаления тура');
      throw error;
    }
  }, []);

  const addSchedule = useCallback(async (scheduleData: Omit<TourSchedule, 'id'>) => {
    const newSchedule: TourSchedule = {
      ...scheduleData,
      id: Date.now().toString()
    };

    try {
      await set(ref(database, `schedules/${newSchedule.id}`), newSchedule);
      
      // Update local state
      setSchedules(prevSchedules => [...prevSchedules, newSchedule]);
      
      // Update cache
      const cachedData = loadFromCache();
      const updatedSchedules = [...(cachedData.schedules || []), newSchedule];
      saveToCache(cachedData.tours || [], updatedSchedules);
      
      return newSchedule;
    } catch (error) {
      console.error('Error adding schedule:', error);
      setError('Ошибка добавления расписания');
      throw error;
    }
  }, []);

  // In useTours.ts
const deleteSchedule = useCallback(async (scheduleId: string, isUserAuthenticated: boolean) => {
  if (!isUserAuthenticated) {
    console.error('Ошибка: Пользователь не аутентифицирован');
    throw new Error('Пользователь не аутентифицирован');
  }

  try {
    console.log('Попытка удаления расписания с ID:', scheduleId);
    const scheduleRef = ref(database, `schedules/${scheduleId}`);
    await remove(scheduleRef);
    console.log('Расписание успешно удалено');
  } catch (error) {
    console.error('Ошибка при удалении расписания:', error);
    throw error;
  }
}, []);

  const updateScheduleSpots = useCallback(async (scheduleId: string, availableSpots: number) => {
    console.log('updateScheduleSpots called with scheduleId and availableSpots:', scheduleId, availableSpots);
    try {
      console.log('Attempting to update schedule spots in Firebase...');
      await update(ref(database, `schedules/${scheduleId}`), {
        availableSpots: availableSpots
      });
      console.log('Schedule spots updated in Firebase successfully');
    } catch (error) {
      console.error('Error in updateScheduleSpots:', error);
      setError('Ошибка обновления мест в расписании');
      throw error;
    }
  }, []);

  const updateScheduleSpotsManual = useCallback(async (scheduleId: string, newAvailableSpots: number, newMaxSpots?: number) => {
    console.log('updateScheduleSpotsManual called with scheduleId, newAvailableSpots, newMaxSpots:', scheduleId, newAvailableSpots, newMaxSpots);
    try {
      console.log('Attempting to manually update schedule spots in Firebase...');
      const updateData: any = {
        availableSpots: newAvailableSpots
      };
      
      if (newMaxSpots !== undefined) {
        updateData.maxSpots = newMaxSpots;
      }
      
      await update(ref(database, `schedules/${scheduleId}`), updateData);
      console.log('Schedule spots manually updated in Firebase successfully');
    } catch (error) {
      console.error('Error in updateScheduleSpotsManual:', error);
      setError('Ошибка ручного обновления мест в расписании');
      throw error;
    }
  }, []);

  const updateSchedule = useCallback(async (scheduleId: string, updateData: Partial<TourSchedule>) => {
    console.log('updateSchedule called with scheduleId and updateData:', scheduleId, updateData);
    try {
      console.log('Attempting to update schedule in Firebase...');
      await update(ref(database, `schedules/${scheduleId}`), updateData);
      console.log('Schedule updated in Firebase successfully');
    } catch (error) {
      console.error('Error in updateSchedule:', error);
      setError('Ошибка обновления расписания');
      throw error;
    }
  }, []);

  return {
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
    loadMoreTours
  };
};