import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Инициализация Firebase Storage
const firebaseConfig = {
  apiKey: "AIzaSyBE-bcqM7DM_zV8xivFKKbrSAHifIWYgps",
  authDomain: "exursional.firebaseapp.com",
  databaseURL: "https://exursional-default-rtdb.firebaseio.com",
  projectId: "exursional",
  storageBucket: "exursional.firebasestorage.app",
  messagingSenderId: "770008017138",
  appId: "1:770008017138:web:23909355289d478208c86b"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app };

export const uploadImages = async (files: File[], folder: string): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    try {
      // Создаем уникальное имя файла
      const timestamp = Date.now();
      const fileName = `${folder}/${timestamp}_${index}_${file.name}`;
      
      // Создаем ссылку на файл в Storage
      const storageRef = ref(storage, fileName);
      
      // Загружаем файл
      await uploadBytes(storageRef, file);
      
      // Получаем URL для скачивания
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', file.name, error);
      throw error;
    }
  });

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};
