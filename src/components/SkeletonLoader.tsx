import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index}
          className={`bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse ${className}`}
        >
          {/* Skeleton for image */}
          <div className="w-full h-64 bg-gray-300"></div>
          
          {/* Skeleton for content */}
          <div className="p-6">
            {/* Category badge */}
            <div className="h-6 w-20 bg-gray-300 rounded-full mb-3"></div>
            
            {/* Title */}
            <div className="h-6 bg-gray-300 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            
            {/* Description */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
            
            {/* Meta info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-gray-300 rounded"></div>
                <div className="h-4 w-12 bg-gray-300 rounded"></div>
              </div>
              <div className="h-4 w-12 bg-gray-300 rounded"></div>
            </div>
            
            {/* Price and button */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-6 w-24 bg-gray-300 rounded"></div>
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
              </div>
              <div className="h-10 w-32 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;
