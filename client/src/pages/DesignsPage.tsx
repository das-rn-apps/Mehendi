import React, { useEffect, useState } from 'react';
import DesignCard from '../components/designs/DesignCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getAllDesigns } from '../services/design.service';
import { designStore } from '../store/designStore';

const DesignsPage: React.FC = () => {
    const { designs, loading, error, setDesigns, setLoading, setError } = designStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterArtist] = useState('');

    useEffect(() => {
        const fetchAllDesigns = async () => {
            if (designs?.length === 0 && !loading) {
                setLoading(true);
                try {
                    const designs = await getAllDesigns();
                    setDesigns(designs);
                } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to load designs.');
                    console.error('Error fetching designs:', err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchAllDesigns();
    }, [setDesigns, setLoading, setError]);

    const filteredDesigns = designs?.filter(design => {
        const matchesSearch = searchTerm ?
            design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            design.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            design.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) : true;

        const matchesCategory = filterCategory ?
            design.category?.toLowerCase() === filterCategory.toLowerCase() : true;

        // This part assumes 'artist' in IDesign can be populated to IUser
        // If it's just an ID, you'd need to pre-fetch artists or adjust this logic
        const matchesArtist = filterArtist ?
            (typeof design.artist !== 'string' &&
                `${design.artist.firstName} ${design.artist.lastName}`.toLowerCase().includes(filterArtist.toLowerCase())) : true;

        return matchesSearch && matchesCategory && matchesArtist;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                    type="text"
                    placeholder="Search designs by title, description, or tags..."
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    <option value="Bridal">Bridal</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Indo-Western">Indo-Western</option>
                    <option value="Contemporary">Contemporary</option>
                    {/* Add more categories dynamically */}
                </select>
                {/* You could add an artist filter dropdown here as well */}
            </div>

            {loading && <LoadingSpinner size="large" />}
            {error && <p className="text-red-500 text-center text-lg">{error}</p>}

            {!loading && filteredDesigns?.length === 0 && !error && (
                <p className="text-center text-gray-600 text-lg">No designs found matching your criteria.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {!loading && filteredDesigns?.map((design) => (
                    <DesignCard key={design._id} design={design} />
                ))}
            </div>
        </div>
    );
};

export default DesignsPage;