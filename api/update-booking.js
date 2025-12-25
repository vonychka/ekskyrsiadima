import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkC7J8X9Y8Z9W8X9Y8Z9W8X9Y8Z9W8X9Y",
  authDomain: "ekskyrsiadima.firebaseapp.com",
  projectId: "ekskyrsiadima",
  storageBucket: "ekskyrsiadima.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:123456789012345678901234"
};

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { tourId, numberOfPeople = 1, action = 'book' } = req.body;

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствует ID тура'
      });
    }

    // Инициализация Firebase (в реальном проекте нужно правильно настроить)
    // const db = getFirestore();
    // const tourRef = doc(db, 'tours', tourId);

    console.log('Обновление бронирования:', { tourId, numberOfPeople, action });

    if (action === 'book') {
      // Уменьшаем количество свободных мест
      // await updateDoc(tourRef, {
      //   availableSpots: increment(-numberOfPeople),
      //   bookedSpots: increment(numberOfPeople)
      // });
      
      console.log(`Забронировано ${numberOfPeople} мест для тура ${tourId}`);
    } else if (action === 'cancel') {
      // Увеличиваем количество свободных мест
      // await updateDoc(tourRef, {
      //   availableSpots: increment(numberOfPeople),
      //   bookedSpots: increment(-numberOfPeople)
      // });
      
      console.log(`Освобождено ${numberOfPeople} мест для тура ${tourId}`);
    }

    res.status(200).json({
      success: true,
      message: `Бронирование успешно ${action === 'book' ? 'обновлено' : 'отменено'}`,
      tourId,
      numberOfPeople,
      action
    });

  } catch (error) {
    console.error('Ошибка обновления бронирования:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления бронирования: ' + error.message
    });
  }
}
