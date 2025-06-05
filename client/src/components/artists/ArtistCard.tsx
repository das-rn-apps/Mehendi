import React from 'react';
import { Link } from 'react-router-dom';
import { type IUser } from '../../interfaces/user.interface';
import { getInitials } from '../../utils/helpers';
import Button from '../common/Button';

interface ArtistCardProps {
    artist: IUser;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                {artist.avatar?.url ? (
                    <img
                        src={artist.avatar.url}
                        alt={`${artist.firstName} ${artist.lastName}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl font-bold">
                        {getInitials(artist.firstName, artist.lastName)}
                    </div>
                )}
                {artist.isProfileComplete && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        Verified
                    </span>
                )}
            </div>
            <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {artist.firstName} {artist.lastName}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                    {artist.specializations?.length ? artist.specializations.join(', ') : 'General Mehendi Artist'}
                </p>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {artist.bio || 'No bio available.'}
                </p>
                <div className="flex justify-between items-center mt-4">
                    <Link to={`/artists/${artist._id}`}>
                        <Button variant="outline" size="small">View Profile</Button>
                    </Link>
                    <Link to={`/book-appointment/${artist._id}`}>
                        <Button variant="primary" size="small">Book Now</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ArtistCard;