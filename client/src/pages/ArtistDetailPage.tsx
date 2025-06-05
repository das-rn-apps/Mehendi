import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserById } from '../services/user.service';
import { userStore } from '../store/userStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { getInitials } from '../utils/helpers';
import DesignCard from '../components/designs/DesignCard';
import { getAllDesigns } from '../services/design.service';
import { type IDesign } from '../interfaces/design.interface'; // Import IDesign

const ArtistDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { selectedUser: artist, loading, error, setSelectedUser, setLoading, setError } = userStore();
    const [artistDesigns, setArtistDesigns] = React.useState<IDesign[]>([]); // State to hold artist's designs
    const [designsLoading, setDesignsLoading] = React.useState(false);
    const [designsError, setDesignsError] = React.useState<string | null>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const fetchedArtist = await getUserById(id);
                setSelectedUser(fetchedArtist);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch artist details.');
                console.error('Error fetching artist:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchArtistDesigns = async () => {
            if (!id) return;
            setDesignsLoading(true);
            setDesignsError(null);
            try {
                // Assuming your backend supports filtering designs by artist ID
                const designs = await getAllDesigns({ artist: id });
                setArtistDesigns(designs);
            } catch (err: any) {
                setDesignsError(err.response?.data?.message || 'Failed to fetch artist designs.');
                console.error('Error fetching artist designs:', err);
            } finally {
                setDesignsLoading(false);
            }
        };

        fetchArtist();
        fetchArtistDesigns();
    }, [id, setSelectedUser, setLoading, setError]);

    if (loading) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center"><LoadingSpinner size="large" /></div>;
    }

    if (error) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-red-500 text-lg">{error}</div>;
    }

    if (!artist) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-gray-600 text-lg">Artist not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                    <div className="flex-shrink-0">
                        {artist.avatar?.url ? (
                            <img
                                src={artist.avatar.url}
                                alt={`${artist.firstName} ${artist.lastName}`}
                                className="w-48 h-48 rounded-full object-cover shadow-lg border-4 border-indigo-200"
                            />
                        ) : (
                            <div className="w-48 h-48 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-6xl font-bold shadow-lg border-4 border-indigo-200">
                                {getInitials(artist.firstName, artist.lastName)}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            {artist.firstName} {artist.lastName}
                        </h1>
                        <p className="text-indigo-600 text-lg mb-3">Mehendi Artist</p>
                        {artist.specializations && artist.specializations.length > 0 && (
                            <p className="text-gray-700 mb-2">
                                <span className="font-semibold">Specializes in:</span> {artist.specializations.join(', ')}
                            </p>
                        )}
                        {artist.yearsOfExperience && (
                            <p className="text-gray-700 mb-2">
                                <span className="font-semibold">Experience:</span> {artist.yearsOfExperience} years
                            </p>
                        )}
                        {artist.location?.address && (
                            <p className="text-gray-700 mb-4">
                                <span className="font-semibold">Location:</span> {artist.location.address}
                            </p>
                        )}
                        <p className="text-gray-800 leading-relaxed mb-6">
                            {artist.bio || 'This artist has not provided a biography yet.'}
                        </p>
                        <Link to={`/book-appointment/${artist._id}`}>
                            <Button variant="primary" size="large">Book Appointment</Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Artist's Designs</h2>
                {designsLoading && <LoadingSpinner />}
                {designsError && <p className="text-red-500 text-center">{designsError}</p>}
                {!designsLoading && artistDesigns.length === 0 && !designsError && (
                    <p className="text-center text-gray-600 text-lg">This artist has no designs uploaded yet.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {!designsLoading && artistDesigns.map((design) => (
                        <DesignCard key={design._id} design={design} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArtistDetailPage;