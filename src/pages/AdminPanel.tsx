import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, Users, Lock, Eye, EyeOff, Settings, Gift, Percent, DollarSign, Check, X, Image, Star } from 'lucide-react';
import { useToursContext } from '../context/ToursContext';
import { Tour, TourSchedule, PromoCode } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import NotificationSystem from '../components/NotificationSystem';
import MultiFileUpload from '../components/MultiFileUpload';
import { reviewService } from '../services/reviewService';
import { Review } from '../types/review';
import { 
  verifyPassword, 
  ADMIN_HASHED_PASSWORD, 
  performSecurityChecks, 
  recordLoginAttempt
} from '../utils/auth';

const AdminPanel: React.FC = () => {
  const { tours, schedules, addTour, updateTour, deleteTour, addSchedule, deleteSchedule, updateSchedule, promoCodes, createPromoCode, updatePromoCode, deletePromoCode } = useToursContext();
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Фильтрация отображаемых расписаний (показываем сегодняшние и будущие)
  const getActiveSchedules = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return schedules.filter(schedule => {
      const scheduleDate = schedule.date;
      const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
      
      // Показываем все расписания на сегодня и в будущем
      return scheduleDate >= today || scheduleDateTime >= now;
    }).sort((a, b) => {
      // Сортируем по дате и времени
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Проверка и удаление истекших расписаний (кроме сегодняшних)
  const cleanupExpiredSchedules = async () => {
    if (!isAuthenticated) {
      console.log('Пользователь не аутентифицирован, пропускаем удаление устаревших расписаний');
      return;
    }

    try {
      const now = new Date();
      // Получаем сегодняшнюю дату в формате YYYY-MM-DD
      const today = now.toISOString().split('T')[0];
      
      console.log('Проверка устаревших расписаний...');
      const expiredSchedules = schedules.filter(schedule => {
        const scheduleDate = schedule.date;
        const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
        
        // Оставляем все сегодняшние расписания и будущие
        // Удаляем только вчерашние и более старые расписания
        return scheduleDate !== today && scheduleDateTime < now;
      });

      console.log(`Найдено ${expiredSchedules.length} устаревших расписаний (не включая сегодняшние)`);

      for (const schedule of expiredSchedules) {
        try {
          console.log(`Удаление устаревшего расписания ${schedule.id} (${schedule.date} ${schedule.time})...`);
          await deleteSchedule(schedule.id);
        } catch (error) {
          console.error(`Ошибка при удалении расписания ${schedule.id}:`, error);
        }
      }

      if (expiredSchedules.length > 0) {
        addNotification(`Удалено ${expiredSchedules.length} устаревших расписаний`, 'info');
      }
    } catch (error) {
      console.error('Ошибка при очистке устаревших расписаний:', error);
      addNotification('Ошибка при удалении устаревших расписаний', 'error');
  }
};

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'tours' | 'schedules' | 'promoCodes' | 'reviews' | 'analytics'>('tours');
  const [loading, setLoading] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [showTourForm, setShowTourForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [newSchedule, setNewSchedule] = useState<Omit<TourSchedule, 'id'>>({
    tourId: '',
    date: '',
    time: '',
    availableSpots: 20,
    maxSpots: 20,
    bookedSpots: 0
  });
  const [spotManagement, setSpotManagement] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TourSchedule | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [multiFileUpload, setMultiFileUpload] = useState<File[]>([]);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [newPromo, setNewPromo] = useState<PromoCode>({
    id: '',
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    description: '',
    isActive: true,
    maxUses: undefined,
    currentUses: 0,
    validFrom: '',
    validUntil: '',
    applicableTours: [],
    applicableTariffs: [],
    maxPeople: undefined,
    createdBy: '',
    createdAt: ''
  });
  const [showPromoForm, setShowPromoForm] = useState(false);
  
  // Состояния для отзывов
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка безопасности перед попыткой входа
    if (!performSecurityChecks()) {
      addNotification('Слишком много попыток входа. Попробуйте позже.', 'error');
      return;
    }
    
    if (await verifyPassword(password, ADMIN_HASHED_PASSWORD)) {
      setIsAuthenticated(true);
      addNotification('Успешный вход в админ-панель', 'success');
      recordLoginAttempt(true);
    } else {
      addNotification('Неверный пароль', 'error');
      recordLoginAttempt(false);
    }
  };

  const handleSaveTour = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Получаем URL из текстового поля
    const galleryUrls = (formData.get('gallery_urls') as string || '')
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    // Если есть загруженные файлы, конвертируем их в base64 для хранения в Firebase
    const fileUrls: string[] = [];
    for (const file of galleryFiles) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
      fileUrls.push(base64);
    }
    
    const allGalleryUrls = [...galleryUrls, ...fileUrls];
    
    const tourData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      pricing: {
        standard: Number(formData.get('standard_price')),
        child: Number(formData.get('child_price')),
        family: Number(formData.get('family_price'))
      },
      duration: formData.get('duration') as string,
      address: formData.get('address') as string,
      image: formData.get('image') as string,
      gallery: allGalleryUrls,
      category: formData.get('category') as string,
      isPopular: formData.get('isPopular') === 'on',
      maxGroupSize: Number(formData.get('maxGroupSize')),
      highlights: (formData.get('highlights') as string || '').split('\n').filter(h => h.trim())
    };
    console.log('handleSaveTour called with:', tourData);
    try {
      if (editingTour) {
        console.log('Updating tour:', editingTour.id);
        await updateTour(editingTour.id, tourData);
        addNotification('Экскурсия обновлена', 'success');
      } else {
        console.log('Creating new tour');
        await addTour(tourData);
        addNotification('Экскурсия добавлена', 'success');
      }
      setShowTourForm(false);
      setEditingTour(null);
      setGalleryFiles([]);
    } catch (error) {
      console.error('Error in handleSaveTour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      addNotification('Ошибка при сохранении экскурсии: ' + errorMessage, 'error');
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    console.log('handleDeleteTour called with:', tourId);
    if (window.confirm('Вы уверены, что хотите удалить эту экскурсию?')) {
      try {
        console.log('Deleting tour:', tourId);
        await deleteTour(tourId);
        addNotification('Экскурсия удалена', 'success');
      } catch (error) {
        console.error('Error in handleDeleteTour:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        addNotification('Ошибка при удалении экскурсии: ' + errorMessage, 'error');
      }
    }
  };

  const handleSaveSchedule = async () => {
    console.log('handleSaveSchedule called with:', newSchedule);
    
    // Validate required fields
    if (!newSchedule.tourId || !newSchedule.date || !newSchedule.time) {
      addNotification('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log('Попытка добавления расписания:', newSchedule);
      
      // Create a proper schedule object with all required fields
      const scheduleToAdd = {
        tourId: newSchedule.tourId,
        date: newSchedule.date,
        time: newSchedule.time,
        availableSpots: Number(newSchedule.availableSpots) || 20,
        maxSpots: Number(newSchedule.maxSpots) || 20,
        bookedSpots: 0, // Add the missing required field
      };

      console.log('Отправка данных расписания:', scheduleToAdd);
      
      // Add the schedule
      const addedSchedule = await addSchedule(scheduleToAdd);
      console.log('Расписание успешно добавлено:', addedSchedule);
      
      // Reset the form
      setNewSchedule({
        tourId: '',
        date: '',
        time: '',
        availableSpots: 20,
        maxSpots: 20,
        bookedSpots: 0
      });
      
      // Close the form
      setShowScheduleForm(false);
      
      // Show success message
      addNotification('Расписание успешно добавлено', 'success');
      
    } catch (error) {
      console.error('Ошибка при добавлении расписания:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      addNotification(`Ошибка при добавлении расписания: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    console.log('handleDeleteSchedule called with:', scheduleId);
    if (window.confirm('Вы уверены, что хотите удалить это время?')) {
      try {
        console.log('Deleting schedule:', scheduleId);
        await deleteSchedule(scheduleId);
        addNotification('Время экскурсии удалено', 'success');
      } catch (error) {
        console.error('Error in handleDeleteSchedule:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        addNotification('Ошибка при удалении времени: ' + errorMessage, 'error');
      }
    }
  };

  const handleUpdateSpots = async (scheduleId: string, availableSpots: number, maxSpots: number) => {
    // Implementation needed
  };

  const handleSavePromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Получаем все значения из формы
    const maxUsesValue = formData.get('maxUses');
    const maxPeopleValue = formData.get('maxPeople');
    const validUntilValue = formData.get('validUntil');
    
    const promoData = {
      id: editingPromo?.id || '', // Добавляем id для редактирования
      code: formData.get('code') as string,
      discountType: formData.get('discountType') as 'percentage' | 'fixed' | 'free',
      discountValue: Number(formData.get('discountValue')),
      description: formData.get('description') as string,
      isActive: formData.get('isActive') === 'on',
      maxUses: maxUsesValue ? Number(maxUsesValue) : undefined,
      currentUses: editingPromo?.currentUses || 0, // Добавляем currentUses
      validFrom: formData.get('validFrom') as string,
      validUntil: validUntilValue as string,
      applicableTours: [],
      applicableTariffs: [],
      maxPeople: maxPeopleValue ? Number(maxPeopleValue) : undefined,
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };

    // Удаляем null и undefined значения, чтобы Firebase не ругался
    // Для создания нового промокода удаляем свойство id
    const entries = Object.entries(promoData).filter(([_, value]) => value !== null && value !== undefined);
    const cleanPromoData = Object.fromEntries(
      editingPromo ? entries : entries.filter(([key]) => key !== 'id')
    );

    try {
      if (editingPromo) {
        await updatePromoCode(editingPromo.id, cleanPromoData);
        addNotification('Промокод обновлен', 'success');
      } else {
        await createPromoCode(cleanPromoData);
        addNotification('Промокод создан', 'success');
      }
      setShowPromoForm(false);
      setEditingPromo(null);
      setNewPromo({
        id: '',
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        description: '',
        isActive: true,
        maxUses: undefined,
        currentUses: 0,
        validFrom: '',
        validUntil: '',
        applicableTours: [],
        applicableTariffs: [],
        maxPeople: undefined,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      addNotification('Ошибка при сохранении промокода: ' + errorMessage, 'error');
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      try {
        await deletePromoCode(promoId);
        addNotification('Промокод удален', 'success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        addNotification('Ошибка при удалении промокода: ' + errorMessage, 'error');
      }
    }
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setNewPromo({
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      description: promo.description,
      isActive: promo.isActive,
      maxUses: promo.maxUses,
      currentUses: promo.currentUses,
      validFrom: promo.validFrom,
      validUntil: promo.validUntil,
      applicableTours: promo.applicableTours,
      applicableTariffs: promo.applicableTariffs,
      maxPeople: promo.maxPeople,
      createdBy: promo.createdBy,
      createdAt: promo.createdAt
    });
    setShowPromoForm(true);
  };

  useEffect(() => {
    if (!performSecurityChecks()) {
      addNotification('Слишком много попыток входа. Попробуйте позже.', 'error');
    }
  }, [performSecurityChecks, addNotification]);

  useEffect(() => {
    if (isAuthenticated && schedules.length > 0) {
      const lastCleanup = localStorage.getItem('lastCleanup');
      const now = new Date();
      
      // Запускаем очистку не чаще одного раза в час
      if (!lastCleanup || (now.getTime() - new Date(lastCleanup).getTime()) > 60 * 60 * 1000) {
        console.log('Запуск очистки устаревших расписаний...');
        cleanupExpiredSchedules();
        localStorage.setItem('lastCleanup', now.toISOString());
      }
    }
  }, [isAuthenticated, schedules, cleanupExpiredSchedules, deleteSchedule, addNotification]);

  // Загрузка отзывов
  useEffect(() => {
    const loadReviews = async () => {
      if (isAuthenticated && activeTab === 'reviews') {
        setLoadingReviews(true);
        try {
          const reviewsData = await reviewService.getAllReviews();
          setReviews(reviewsData);
        } catch (error) {
          addNotification('Ошибка при загрузке отзывов', 'error');
        } finally {
          setLoadingReviews(false);
        }
      }
    };

    loadReviews();
  }, [isAuthenticated, activeTab]);

  // Функции для работы с отзывами
  const handleApproveReview = async (reviewId: string) => {
    try {
      await reviewService.approveReview(reviewId);
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'approved' as const } : review
      ));
      addNotification('Отзыв одобрен', 'success');
    } catch (error) {
      addNotification('Ошибка при одобрении отзыва', 'error');
    }
  };

  const handleRejectReview = async (reviewId: string, reason: string) => {
    try {
      await reviewService.rejectReview(reviewId, reason);
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'rejected' as const, rejectionReason: reason } : review
      ));
      addNotification('Отзыв отклонен', 'success');
    } catch (error) {
      addNotification('Ошибка при отклонении отзыва', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId);
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      addNotification('Отзыв удален', 'success');
    } catch (error) {
      addNotification('Ошибка при удалении отзыва', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative">
        <NotificationSystem notifications={notifications} onRemove={removeNotification} />
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Админ-панель</h1>
            <p className="text-gray-600">Введите пароль для доступа</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите пароль"
                  required
                  disabled={!performSecurityChecks()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!performSecurityChecks() && (
                <p className="text-red-600 text-sm mt-2">
                  Слишком много попыток входа. Попробуйте через 5 минут.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!performSecurityChecks()}
            >
              Войти
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Выйти
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('tours')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'tours'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Экскурсии
              </button>
              <button
                onClick={() => setActiveTab('schedules')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schedules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Расписание
              </button>
              <button
                onClick={() => setActiveTab('promoCodes')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'promoCodes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Промокоды
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Отзывы
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Аналитика
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'tours' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Управление экскурсиями</h2>
                  <button
                    onClick={() => setShowTourForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить экскурсию</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {tours.map((tour) => (
                    <div key={tour.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{tour.title}</h3>
                          <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">{tour.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Цена: от {tour.pricing.child.toLocaleString('ru-RU')} ₽</span>
                            <span>Длительность: {tour.duration}</span>
                            <span>Адрес: {tour.address}</span>
                            <span>Категория: {tour.category}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {(tour as any).isPopular && (
                              <span>Популярно</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setEditingTour(tour)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTour(tour.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedules' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Управление расписанием</h2>
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить время</span>
                  </button>
                </div>

                <div className="mb-6">
                  <select
                    value={selectedTourId}
                    onChange={(e) => setSelectedTourId(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">Все экскурсии</option>
                    {tours.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  {getActiveSchedules()
                    .filter(schedule => !selectedTourId || schedule.tourId === selectedTourId)
                    .map((schedule) => {
                      const tour = tours.find(t => t.id === schedule.tourId);
                      return (
                        <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{tour?.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{schedule.date}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{schedule.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{schedule.availableSpots}/{schedule.maxSpots}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setSpotManagement(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-2"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {activeTab === 'promoCodes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Управление промокодами</h2>
                  <button
                    onClick={() => setShowPromoForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить промокод</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {promoCodes.map((promoCode) => (
                    <div key={promoCode.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{promoCode.code}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              promoCode.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {promoCode.isActive ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{promoCode.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {promoCode.discountType === 'percentage' && (
                              <div className="flex items-center space-x-1">
                                <Percent className="w-4 h-4" />
                                <span>{promoCode.discountValue}% скидка</span>
                              </div>
                            )}
                            {promoCode.discountType === 'fixed' && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{promoCode.discountValue.toLocaleString('ru-RU')} ₽ скидка</span>
                              </div>
                            )}
                            {promoCode.discountType === 'free' && (
                              <div className="flex items-center space-x-1">
                                <Gift className="w-4 h-4" />
                                <span>Бесплатно</span>
                              </div>
                            )}
                            <span>Использовано: {promoCode.currentUses}{promoCode.maxUses ? `/${promoCode.maxUses}` : ''}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <div>С: {new Date(promoCode.validFrom).toLocaleDateString('ru-RU')}</div>
                            {promoCode.validUntil && (
                              <div>По: {new Date(promoCode.validUntil).toLocaleDateString('ru-RU')}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditPromo(promoCode)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promoCode.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {promoCodes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Промокодов пока нет</p>
                      <p className="text-sm">Создайте первый промокод, чтобы предложить скидки клиентам</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tour Form Modal */}
        {(showTourForm || editingTour) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {editingTour ? 'Редактировать экскурсию' : 'Добавить экскурсию'}
                </h3>
                
                <form onSubmit={handleSaveTour}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название экскурсии
                      </label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={editingTour?.title || ''}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingTour?.description || ''}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Взрослый тариф (₽)
                        </label>
                        <input
                          type="number"
                          name="standard_price"
                          defaultValue={editingTour?.pricing.standard || ''}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Детский тариф (₽)
                        </label>
                        <input
                          type="number"
                          name="child_price"
                          defaultValue={editingTour?.pricing.child || ''}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Семейный тариф (₽)
                        </label>
                        <input
                          type="number"
                          name="family_price"
                          defaultValue={editingTour?.pricing.family || ''}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Длительность
                        </label>
                        <input
                          type="text"
                          name="duration"
                          defaultValue={editingTour?.duration || ''}
                          placeholder="3 часа"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📍 Адрес встречи
                        </label>
                        <input
                          type="text"
                          name="address"
                          defaultValue={editingTour?.address || ''}
                          placeholder="Большая Покровская улица, 1/1"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Изображение экскурсии
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
                                const imageUrl = document.getElementById('image-url') as HTMLInputElement;
                                if (imagePreview && imageUrl && event.target?.result) {
                                  imagePreview.src = event.target.result as string;
                                  imagePreview.style.display = 'block';
                                  imageUrl.value = event.target.result as string;
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="hidden"
                          id="image-url"
                          name="image"
                          defaultValue={editingTour?.image || ''}
                        />
                        <div className="text-sm text-gray-500">
                          Или введите URL изображения:
                        </div>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          onChange={(e) => {
                            const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
                            const imageUrl = document.getElementById('image-url') as HTMLInputElement;
                            if (imagePreview && imageUrl) {
                              imagePreview.src = e.target.value;
                              imagePreview.style.display = e.target.value ? 'block' : 'none';
                              imageUrl.value = e.target.value;
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <img
                          id="image-preview"
                          src={editingTour?.image || ''}
                          alt="Предварительный просмотр"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          style={{ display: editingTour?.image ? 'block' : 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Галерея
                      </label>
                      <div className="space-y-3">
                        <MultiFileUpload
                          onFilesChange={(files) => setGalleryFiles(files)}
                          initialFiles={editingTour?.gallery || []}
                        />
                        <div className="text-sm text-gray-500">
                          Или введите URL изображений (каждый с новой строки):
                        </div>
                        <textarea
                          name="gallery_urls"
                          rows={5}
                          defaultValue={editingTour?.gallery?.join('\n') || ''}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Категория
                      </label>
                      <input
                        type="text"
                        name="category"
                        defaultValue={editingTour?.category || ''}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPopular"
                        name="isPopular"
                        defaultChecked={(editingTour as any)?.isPopular || false}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-700">
                        Отметить как "Популярно"
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Максимальный размер группы
                      </label>
                      <input
                        type="number"
                        name="maxGroupSize"
                        defaultValue={(editingTour as any)?.maxGroupSize || 20}
                        min="1"
                        max="50"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Особенности (каждая с новой строки)
                      </label>
                      <textarea
                        name="highlights"
                        defaultValue={editingTour?.highlights?.join('\n') || ''}
                        rows={5}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTourForm(false);
                        setEditingTour(null);
                        setGalleryFiles([]);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Form Modal */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Добавить время экскурсии
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Экскурсия
                    </label>
                    <select
                      value={newSchedule.tourId}
                      onChange={(e) => setNewSchedule({...newSchedule, tourId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Выберите экскурсию</option>
                      {tours.map((tour) => (
                        <option key={tour.id} value={tour.id}>
                          {tour.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата
                    </label>
                    <input
                      type="date"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Время
                    </label>
                    <input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Максимальное количество мест
                    </label>
                    <input
                      type="number"
                      value={newSchedule.maxSpots}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule, 
                        maxSpots: Number(e.target.value),
                        availableSpots: Number(e.target.value)
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promo Form Modal */}
        {(showPromoForm || editingPromo) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {editingPromo ? 'Редактировать промокод' : 'Добавить промокод'}
                </h3>
                
                <form onSubmit={handleSavePromo}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Код <span className="text-xs text-gray-500">(уникальный код промокода, который будет вводить пользователь)</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingPromo?.code || newPromo.code}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип скидки <span className="text-xs text-gray-500">(как будет рассчитываться скидка)</span>
                      </label>
                      <select
                        name="discountType"
                        defaultValue={editingPromo?.discountType || newPromo.discountType}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      >
                        <option value="percentage">Процентная скидка (указывается % от стоимости)</option>
                        <option value="fixed">Фиксированная скидка (указывается сумма в рублях)</option>
                        <option value="free">Бесплатно (100% скидка)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Значение скидки <span className="text-xs text-gray-500">(число: для % - 10-90, для фиксированной - сумма в рублях)</span>
                      </label>
                      <input
                        type="number"
                        name="discountValue"
                        defaultValue={editingPromo?.discountValue || newPromo.discountValue}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание <span className="text-xs text-gray-500">(краткое описание для администратора)</span>
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingPromo?.description || newPromo.description}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        defaultChecked={editingPromo?.isActive || newPromo.isActive}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Активен <span className="text-xs text-gray-500">(промокод можно использовать)</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Максимальное количество использований <span className="text-xs text-gray-500">(оставьте пустым для безлимитного использования)</span>
                      </label>
                      <input
                        type="number"
                        name="maxUses"
                        defaultValue={editingPromo?.maxUses || newPromo.maxUses}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Максимальное количество персон <span className="text-xs text-gray-500">(оставьте пустым для безлимитного количества)</span>
                      </label>
                      <input
                        type="number"
                        name="maxPeople"
                        defaultValue={editingPromo?.maxPeople || newPromo.maxPeople}
                        min="1"
                        max="50"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата начала действия <span className="text-xs text-gray-500">(с какой даты промокод становится активным)</span>
                      </label>
                      <input
                        type="date"
                        name="validFrom"
                        defaultValue={editingPromo?.validFrom || newPromo.validFrom}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата окончания действия <span className="text-xs text-gray-500">(оставьте пустым для бессрочного промокода)</span>
                      </label>
                      <input
                        type="date"
                        name="validUntil"
                        defaultValue={editingPromo?.validUntil || newPromo.validUntil}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Применить к тарифам <span className="text-xs text-gray-500">(оставьте пустым для применения ко всем тарифам)</span>
                      </label>
                      <select
                        multiple
                        name="applicableTariffs"
                        defaultValue={editingPromo?.applicableTariffs || newPromo.applicableTariffs || []}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[80px]"
                      >
                        <option value="standard">Стандартный тариф</option>
                        <option value="child">Детский тариф</option>
                        <option value="family">Семейный тариф</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Удерживайте Ctrl/Cmd для выбора нескольких тарифов</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Применить к экскурсиям <span className="text-xs text-gray-500">(оставьте пустым для применения ко всем экскурсиям)</span>
                      </label>
                      <select
                        multiple
                        name="applicableTours"
                        defaultValue={editingPromo?.applicableTours || newPromo.applicableTours}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[100px]"
                      >
                        {tours.map((tour) => (
                          <option key={tour.id} value={tour.id} className="text-sm">
                            {tour.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Удерживайте Ctrl/Cmd для выбора нескольких экскурсий</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-2 sm:space-y-0 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPromoForm(false);
                        setEditingPromo(null);
                        setNewPromo({
                          code: '',
                          discountType: 'percentage',
                          discountValue: 0,
                          description: '',
                          isActive: true,
                          maxUses: undefined,
                          validFrom: '',
                          validUntil: '',
                          applicableTours: [],
                          applicableTariffs: [],
                          maxPeople: undefined,
                          createdBy: 'admin',
                          createdAt: new Date().toISOString()
                        });
                      }}
                      className="px-4 py-2 sm:px-6 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm order-2 sm:order-1"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm order-1 sm:order-2"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Управление отзывами</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Всего отзывов: {reviews.length}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-yellow-600">Ожидают: {reviews.filter(r => r.status === 'pending').length}</span>
                    <span className="text-green-600">Одобрено: {reviews.filter(r => r.status === 'approved').length}</span>
                    <span className="text-red-600">Отклонено: {reviews.filter(r => r.status === 'rejected').length}</span>
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка отзывов...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Отзывов пока нет</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{review.name}</h3>
                            <p className="text-sm text-gray-600">{review.location}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(review.createdAt).toLocaleDateString('ru-RU')} в {new Date(review.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              review.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {review.status === 'pending' ? 'Ожидает' :
                               review.status === 'approved' ? 'Одобрен' : 'Отклонен'}
                            </span>
                            {review.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveReview(review.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Одобрить"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Укажите причину отклонения:');
                                    if (reason) {
                                      handleRejectReview(review.id, reason);
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Отклонить"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{review.text}</p>
                        </div>

                        {review.images && review.images.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Фотографии:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {review.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Фото отзыва ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(image, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {review.status === 'rejected' && review.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-red-800 mb-1">Причина отклонения:</h4>
                            <p className="text-sm text-red-700">{review.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">📊 Аналитика кликов</h2>
                  <button
                    onClick={() => window.open('/admin/analytics', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <span>📈</span>
                    <span>Открыть полную аналитику</span>
                  </button>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-4">📊</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Система аналитики активна</h3>
                      <p className="text-gray-600">Все клики по кнопкам на сайте отслеживаются в реальном времени</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">🎯</div>
                      <div className="text-sm font-medium text-gray-900">Автоматическое отслеживание</div>
                      <div className="text-xs text-gray-600 mt-1">Все кнопки отслеживаются автоматически</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">📈</div>
                      <div className="text-sm font-medium text-gray-900">Детальная статистика</div>
                      <div className="text-xs text-gray-600 mt-1">Графики и таблицы с данными</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">🔄</div>
                      <div className="text-sm font-medium text-gray-900">Реальное время</div>
                      <div className="text-xs text-gray-600 mt-1">Обновление данных в реальном времени</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Что отслеживается:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Все кнопки и ссылки на сайте</li>
                      <li>• Количество кликов по каждой кнопке</li>
                      <li>• Страница на которой находится кнопка</li>
                      <li>• Время последнего клика</li>
                      <li>• История кликов для анализа</li>
                    </ul>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => window.open('/admin/analytics', '_blank')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                    >
                      🚀 Перейти к полной аналитике
                    </button>
                  </div>
                </div>
              </div>
            )}

        {/* Spot Management Modal */}
        {spotManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Управление местами
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Количество мест
                    </label>
                    <input
                      type="number"
                      value={editingSchedule?.availableSpots || ''}
                      onChange={(e) => {
                        if (editingSchedule) {
                          setEditingSchedule({
                            ...editingSchedule,
                            availableSpots: Number(e.target.value)
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max={editingSchedule?.maxSpots || 50}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setSpotManagement(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      if (editingSchedule) {
                        handleUpdateSpots(editingSchedule.id, editingSchedule.availableSpots, editingSchedule.maxSpots);
                        setSpotManagement(false);
                        setEditingSchedule(null);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;