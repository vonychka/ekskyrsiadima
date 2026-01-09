import firebase from 'firebase/app';
import 'firebase/database';

// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyD4VQ5-2Q8V9F3W7R6T5Y4U3I2O1P0Q9R8",
  authDomain: "ekskyrsiadima.firebaseapp.com",
  databaseURL: "https://ekskyrsiadima-default-rtdb.firebaseio.com",
  projectId: "ekskyrsiadima",
  storageBucket: "ekskyrsiadima.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345"
};

// Инициализируем Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const database = firebase.database();

interface ClickData {
  buttonId: string;
  buttonText: string;
  page: string;
  timestamp: number;
  date: string;
}

export class Analytics {
  private static instance: Analytics;
  private initialized = false;

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    
    // Добавляем глобальные обработчики кликов
    document.addEventListener('click', this.handleClick.bind(this));
    this.initialized = true;
  }

  private async handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Ищем ближайший элемент с атрибутом data-analytics или кнопку/ссылку
    const clickableElement = this.findClickableElement(target);
    
    if (clickableElement) {
      await this.trackClick(clickableElement);
    }
  }

  private findClickableElement(element: HTMLElement): HTMLElement | null {
    // Проверяем сам элемент
    if (this.isTrackableElement(element)) {
      return element;
    }

    // Ищем родительские элементы
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (this.isTrackableElement(parent)) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  private isTrackableElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const hasAnalyticsAttr = element.hasAttribute('data-analytics');
    const hasRole = element.getAttribute('role') === 'button';
    const hasButtonType = element.getAttribute('type') === 'button' || element.getAttribute('type') === 'submit';
    const isButton = tagName === 'button';
    const isLink = tagName === 'a' && !!element.getAttribute('href');
    
    return hasAnalyticsAttr || hasRole || hasButtonType || isButton || isLink;
  }

  private async trackClick(element: HTMLElement) {
    try {
      const buttonId = this.getButtonId(element);
      const buttonText = this.getButtonText(element);
      const page = this.getCurrentPage();
      const timestamp = Date.now();
      const date = new Date().toISOString().split('T')[0];

      // Получаем текущие данные для этой кнопки
      const buttonRef = database.ref(`analytics/${buttonId}`);
      const snapshot = await buttonRef.once('value');
      const currentData = snapshot.val() || {
        buttonText,
        page,
        clicks: 0,
        lastClick: 0
      };

      // Обновляем данные
      const updatedData = {
        buttonText,
        page,
        clicks: currentData.clicks + 1,
        lastClick: timestamp
      };

      await buttonRef.set(updatedData);

      // Добавляем запись в историю
      const historyRef = database.ref(`analytics_history/${buttonId}/${timestamp}`);
      await historyRef.set({
        buttonText,
        page,
        timestamp,
        date
      });

      console.log(`Analytics: Клик отслежен - ${buttonText} (${buttonId})`);
    } catch (error) {
      console.error('Analytics: Ошибка при отслеживании клика:', error);
    }
  }

  private getButtonId(element: HTMLElement): string {
    // Проверяем явный ID
    if (element.id) {
      return `id_${element.id}`;
    }

    // Проверяем data-analytics-id
    const analyticsId = element.getAttribute('data-analytics-id');
    if (analyticsId) {
      return analyticsId;
    }

    // Генерируем ID на основе текста и позиции
    const text = this.getButtonText(element);
    const className = element.className || '';
    const tagName = element.tagName.toLowerCase();
    
    // Создаем уникальный ID
    const hash = this.simpleHash(`${text}_${className}_${tagName}`);
    return `auto_${hash}`;
  }

  private getButtonText(element: HTMLElement): string {
    // Проверяем data-analytics-text
    const analyticsText = element.getAttribute('data-analytics-text');
    if (analyticsText) {
      return analyticsText;
    }

    // Получаем текст из разных источников
    const textContent = element.textContent?.trim();
    if (textContent) {
      return textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
    }

    // Проверяем title, alt, placeholder
    const title = element.getAttribute('title');
    if (title) return title;

    const alt = element.getAttribute('alt');
    if (alt) return alt;

    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    // Проверяем иконки
    const iconElement = element.querySelector('[class*="icon"], [class*="Icon"]');
    if (iconElement) {
      const iconClass = iconElement.className;
      if (iconClass.includes('cart')) return 'Корзина';
      if (iconClass.includes('menu')) return 'Меню';
      if (iconClass.includes('search')) return 'Поиск';
      if (iconClass.includes('close')) return 'Закрыть';
      if (iconClass.includes('arrow')) return 'Стрелка';
      if (iconClass.includes('heart')) return 'Избранное';
      if (iconClass.includes('user')) return 'Пользователь';
    }

    // Возвращаем тег элемента как запасной вариант
    const tagName = element.tagName.toLowerCase();
    return tagName.charAt(0).toUpperCase() + tagName.slice(1);
  }

  private getCurrentPage(): string {
    const path = window.location.pathname;
    const pageNames: { [key: string]: string } = {
      '/': 'Главная',
      '/tour/': 'Детали тура',
      '/booking': 'Бронирование',
      '/payment': 'Оплата',
      '/payment/success': 'Успешная оплата',
      '/payment/failure': 'Ошибка оплаты',
      '/ticket': 'Билет',
      '/admin': 'Админка',
      '/admin/analytics': 'Аналитика'
    };

    // Проверяем точные совпадения
    if (pageNames[path]) {
      return pageNames[path];
    }

    // Проверяем совпадения по паттернам
    for (const [pattern, name] of Object.entries(pageNames)) {
      if (path.includes(pattern) && pattern !== '/') {
        return name;
      }
    }

    return path || 'Unknown';
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Метод для ручного отслеживания кликов
  public trackManualClick(buttonId: string, buttonText: string, page?: string) {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const currentPage = page || this.getCurrentPage();

    const buttonRef = database.ref(`analytics/${buttonId}`);
    const updatedData = {
      buttonText,
      page: currentPage,
      clicks: 1,
      lastClick: timestamp
    };

    buttonRef.set(updatedData);
  }
}

// Экспортируем функцию для удобного использования
export const trackClick = (buttonId: string, buttonText: string, page?: string) => {
  Analytics.getInstance().trackManualClick(buttonId, buttonText, page);
};

// Автоматически инициализируем аналитику при импорте
export default Analytics;
