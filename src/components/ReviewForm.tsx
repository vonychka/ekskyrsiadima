import React, { useState } from 'react';
import { ReviewSubmission } from '../types/review';
import { reviewService } from '../services/reviewService';
import { useToursContext } from '../context/ToursContext';

interface ReviewFormProps {
  onSubmitSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmitSuccess }) => {
  const { tours, loading: toursLoading } = useToursContext();
  const [formData, setFormData] = useState<ReviewSubmission>({
    name: '',
    location: '',
    tour: '',
    rating: 5,
    text: '',
    images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imageUploadWarning, setImageUploadWarning] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageArray = Array.from(files);
      if (imageArray.length > 5) {
        setImageUploadWarning('Можно загрузить не более 5 фотографий');
        return;
      }
      setFormData(prev => ({ ...prev, images: imageArray }));
      setImageUploadWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Валидация
      if (!formData.name.trim() || !formData.location.trim() || 
          !formData.tour.trim() || !formData.text.trim()) {
        throw new Error('Пожалуйста, заполните все обязательные поля');
      }

      if (formData.images.length > 5) {
        throw new Error('Можно загрузить не более 5 фотографий');
      }

      // Отправка отзыва
      await reviewService.submitReview(formData);
      
      // Если были предупреждения о загрузке изображений, покажем их
      if (imageUploadWarning) {
        setSubmitError(imageUploadWarning);
      } else {
        setSubmitSuccess(true);
      }
      setFormData({
        name: '',
        location: '',
        tour: '',
        rating: 5,
        text: '',
        images: []
      });

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Произошла ошибка при отправке отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Спасибо за ваш отзыв!</h3>
        <p className="text-green-700 mb-4">
          Ваш отзыв отправлен на модерацию. После проверки он появится на сайте.
        </p>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Оставить еще один отзыв
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-6">Оставить отзыв</h3>
      
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{submitError}</p>
        </div>
      )}

      {imageUploadWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700">{imageUploadWarning}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваше имя *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваш город *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Москва"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Какая экскурсия? *
          </label>
          {toursLoading ? (
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <p className="text-gray-500">Загрузка экскурсий...</p>
            </div>
          ) : (
            <select
              name="tour"
              value={formData.tour}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите экскурсию</option>
              {tours.map((tour) => (
                <option key={tour.id} value={tour.title}>
                  {tour.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Оценка *
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                className={`text-2xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating} из 5
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ваш отзыв *
          </label>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Расскажите о ваших впечатлениях..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фотографии (необязательно)
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-blue-700">
              ⚠️ Внимание: Из-за технических проблем загрузка изображений может не работать. 
              Вы можете отправить отзыв без фото, и он все равно будет принят.
            </p>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-gray-400 text-4xl mb-2">📷</div>
              <p className="text-gray-600 mb-2">
                Нажмите для загрузки фотографий
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG, GIF (макс. 5 файлов, необязательно)
              </p>
            </label>
          </div>

          {formData.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from(formData.images).map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = Array.from(formData.images);
                      newImages.splice(index, 1);
                      setFormData(prev => ({ ...prev, images: newImages }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить отзыв на модерацию'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
