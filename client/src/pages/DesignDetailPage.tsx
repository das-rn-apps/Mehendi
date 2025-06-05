import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDesignById } from '../services/design.service';
import { designStore } from '../store/designStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { Carousel } from 'react-responsive-carousel'; // You'll need to install this: npm install react-responsive-carousel
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // and its styles
import { type IUser } from '../interfaces/user.interface';
import { getInitials } from '../utils/helpers';

const DesignDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { selectedDesign, loading, error, setSelectedDesign, setLoading, setError } = designStore();

    useEffect(() => {
        const fetchDesign = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const fetchedDesign = await getDesignById(id);
                setSelectedDesign(fetchedDesign);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to fetch design details.');
                console.error('Error fetching design:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDesign();
    }, [id, setSelectedDesign, setLoading, setError]);

    if (loading) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center"><LoadingSpinner size="large" /></div>;
    }

    if (error) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-red-500 text-lg">{error}</div>;
    }

    if (!selectedDesign) {
        return <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-gray-600 text-lg">Design not found.</div>;
    }

    const artist = selectedDesign.artist as IUser; // Type assertion since it can be populated

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        {selectedDesign.images && selectedDesign.images.length > 0 ? (
                            <Carousel
                                showArrows={true}
                                showThumbs={true}
                                infiniteLoop={true}
                                className="rounded-lg overflow-hidden"
                            >
                                {selectedDesign.images.map((image) => (
                                    <div key={image.public_id} className="h-96">
                                        <img
                                            src={image.url}
                                            alt={image.altText || selectedDesign.title}
                                            className="w-full h-full object-contain" // Use object-contain for better fit for varying image ratios
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <div className="h-96 bg-gray-200 flex items-center justify-center text-gray-500 text-xl rounded-lg">
                                No Images Available
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">
                            {selectedDesign.title}
                        </h1>
                        <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                            {selectedDesign.description || 'No description available for this design.'}
                        </p>

                        <div className="mb-4">
                            <span className="font-semibold text-gray-700">Category:</span>{' '}
                            <span className="text-indigo-600 font-medium">{selectedDesign.category || 'N/A'}</span>
                        </div>

                        {selectedDesign.tags && selectedDesign.tags.length > 0 && (
                            <div className="mb-4">
                                <span className="font-semibold text-gray-700">Tags:</span>{' '}
                                {selectedDesign.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mb-6">
                            <span className="font-semibold text-gray-700">Likes:</span>{' '}
                            <span className="text-gray-800">{selectedDesign.likesCount}</span>
                        </div>

                        {artist && (
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">Artist Details</h3>
                                <Link to={`/artists/${artist._id}`} className="flex items-center space-x-4 hover:bg-gray-50 p-3 rounded-md transition-colors">
                                    {artist.avatar?.url ? (
                                        <img src={artist.avatar.url} alt="Artist Avatar" className="w-16 h-16 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                                            {getInitials(artist.firstName, artist.lastName)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-lg font-semibold text-indigo-600">{artist.firstName} {artist.lastName}</p>
                                        <p className="text-gray-600 text-sm">View Artist Profile</p>
                                    </div>
                                </Link>
                            </div>
                        )}

                        <Link to={`/book-appointment/${artist?._id || ''}`} className="mt-8">
                            <Button variant="primary" size="large">Book This Design / Artist</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignDetailPage;