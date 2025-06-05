// MyAppointmentPage.tsx
import React, { useEffect } from "react";
import { getMyAppointments } from "../services/appointment.service";
import { useAuth } from "../hooks/useAuth";
import { appointmentStore } from "../store/appointmentStore";

import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import AppointmentCard from "../components/appointments/AppointmentCard";
import SectionTitle from "../components/ui/SectionTitle";

const MyAppointmentPage: React.FC = () => {
    const { user } = useAuth();
    const {
        appointments,
        setAppointments,
        loading,
        setLoading,
        error,
        setError,
    } = appointmentStore();

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user?._id || appointments.length > 0) return;

            setLoading(true);
            setError(null);
            try {
                const data = await getMyAppointments();
                setAppointments(data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load appointments.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user, appointments, setAppointments, setError, setLoading]);

    return (
        <div className="mx-auto py-10 px-4">
            <SectionTitle title="My Appointments" />

            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            {!loading && !error && appointments.length === 0 && (
                <p className="text-center text-gray-400 italic">No appointments found.</p>
            )}

            {!loading && !error && appointments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {appointments.map((appointment) => (
                        <AppointmentCard key={appointment._id} appointment={appointment} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAppointmentPage;
