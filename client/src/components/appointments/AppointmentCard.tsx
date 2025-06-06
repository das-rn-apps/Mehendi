import React from "react";
import type { IAppointmentResponse } from "../../interfaces/appointment.interface";
import { CalendarDays, Clock, UserCircle2, Info } from "lucide-react";

interface Props {
    appointment: IAppointmentResponse;
}

const AppointmentCard: React.FC<Props> = ({ appointment }) => {
    const { artist, appointmentDate, startTime, status } = appointment;

    const statusStyle = {
        confirmed: {
            text: "text-blue-600",
            bg: "bg-blue-100",
        },
        cancelled: {
            text: "text-red-600",
            bg: "bg-red-100",
        },
        pending: {
            text: "text-yellow-600",
            bg: "bg-yellow-100",
        },
        completed: {
            text: "text-green-700",
            bg: "bg-green-100",
        },
        rescheduled: {
            text: "text-pink-600",
            bg: "bg-pink-100",
        },
    }[status] || {
        text: "text-gray-600",
        bg: "bg-gray-100",
    };

    return (
        <div className="bg-white shadow rounded-xl p-4 hover:shadow-md transition duration-200 min-h-[80px] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 h-full">

                {/* Left Column */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <UserCircle2 className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium text-gray-800">{artist.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 text-blue-500" />
                        <span>{new Date(appointmentDate).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex-1 space-y-2 text-right sm:text-left sm:items-end">
                    <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span>{startTime}</span>
                    </div>
                    <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.text} ${statusStyle.bg} float-right`}
                    >
                        <Info className="w-4 h-4" />
                        <span className="capitalize">{status}</span>
                    </div>
                </div>

            </div>
        </div>


    );
};

export default AppointmentCard;
