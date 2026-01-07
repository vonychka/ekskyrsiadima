import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tour, TourSchedule } from '../types';
import { database } from '../firebase/config';
import { ref, get } from 'firebase/database';

// Cache TTL (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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
  const loadTours = useCallback(async () => {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (toursCache && schedulesCache && (now - cacheState.lastFetchTime) < CACHE_DURATION) {
      setTours(toursCache);
      setSchedules(schedulesCache);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Load all data in parallel
      const [toursSnapshot, schedulesSnapshot] = await Promise.all([
        get(ref(database, 'tours')),
        get(ref(database, 'schedules'))
      ]);
      
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
      console.error('Error loading tours:', err);
      setError('Ошибка загрузки туров');
      
      // Try to load from localStorage if available
      const cachedTours = localStorage.getItem('toursCache');
      const cachedSchedules = localStorage.getItem('schedulesCache');
      
      if (cachedTours && cachedSchedules) {
        setTours(JSON.parse(cachedTours));
        setSchedules(JSON.parse(cachedSchedules));
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
