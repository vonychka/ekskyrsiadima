import { useState, useEffect, useCallback, useRef } from 'react';
import { Tour, TourSchedule } from '../types';
import { tours as initialTours, tourSchedules as initialSchedules } from '../data/tours';
import { database } from '../firebase/config';
// @ts-ignore - Temporary fix for Firebase import issues
import * as databaseFunctions from 'firebase/database';
const { ref, set, get, update, remove, query, orderByChild, limitToFirst } = databaseFunctions;

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
        const toursArray = Object.keys(toursData).map(key => ({
          ...toursData[key] as any,
          id: key
        }));
        
        const schedulesData = schedulesSnapshot.exists() 
          ? schedulesSnapshot.val() as any
          : {};
        const schedulesArray = Object.keys(schedulesData).map(key => ({
          ...schedulesData[key] as any,
          id: key
        }));
        
        saveToCache(toursArray, schedulesArray);
        
        setTours(toursArray);
        setSchedules(schedulesArray);
        setHasMore(toursArray.length === ITEMS_PER_PAGE * page);
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
      
      // Обновляем локальное состояние и кэш
      setTours(prev => {
        const updatedTours = [...prev, newTour];
        // Обновляем кэш с новыми данными
        saveToCache(updatedTours, schedules);
        return updatedTours;
      });
      console.log('Локальное состояние туров обновлено после добавления');
      
      return newTour;
    } catch (error) {
      console.error('Error adding tour:', error);
      setError('Ошибка добавления тура');
      throw error;
    }
  }, [schedules]);

  const updateTour = useCallback(async (tourId: string, tourData: Partial<Tour>) => {
    try {
      console.log('Updating tour in Firebase:', { tourId, tourData });
      
      // Обновляем в Firebase
      await update(ref(database, `tours/${tourId}`), {
        ...tourData,
        updatedAt: new Date().toISOString()
      });
      
      // Обновляем локальное состояние
      setTours(prev => {
        const updatedTours = prev.map((tour: Tour) => 
          tour.id === tourId ? { ...tour, ...tourData, updatedAt: new Date().toISOString() } : tour
        );
        
        // Обновляем кэш с новыми данными
        saveToCache(updatedTours, schedules);
        
        return updatedTours;
      });
      
      console.log('Tour updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating tour:', error);
      setError('Ошибка обновления тура');
      return false;
    }
  }, [schedules]);

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
      
      // Обновляем локальное состояние и кэш
      setTours(prev => {
        const updatedTours = prev.filter(tour => tour.id !== tourId);
        return updatedTours;
      });
      setSchedules(prev => {
        const updatedSchedules = prev.filter(schedule => schedule.tourId !== tourId);
        return updatedSchedules;
      });
      
      // Обновляем кэш после удаления
      setTimeout(() => {
        const currentTours = tours.filter(tour => tour.id !== tourId);
        const currentSchedules = schedules.filter(schedule => schedule.tourId !== tourId);
        saveToCache(currentTours, currentSchedules);
      }, 0);
      console.log('Локальное состояние тура и связанных расписаний обновлено');
      
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
const deleteSchedule = useCallback(async (scheduleId: string, _isUserAuthenticated: boolean) => {
  try {
    console.log('Попытка удаления расписания с ID:', scheduleId);
    const scheduleRef = ref(database, `schedules/${scheduleId}`);
    await remove(scheduleRef);
    console.log('Расписание успешно удалено');
    
    // Обновляем локальное состояние
    setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    console.log('Локальное состояние обновлено');
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
      
      // Обновляем локальное состояние
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, availableSpots } : schedule
      ));
      console.log('Локальное состояние мест расписания обновлено');
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
      
      // Обновляем локальное состояние
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, ...updateData } : schedule
      ));
      console.log('Локальное состояние ручного обновления расписания обновлено');
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
      
      // Обновляем локальное состояние
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, ...updateData } : schedule
      ));
      console.log('Локальное состояние расписания обновлено');
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