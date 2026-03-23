import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Full-page loading overlay with animated ball loader
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading..."
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl text-center min-w-[250px]">
        {/* Animated Ball Loader - Bouncing Dots */}
        <div className="flex justify-center items-end mb-6 h-16">
          <div className="flex gap-2 items-end">
            <div
              className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
              style={{
                animationDelay: '0s',
                animationDuration: '0.7s'
              }}
            />
            <div
              className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
              style={{
                animationDelay: '0.15s',
                animationDuration: '0.7s'
              }}
            />
            <div
              className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
              style={{
                animationDelay: '0.3s',
                animationDuration: '0.7s'
              }}
            />
          </div>
        </div>

        {/* Loading Message */}
        <p className="text-gray-800 font-semibold text-xl">{message}</p>
        <p className="text-gray-500 text-sm mt-2">Please wait...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;

