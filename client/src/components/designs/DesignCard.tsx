import React from 'react';
import { Link } from 'react-router-dom';
import { type IDesign } from '../../interfaces/design.interface';
import { HeartIcon } from '@heroicons/react/24/outline'; // Example icon
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'; // Example solid icon
import { useAuth } from '../../hooks/useAuth';
import { likeDesign, unlikeDesign } from '../../services/design.service';
import { designStore } from '../../store/designStore';

interface DesignCardProps {
    design: IDesign;
}

const DesignCard: React.FC<DesignCardProps> = ({ design }) => {
    const { isAuthenticated, user } = useAuth();
    const { updateDesign } = designStore();
    const isLiked = user && design.likesCount > 0; // Simplified check, ideally you'd track likedBy array

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to design detail page
        if (!isAuthenticated) {
            alert('Please log in to like designs!');
            return;
        }
        try {
            let updatedDesign: IDesign;
            if (isLiked) {
                // In a real app, you'd check if `user._id` is in `design.likedBy` array
                const response = await unlikeDesign(design._id);
                updatedDesign = { ...design, likesCount: response.likesCount };
            } else {
                const response = await likeDesign(design._id);
                updatedDesign = { ...design, likesCount: response.likesCount };
            }
            updateDesign(design._id, { likesCount: updatedDesign.likesCount });
            // In a real app, you might also update the 'likedBy' array in the local state
        } catch (error) {
            console.error('Failed to update like status:', error);
            alert('Failed to update like status.');
        }
    };

    return (
        <Link to={`/designs/${design._id}`} className="block">
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="relative h-48">
                    {design.images && design.images.length > 0 ? (
                        <img
                            src={design.images[0].url}
                            alt={design.images[0].altText || design.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                            No Image
                        </div>
                    )}
                    {design.isFeatured && (
                        <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            Featured
                        </span>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
                        {design.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {design.description || 'No description available.'}
                    </p>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">
                            {design.category}
                        </span>
                        <div className="flex items-center space-x-1">
                            <button onClick={handleLikeToggle} className="text-gray-500 hover:text-red-500 transition-colors">
                                {isLiked ? (
                                    <HeartIconSolid className="h-5 w-5 text-red-500" />
                                ) : (
                                    <HeartIcon className="h-5 w-5" />
                                )}
                            </button>
                            <span className="text-sm text-gray-600">{design.likesCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default DesignCard;