import React, { useState } from 'react';
import { FaStar, FaRegStar, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../../components/utils/auth';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceId: string;
  housekeeperId: string;
  onRatingSubmitted?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceId,
  housekeeperId,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const response = await axios.post(
        `${API_URL}/ratings`,
        {
          bookingId,
          serviceId,
          housekeeperId,
          rating,
          review
        },
        { headers: getAuthHeader() }
      );
      
      if (response.status === 201) {
        toast.success('Review submitted successfully!');
        setRating(0);
        setReview('');
        
        if (onRatingSubmitted) {
          onRatingSubmitted();
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit your review. Please try again later.');
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full relative animate-fadeIn">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={submitting}
        >
          <FaTimes size={20} />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Rate Your Experience</h2>
          <p className="text-gray-600 mb-6">
            Your honest feedback helps us improve and helps other homeowners find quality services.
          </p>
          
          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                How would you rate your experience?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="text-3xl focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {rating >= star || hoverRating >= star ? (
                      <FaStar className="text-yellow-400" />
                    ) : (
                      <FaRegStar className="text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2 h-5">
                {rating > 0 && (
                  <p className="text-sm text-gray-600">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Review Text */}
            <div className="mb-6">
              <label htmlFor="review" className="block text-gray-700 font-medium mb-2">
                Your Review (Optional)
              </label>
              <textarea
                id="review"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent resize-none"
                rows={4}
                placeholder="Share your experience with this service..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                disabled={submitting}
              ></textarea>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg mr-3 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#137D13] text-white rounded-lg hover:bg-[#0c5c0c] disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
