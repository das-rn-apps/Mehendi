import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { createAppointment } from '../services/appointment.service';
import { getArtistById } from '../services/user.service';
import { type IUser } from '../interfaces/user.interface';
import { useAuth } from '../hooks/useAuth';
import type { AppointmentStatus } from '../interfaces/appointment.interface';
import { userStore } from '../store/userStore';

const BookAppointmentPage: React.FC = () => {
    const { artistId } = useParams<{ artistId: string }>();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuth(); // Get current authenticated user

    const [artist, setArtist] = useState<IUser | null>(null);
    const [loadingArtist, setLoadingArtist] = useState(false);
    const [artistError, setArtistError] = useState<string | null>(null);

    const [appointmentDate, setAppointmentDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { artists } = userStore()

    useEffect(() => {
        if (!artistId) return;
        const fetchArtist = async () => {
            setLoadingArtist(true);
            setArtistError(null);
            try {
                const localArtist = artists.find(d => d._id === artistId);
                if (localArtist) {
                    setArtist(localArtist);
                    return;
                }
                const fetchedArtist = await getArtistById(artistId);
                setArtist(fetchedArtist);
            } catch (err: any) {
                setArtistError(err.response?.data?.message || 'Failed to load artist details.');
                console.error('Error fetching artist for booking:', err);
            } finally {
                setLoadingArtist(false);
            }
        };

        fetchArtist();
    }, [artistId, artists]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        if (!isAuthenticated || !currentUser) {
            setError('You must be logged in to book an appointment.');
            setIsLoading(false);
            return;
        }

        if (!artistId) {
            setError('No artist selected for booking.');
            setIsLoading(false);
            return;
        }

        // Basic validation
        if (!appointmentDate || !startTime || !serviceType || !address || !city) {
            setError('Please fill in all required fields.');
            setIsLoading(false);
            return;
        }

        try {
            const newAppointment = {
                user: currentUser._id,
                artist: artistId,
                appointmentDate: appointmentDate,
                startTime: startTime,
                serviceType: serviceType,
                location: {
                    address,
                    city,
                    postalCode,
                },
                notes,
                status: 'pending' as AppointmentStatus,
            };

            const response = await createAppointment(newAppointment);
            setSuccessMessage('Appointment booked successfully! We will notify you once the artist confirms.');
            console.log('Appointment created:', response);
            // Clear form or redirect
            setAppointmentDate('');
            setStartTime('');
            setServiceType('');
            setAddress('');
            setCity('');
            setPostalCode('');
            setNotes('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
            console.error('Appointment booking error:', err);
        } finally {
            navigate('/my-appointments')
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-700 mb-4">Please log in to book an appointment.</p>
                    <Button onClick={() => navigate('/login')}>Login</Button>
                </div>
            </div>
        );
    }

    if (currentUser?.role === "artist") {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-700 mb-4">Artists cannot book appointments for themselves. Please switch to a client account or log in as a client.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Book Your Mehendi Appointment</h1>

                {artistId && (loadingArtist ? (
                    <LoadingSpinner />
                ) : artistError ? (
                    <p className="text-red-500 text-center mb-4">{artistError}</p>
                ) : artist ? (
                    <div className="bg-indigo-50 p-4 rounded-md mb-6">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">Booking with: {artist.firstName} {artist.lastName}</h2>
                        <p className="text-gray-700">Specializations: {artist.specializations?.join(', ') || 'N/A'}</p>
                        {/* You could display artist's availability here based on `artist.availability` */}
                    </div>
                ) : (
                    <p className="text-gray-600 text-center mb-4">No artist selected. You can book an appointment and choose an artist later or contact us.</p>
                ))}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="appointmentDate"
                        label="Appointment Date"
                        type="date"
                        required
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                    />
                    <Input
                        id="startTime"
                        label="Preferred Start Time"
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                    <div>
                        <label htmlFor="serviceType" className="block text-gray-700 text-sm font-bold mb-2">
                            Service Type
                        </label>
                        <select
                            id="serviceType"
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                        >
                            <option value="">Select a service type</option>
                            <option value="Bridal Mehendi">Bridal Mehendi</option>
                            <option value="Party Mehendi">Party Mehendi</option>
                            <option value="Festival Mehendi">Festival Mehendi</option>
                            <option value="Custom Design">Custom Design</option>
                        </select>
                    </div>
                    <Input
                        id="address"
                        label="Your Address"
                        type="text"
                        placeholder="Street address, apartment, suite, etc."
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            id="city"
                            label="City"
                            type="text"
                            placeholder="City"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        <Input
                            id="postalCode"
                            label="Postal Code"
                            type="text"
                            placeholder="Postal Code"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
                            Additional Notes (e.g., specific design requests)
                        </label>
                        <textarea
                            id="notes"
                            rows={4}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}

                    <div>
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            Confirm Appointment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookAppointmentPage;