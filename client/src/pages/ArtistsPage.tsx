import React, { useEffect, useState } from 'react';
import ArtistCard from '../components/artists/ArtistCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getAllArtists } from '../services/user.service';
import { userStore } from '../store/userStore';

const ArtistsPage: React.FC = () => {
    const { artists, loading, error, setArtists, setLoading, setError } = userStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSpecialization, setFilterSpecialization] = useState('');

    useEffect(() => {
        const fetchArtists = async () => {
            if (artists?.length === 0 && !loading) {
                setLoading(true);
                try {
                    const fetchedArtists = await getAllArtists();
                    setArtists(fetchedArtists);
                } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to fetch artists.');
                    console.error('Error fetching artists:', err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchArtists();
    }, [setArtists, setLoading, setError]);

    const filteredArtists = artists.filter(artist => {
        const matchesSearch = searchTerm ?
            `${artist.firstName} ${artist.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            artist.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) : true;

        const matchesSpecialization = filterSpecialization ?
            artist.specializations?.some(spec => spec.toLowerCase().includes(filterSpecialization.toLowerCase())) : true;

        return matchesSearch && matchesSpecialization;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">Our Talented Mehendi Artists</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                    type="text"
                    placeholder="Search by name or location..."
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={filterSpecialization}
                    onChange={(e) => setFilterSpecialization(e.target.value)}
                >
                    <option value="">All Specializations</option>
                    <option value="Bridal">Bridal</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Indo-Western">Indo-Western</option>
                    {/* Add more specializations dynamically from data if available */}
                </select>
            </div>

            {loading && <LoadingSpinner size="large" />}
            {error && <p className="text-red-500 text-center text-lg">{error}</p>}

            {!loading && filteredArtists.length === 0 && !error && (
                <p className="text-center text-gray-600 text-lg">No artists found matching your criteria.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {!loading && filteredArtists.map((artist) => (
                    <ArtistCard key={artist._id} artist={artist} />
                ))}
            </div>
        </div>
    );
};

export default ArtistsPage;