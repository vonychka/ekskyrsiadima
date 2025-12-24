import React from 'react';
import { X } from 'lucide-react';
import ReviewForm from './ReviewForm';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок модального окна */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Оставить отзыв</h2>
            <p className="text-gray-600 mt-1">Поделитесь своими впечатлениями о нашей экскурсии</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Содержимое модального окна */}
        <div className="p-6">
          <ReviewForm />
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
