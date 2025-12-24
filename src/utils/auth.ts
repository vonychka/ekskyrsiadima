// Простая хеш-функция для клиентской стороны (без использования внешних библиотек)
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

// Секретный ключ для хеширования
const SECRET_KEY = 'TourAdmin2024SecureKey';

export const hashPassword = (password: string): string => {
  return simpleHash(password + SECRET_KEY);
};

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const hashedInput = hashPassword(password);
  return hashedInput === hashedPassword;
};

// Хешированный пароль для админки (предварительно захешированный)
const correctHash = hashPassword('123Gofgof');
export const ADMIN_HASHED_PASSWORD = correctHash;

// Дополнительная проверка по времени (защита от брутфорса)
export const checkRateLimit = (): boolean => {
  const now = Date.now();
  const attempts = localStorage.getItem('admin_login_attempts');
  const lastAttempt = localStorage.getItem('admin_last_attempt');
  
  if (attempts && lastAttempt) {
    const attemptCount = parseInt(attempts);
    const lastAttemptTime = parseInt(lastAttempt);
    
    // Если было более 5 попыток за последние 5 минут
    if (attemptCount >= 5 && now - lastAttemptTime < 300000) {
      return false;
    }
    
    // Сброс счетчика если прошло больше 5 минут
    if (now - lastAttemptTime > 300000) {
      localStorage.removeItem('admin_login_attempts');
      localStorage.removeItem('admin_last_attempt');
    }
  }
  
  return true;
};

export const recordLoginAttempt = (success: boolean): void => {
  if (success) {
    localStorage.removeItem('admin_login_attempts');
    localStorage.removeItem('admin_last_attempt');
  } else {
    const attempts = localStorage.getItem('admin_login_attempts') || '0';
    const newAttempts = parseInt(attempts) + 1;
    localStorage.setItem('admin_login_attempts', newAttempts.toString());
    localStorage.setItem('admin_last_attempt', Date.now().toString());
  }
};

// Дополнительная проверка по user-agent (простая защита)
export const checkUserAgent = (): boolean => {
  const userAgent = navigator.userAgent;
  const storedUserAgent = localStorage.getItem('admin_user_agent');
  
  if (!storedUserAgent) {
    localStorage.setItem('admin_user_agent', userAgent);
    return true;
  }
  
  return userAgent === storedUserAgent;
};

// Комплексная проверка безопасности
export const performSecurityChecks = (): boolean => {
  return checkRateLimit() && checkUserAgent();
};
