export interface Review {
  id: string;
  name: string;
  location: string;
  tour: string;
  rating: number;
  text: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface ReviewSubmission {
  name: string;
  location: string;
  tour: string;
  rating: number;
  text: string;
  images: File[];
}
