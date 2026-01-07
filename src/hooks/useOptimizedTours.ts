import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tour, TourSchedule } from '../types';
import { database } from '../firebase/config';
import { ref, get } from 'firebase/database';

// Cache TTL (1 minute for faster updates)
const CACHE_DURATION = 1 * 60 * 1000;

// Cache for storing tours and schedules
let toursCache: Tour[] | null = null;
let schedulesCache: TourSchedule[] | null = null;
// Using a simple object to store the last fetch time to avoid TypeScript const error
const cacheState = { lastFetchTime: 0 };

// Helper function to load from localStorage synchronously
const loadInitialData = () => {
  try {
    const cachedTours = localStorage.getItem('toursCache');
    const cachedSchedules = localStorage.getItem('schedulesCache');
    
    if (cachedTours && cachedSchedules) {
      return {
        tours: JSON.parse(cachedTours) as Tour[],
        schedules: JSON.parse(cachedSchedules) as TourSchedule[],
        hasCache: true
      };
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }
  return { tours: [], schedules: [], hasCache: false };
};

export const useOptimizedTours = () => {
  // Initialize with cached data immediately
  const [tours, setTours] = useState<Tour[]>(() => loadInitialData().tours);
  const [schedules, setSchedules] = useState<TourSchedule[]>(() => loadInitialData().schedules);
  const [loading, setLoading] = useState(!loadInitialData().hasCache);
  const [error, setError] = useState<string | null>(null);

  // Force refresh function will be defined after loadTours
  const forceRefresh = useCallback(() => {
    console.log('Force refreshing tours and schedules data...');
    // Clear cache to force fresh data
    toursCache = null;
    schedulesCache = null;
    cacheState.lastFetchTime = 0;
    localStorage.removeItem('toursCache');
    localStorage.removeItem('schedulesCache');
    // Set loading to true and trigger reload
    setLoading(true);
    // Will be called after loadTours is defined
  }, []);

  
  // Load all tours and schedules at once
  const loadTours = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Always load from localStorage first for instant display
    const localData = loadInitialData();
    if (localData.tours.length > 0 && !forceRefresh) {
      setTours(localData.tours);
      setSchedules(localData.schedules);
      setLoading(false);
    }
    
    // Return cached data if it's still fresh and not forcing refresh
    if (!forceRefresh && toursCache && schedulesCache && (now - cacheState.lastFetchTime) < CACHE_DURATION) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Retry mechanism for Firebase connection
      let retryCount = 0;
      const maxRetries = 3;
      let toursSnapshot, schedulesSnapshot;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Попытка загрузки данных из Firebase (попытка ${retryCount + 1}/${maxRetries})`);
          
          // Load all data in parallel with longer timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Loading timeout')), 5000)
          );
          
          [toursSnapshot, schedulesSnapshot] = await Promise.race([
            Promise.all([
              get(ref(database, 'tours')),
              get(ref(database, 'schedules'))
            ]),
            timeoutPromise
          ]) as [any, any];
          
          // If we got here, loading was successful
          console.log('Данные успешно загружены из Firebase');
          break;
          
        } catch (loadError) {
          retryCount++;
          console.error(`Ошибка загрузки (попытка ${retryCount}):`, loadError);
          
          if (retryCount >= maxRetries) {
            throw loadError;
          }
          
          // Wait before retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          console.log(`Повторная попытка через ${delay/1000} секунд...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      let toursData: Tour[] = [];
      let schedulesData: TourSchedule[] = [];
      
      if (toursSnapshot.exists()) {
        toursData = Object.entries(toursSnapshot.val()).map(([id, data]: [string, any]) => ({
          ...data,
          id,
          loading: 'lazy',
          fetchpriority: 'high'
        }));
      }
      
      if (schedulesSnapshot.exists()) {
        schedulesData = Object.entries(schedulesSnapshot.val()).map(([id, data]: [string, any]) => ({
          ...data,
          id
        }));
      }
      
      // Update cache
      toursCache = toursData;
      schedulesCache = schedulesData;
      cacheState.lastFetchTime = now;
      
      setTours(toursData);
      setSchedules(schedulesData);
      
      // Save to localStorage for persistence
      localStorage.setItem('toursCache', JSON.stringify(toursData));
      localStorage.setItem('schedulesCache', JSON.stringify(schedulesData));
      localStorage.setItem('lastFetchTime', now.toString());
      
    } catch (err) {
      console.error('Error loading tours after retries:', err);
      setError('Ошибка загрузки туров');
      
      // Always try to show some data, never leave empty screen
      let hasFallbackData = false;
      
      // Try memory cache first
      if (toursCache && schedulesCache) {
        console.log('Using memory cache as fallback');
        setTours(toursCache);
        setSchedules(schedulesCache);
        setError(null);
        hasFallbackData = true;
      } else {
        // Try localStorage
        const cachedTours = localStorage.getItem('toursCache');
        const cachedSchedules = localStorage.getItem('schedulesCache');
        
        if (cachedTours && cachedSchedules) {
          console.log('Using localStorage cache as fallback');
          setTours(JSON.parse(cachedTours));
          setSchedules(JSON.parse(cachedSchedules));
          setError(null);
          hasFallbackData = true;
        } else {
          // Last resort - show demo data to prevent empty screen
          console.log('Using demo data as last resort');
          const demoTours = [
            {
              id: 'demo-1',
              title: 'Прогулка с Дедом Морозом',
              description: 'Увлекательная экскурсия по зимнему Нижнему Новгороду',
              price: 1500,
              maxGroupSize: 20,
              duration: '2 часа',
              image: '/api/placeholder/400/300',
              loading: 'lazy',
              fetchpriority: 'high'
            }
          ];
          setTours(demoTours);
          setSchedules([]);
          setError('Показаны демо данные. Обновите страницу позже.');
          hasFallbackData = true;
        }
      }
      
      // If we have fallback data, try to reload in background after delay
      if (hasFallbackData) {
        console.log('Will retry loading in background after 30 seconds');
        setTimeout(() => {
          console.log('Background retry attempt...');
          loadTours(true); // Force refresh
        }, 30000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Update forceRefresh to call loadTours after it's defined
  const updatedForceRefresh = useCallback(() => {
    console.log('Force refreshing tours and schedules data...');
    // Clear cache to force fresh data
    toursCache = null;
    schedulesCache = null;
    cacheState.lastFetchTime = 0;
    localStorage.removeItem('toursCache');
    localStorage.removeItem('schedulesCache');
    // Trigger reload
    loadTours();
  }, [loadTours]);

  // Update event listener to use the new force refresh function
  useEffect(() => {
    const handleForceRefresh = () => {
      console.log('Received force refresh event');
      updatedForceRefresh();
    };

    window.addEventListener('forceDataRefresh', handleForceRefresh);
    return () => {
      window.removeEventListener('forceDataRefresh', handleForceRefresh);
    };
  }, [updatedForceRefresh]);

  // Load fresh data on mount
  useEffect(() => {
    const now = Date.now();
    const lastFetch = localStorage.getItem('lastFetchTime');
    const shouldFetchFresh = !lastFetch || (now - parseInt(lastFetch, 10) >= CACHE_DURATION);
    
    if (shouldFetchFresh) {
      loadTours();
    } else if (tours.length === 0) {
      // If we have no tours but have a fresh cache, load from cache
      const { tours: cachedTours, schedules: cachedSchedules } = loadInitialData();
      if (cachedTours.length > 0) {
        setTours(cachedTours);
        setSchedules(cachedSchedules);
      } else {
        loadTours();
      }
    }
  }, [loadTours, tours.length]);

  // Memoize the result to prevent unnecessary re-renders
  return useMemo(() => ({
    tours, 
    schedules, 
    loading, 
    error, 
    refreshData: loadTours
  }), [tours, schedules, loading, error, loadTours]);
};

export default useOptimizedTours;
