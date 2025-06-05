import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { designStore } from '../../store/designStore';
import { getAllDesigns } from '../../services/design.service';
import DesignCard from '../designs/DesignCard';
import LoadingSpinner from '../common/LoadingSpinner';

const FeaturedDesigns: React.FC = () => {
    const { featuredDesigns, loading, error, setFeaturedDesigns, setError, setLoading } = designStore();

    useEffect(() => {
        const fetchFeaturedDesigns = async () => {
            if (featuredDesigns?.length === 0 && !loading) {
                setLoading(true);
                try {
                    const designs = await getAllDesigns();
                    setFeaturedDesigns(designs);
                } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to load featured designs.');
                    console.error('Error fetching featured designs:', err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchFeaturedDesigns();
    }, [featuredDesigns, loading, setLoading, setFeaturedDesigns, setError]);

    return (
        <section className="container mx-auto px-4 py-12">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-10">Featured Designs</h2>

            {loading && <LoadingSpinner />}
            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {!loading && featuredDesigns?.length > 0 ? (
                    featuredDesigns.map((design) => (
                        <DesignCard key={design._id} design={design} />
                    ))
                ) : !loading && (
                    <p className="text-center text-gray-600 col-span-full">No featured designs found.</p>
                )}
            </div>

            <div className="text-center mt-10">
                <Link to="/designs">
                    <button className="bg-indigo-600 text-white py-3 px-8 rounded-md hover:bg-indigo-700 transition-colors text-lg">
                        View All Designs
                    </button>
                </Link>
            </div>
        </section>
    );
};

export default FeaturedDesigns;