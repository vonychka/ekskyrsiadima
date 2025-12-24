import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  gallery: string[];
  mainImage: string;
  title: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ gallery = [], mainImage, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const allImages = [mainImage, ...(gallery || [])];

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextModalImage = () => {
    setModalImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const prevModalImage = () => {
    setModalImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  // Обработка клавиатурных событий
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isModalOpen) {
        switch (event.key) {
          case 'ArrowLeft':
            prevModalImage();
            break;
          case 'ArrowRight':
            nextModalImage();
            break;
          case 'Escape':
            closeModal();
            break;
          default:
            break;
        }
      } else {
        switch (event.key) {
          case 'ArrowLeft':
            prevImage();
            break;
          case 'ArrowRight':
            nextImage();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  if (allImages.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Нет изображений</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Главное изображение */}
      <div className="relative group">
        <img
          src={allImages[currentIndex]}
          alt={`${title} - изображение ${currentIndex + 1}`}
          className="w-full h-64 md:h-96 object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={() => openModal(currentIndex)}
        />
        
        {/* Кнопки навигации */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Кнопка увеличения */}
        <button
          onClick={(e) => { e.stopPropagation(); openModal(currentIndex); }}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Индикатор текущего изображения */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {allImages.length}
        </div>

        {/* Подсказка о клавиатурной навигации */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          ← → для навигации
        </div>
      </div>

      {/* Миниатюры */}
      {allImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <div
              key={index}
              className={`flex-shrink-0 relative cursor-pointer transition-all duration-300 ${
                index === currentIndex ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={image}
                alt={`${title} - миниатюра ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg"
              />
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно для полного просмотра */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Кнопка закрытия */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Изображение в модальном окне */}
            <img
              src={allImages[modalImageIndex]}
              alt={`${title} - полноразмерное изображение ${modalImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* Кнопки навигации в модальном окне */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevModalImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 p-3 rounded-full"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextModalImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 p-3 rounded-full"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Индикатор в модальном окне */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {modalImageIndex + 1} / {allImages.length}
            </div>

            {/* Подсказка о клавиатурной навигации */}
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-2 rounded text-sm">
              ← → для навигации | ESC для закрытия
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
