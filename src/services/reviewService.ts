import { ref, push, set, get, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { Review, ReviewSubmission } from '../types/review';
import { uploadImages } from './storageService';

export const reviewService = {
  // Отправка отзыва на модерацию
  async submitReview(reviewData: ReviewSubmission): Promise<string> {
    try {
      let imageUrls: string[] = [];
      
      // Пытаемся загрузить изображения только если они есть
      if (reviewData.images && reviewData.images.length > 0) {
        try {
          imageUrls = await uploadImages(reviewData.images, 'reviews');
        } catch (uploadError) {
          console.warn('Image upload failed, submitting review without images:', uploadError);
          // Продолжаем отправку отзыва без изображений
          imageUrls = [];
        }
      }
      
      // Создание объекта отзыва
      const review: Omit<Review, 'id'> = {
        name: reviewData.name,
        location: reviewData.location,
        tour: reviewData.tour,
        rating: reviewData.rating,
        text: reviewData.text,
        images: imageUrls,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Сохранение в Firebase
      const reviewsRef = ref(database, 'reviews');
      const newReviewRef = push(reviewsRef);
      await set(newReviewRef, review);

      return newReviewRef.key || '';
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // Получение всех отзывов (для админки)
  async getAllReviews(): Promise<Review[]> {
    try {
      const reviewsRef = ref(database, 'reviews');
      const snapshot = await get(reviewsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const reviews: Review[] = [];
      snapshot.forEach((childSnapshot) => {
        const review = {
          id: childSnapshot.key || '',
          ...childSnapshot.val()
        } as Review;
        reviews.push(review);
      });

      // Сортировка по дате создания (новые сначала)
      return reviews.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting reviews:', error);
      throw error;
    }
  },

  // Получение одобренных отзывов (для отображения на сайте)
  async getApprovedReviews(): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews.filter(review => review.status === 'approved');
    } catch (error) {
      console.error('Error getting approved reviews:', error);
      throw error;
    }
  },

  // Одобрение отзыва
  async approveReview(reviewId: string): Promise<void> {
    try {
      const reviewRef = ref(database, `reviews/${reviewId}`);
      await update(reviewRef, {
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error approving review:', error);
      throw error;
    }
  },

  // Отклонение отзыва
  async rejectReview(reviewId: string, reason: string): Promise<void> {
    try {
      const reviewRef = ref(database, `reviews/${reviewId}`);
      await update(reviewRef, {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      throw error;
    }
  },

  // Удаление отзыва
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const reviewRef = ref(database, `reviews/${reviewId}`);
      await remove(reviewRef);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
};
