// Унифицированный модуль для работы с Тинькофф API
import crypto from 'crypto';

// Конфигурация (в продакшене используйте переменные окружения)
export const TINKOFF_CONFIG = {
  TERMINAL_KEY: process.env.TINKOFF_TERMINAL_KEY || '1766479140271DEMO',
  PASSWORD: process.env.TINKOFF_PASSWORD || '!BuR2jlFEFF25Hh5',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

// Интерфейсы для типов данных
export interface TinkoffPaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  email?: string;
  phone?: string;
  customerKey?: string;
  successUrl?: string;
  failUrl?: string;
  notificationUrl?: string;
}

export interface ReceiptItem {
  Name: string;
  Price: number;
  Quantity: number;
  Amount: number;
  Tax: string;
  PaymentMethod: string;
  PaymentObject: string;
}

export interface Receipt {
  Email?: string;
  Phone?: string;
  Taxation: string;
  Items: ReceiptItem[];
}

export interface TinkoffInitRequest {
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  Description: string;
  DATA?: string;
  SuccessURL?: string;
  FailURL?: string;
  NotificationURL?: string;
  PayType?: string;
  CustomerKey?: string;
  Email?: string;
  Phone?: string;
  Receipt?: Receipt;
  Token: string;
}

export interface TinkoffResponse {
  Success: boolean;
  ErrorCode?: string;
  Message?: string;
  Details?: string;
  PaymentId?: string;
  PaymentURL?: string;
  OrderId?: string;
  Status?: string;
}

/**
 * Генерация токена для Тинькофф API
 * ВАЖНО: Receipt и Token не участвуют в формировании токена!
 */
export function generateTinkoffToken(params: Record<string, any>): string {
  // 1. Удаляем Token и Receipt из параметров
  const { Token, Receipt, ...paramsToSign } = params;
  
  // 2. Конвертируем все значения в строки и сортируем по ключам
  const sortedParams = Object.entries(paramsToSign)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => [key, String(value ?? '')]);

  // 3. Создаем строку для подписи (только значения, объединенные вместе)
  const stringToSign = sortedParams
    .map(([_, value]) => value)
    .join('') + TINKOFF_CONFIG.PASSWORD;

  console.log('String to sign:', stringToSign);

  // 4. Генерируем SHA-256 хеш
  return crypto
    .createHash('sha256')
    .update(stringToSign)
    .digest('hex');
}

/**
 * Инициализация платежа
 */
export async function initPayment(request: TinkoffPaymentRequest): Promise<TinkoffResponse> {
  try {
    // Подготовка данных для чека (если требуется)
    const receipt: Receipt | undefined = request.email ? {
      Email: request.email,
      Phone: request.phone?.replace(/\D/g, ''),
      Taxation: 'osn',
      Items: [{
        Name: request.description.substring(0, 100),
        Price: Math.round(request.amount * 100),
        Quantity: 1,
        Amount: Math.round(request.amount * 100),
        Tax: 'none',
        PaymentMethod: 'full_prepayment',
        PaymentObject: 'service'
      }]
    } : undefined;

    // Подготовка базовых данных для запроса
    const paymentData = {
      TerminalKey: TINKOFF_CONFIG.TERMINAL_KEY,
      Amount: Math.round(request.amount * 100),
      OrderId: request.orderId,
      Description: request.description.substring(0, 250),
      DATA: JSON.stringify({ 
        Email: request.email, 
        Phone: request.phone 
      }),
      SuccessURL: request.successUrl,
      FailURL: request.failUrl,
      NotificationURL: request.notificationUrl,
      PayType: 'O',
      CustomerKey: request.customerKey || request.orderId,
      ...(request.email && { Email: request.email }),
      ...(request.phone && { Phone: request.phone.replace(/\D/g, '') })
    };

    // Генерируем токен (без Receipt!)
    const token = generateTinkoffToken(paymentData);
    
    // Добавляем токен и Receipt (если есть) к данным
    const requestData: TinkoffInitRequest = {
      ...paymentData,
      Token: token,
      ...(receipt && { Receipt: receipt })
    };

    console.log('Sending to Tinkoff:', JSON.stringify(requestData, null, 2));

    // Отправляем запрос в Тинькофф
    const response = await fetch(`${TINKOFF_CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    console.log('Tinkoff response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(`Tinkoff API error: ${result.Message || response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Tinkoff payment error:', error);
    throw error;
  }
}

/**
 * Проверка токена для вебхуков
 */
export function verifyToken(params: Record<string, any>): boolean {
  const receivedToken = params.Token;
  if (!receivedToken) return false;

  const calculatedToken = generateTinkoffToken(params);
  return receivedToken === calculatedToken;
}

/**
 * Получение статуса платежа
 */
export async function getPaymentStatus(paymentId: string): Promise<TinkoffResponse> {
  const requestData = {
    TerminalKey: TINKOFF_CONFIG.TERMINAL_KEY,
    PaymentId: paymentId,
    Token: ''
  };

  requestData.Token = generateTinkoffToken(requestData);

  const response = await fetch(`${TINKOFF_CONFIG.API_URL}/GetState`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  });

  return await response.json();
}
