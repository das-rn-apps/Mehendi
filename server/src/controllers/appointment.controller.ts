import { Response, NextFunction } from "express";
import httpStatusCodes from "http-status-codes";
import Appointment from "../models/appointment.model";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import ApiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { IRequest } from "../interfaces/request.interface";
import { AppointmentStatus } from "../enums/appointmentStatus.enum";
import { UserRole } from "../enums/userRoles.enum";
import { getNotificationService } from "../services/notification.service"; // For WebSocket notifications
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentUpdateEmail,
} from "../services/email.service";
import mongoose from "mongoose";
import pick from "../utils/pick";

export const createAppointment = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id; // Logged-in user making the appointment
    const {
      artist: artistId,
      appointmentDate,
      startTime,
      serviceType,
      location,
      notes,
      design,
      durationMinutes,
      price,
    } = req.body;

    const artist = await User.findById(artistId);
    if (
      !artist ||
      artist.role !== UserRole.ARTIST ||
      !artist.isActive ||
      !artist.isProfileComplete
    ) {
      return next(
        new ApiError(
          httpStatusCodes.NOT_FOUND,
          "Artist not found or not available."
        )
      );
    }

    // TODO: Check artist's availability for the given date and time
    // This requires querying the artist's `availability` schedule and existing appointments.
    // For now, this is a simplified check.

    const appointmentData: any = {
      user: userId,
      artist: artistId,
      appointmentDate,
      startTime,
      serviceType,
      location,
      notes,
      status: AppointmentStatus.PENDING, // Appointments are pending until confirmed by artist
    };
    if (design) appointmentData.design = design;
    if (durationMinutes) appointmentData.durationMinutes = durationMinutes;
    if (price) appointmentData.price = price; // Price might be pre-defined or set by artist later

    const appointment = await Appointment.create(appointmentData);

    // Notify Artist
    const notificationService = getNotificationService();
    const userMakingBooking = await User.findById(userId).select(
      "firstName lastName"
    );
    notificationService.notifyNewAppointmentRequestToArtist(
      artistId.toString(),
      {
        appointmentId: appointment._id,
        userName: userMakingBooking?.firstName || "A user",
        date: appointmentDate,
        time: startTime,
      }
    );
    // TODO: Send email to artist about new booking request

    res
      .status(httpStatusCodes.CREATED)
      .json(
        new ApiResponse(
          httpStatusCodes.CREATED,
          appointment,
          "Appointment request sent successfully. Awaiting artist confirmation."
        )
      );
  }
);

export const getMyAppointments = asyncHandler(
  async (req: IRequest, res: Response) => {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "appointmentDate",
      sortOrder = "asc",
    } = req.query;
    const query: any = {};

    if (userRole === UserRole.USER) {
      query.user = userId;
    } else if (userRole === UserRole.ARTIST) {
      query.artist = userId;
    } else if (userRole === UserRole.ADMIN) {
      // Admin can see all, or filter by userId/artistId if provided in query
      if (req.query.userId) query.user = req.query.userId;
      if (req.query.artistId) query.artist = req.query.artistId;
    } else {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .json(new ApiError(httpStatusCodes.FORBIDDEN, "Access denied."));
    }

    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate("user", "firstName lastName email avatar")
      .populate("artist", "firstName lastName email avatar")
      .populate("design", "title images")
      .sort({ [sortBy as string]: sortOrder === "desc" ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalAppointments = await Appointment.countDocuments(query);

    res.status(httpStatusCodes.OK).json(
      new ApiResponse(
        httpStatusCodes.OK,
        {
          appointments,
          currentPage: Number(page),
          totalPages: Math.ceil(totalAppointments / Number(limit)),
          totalAppointments,
        },
        "Appointments fetched successfully."
      )
    );
  }
);

export const getAppointmentById = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { appointmentId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid appointment ID format."
        )
      );
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("user", "firstName lastName email phone avatar")
      .populate("artist", "firstName lastName email phone avatar")
      .populate("design", "title images category");

    if (!appointment) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "Appointment not found.");
    }

    // Authorization check: User can see their own, Artist can see their own, Admin can see any
    if (
      userRole === UserRole.USER &&
      appointment.user._id.toString() !== userId?.toString()
    ) {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        "You are not authorized to view this appointment."
      );
    }
    if (
      userRole === UserRole.ARTIST &&
      appointment.artist._id.toString() !== userId?.toString()
    ) {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        "You are not authorized to view this appointment."
      );
    }

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          appointment,
          "Appointment details fetched successfully."
        )
      );
  }
);

export const updateAppointmentStatus = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { appointmentId } = req.params;
    const {
      status,
      cancellationReasonUser,
      cancellationReasonArtist,
      artistNotes,
    } = req.body;
    const currentUserId = req.user?._id;
    const currentUserRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid appointment ID format."
        )
      );
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("user")
      .populate("artist");
    if (!appointment) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "Appointment not found.");
    }

    // Authorization: Only artist or admin can change status (except user cancelling)
    if (
      status === AppointmentStatus.CANCELLED &&
      currentUserRole === UserRole.USER &&
      appointment.user._id.toString() === currentUserId?.toString()
    ) {
      // User is cancelling their own appointment
      if (
        ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(
          appointment.status
        )
      ) {
        return next(
          new ApiError(
            httpStatusCodes.BAD_REQUEST,
            `Cannot cancel appointment with status: ${appointment.status}.`
          )
        );
      }
      appointment.status = AppointmentStatus.CANCELLED;
      if (cancellationReasonUser)
        appointment.cancellationReason = cancellationReasonUser;
    } else if (
      currentUserRole === UserRole.ARTIST &&
      appointment.artist._id.toString() === currentUserId?.toString()
    ) {
      // Artist is updating status
      if (status === AppointmentStatus.CANCELLED && cancellationReasonArtist)
        appointment.cancellationReason = cancellationReasonArtist;
      if (status === AppointmentStatus.REJECTED && cancellationReasonArtist)
        appointment.cancellationReason = cancellationReasonArtist; // Alias for consistency
      if (artistNotes) appointment.artistNotes = artistNotes;
      appointment.status = status as AppointmentStatus;
    } else if (currentUserRole === UserRole.ADMIN) {
      // Admin can update status
      if (status === AppointmentStatus.CANCELLED) {
        if (cancellationReasonUser)
          appointment.cancellationReason = cancellationReasonUser;
        if (cancellationReasonArtist)
          appointment.cancellationReason = cancellationReasonArtist;
      }
      appointment.status = status as AppointmentStatus;
    } else {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        "You are not authorized to update this appointment status."
      );
    }

    // Prevent invalid status transitions (add more complex logic if needed)
    // e.g., cannot move from 'COMPLETED' back to 'PENDING' by non-admin

    await appointment.save();

    // Send Notifications & Emails
    const notificationService = getNotificationService();
    const clientUser = appointment.user as any; // Populated user object
    const artistUser = appointment.artist as any; // Populated artist object

    const apptDateStr = new Date(
      appointment.appointmentDate
    ).toLocaleDateString();
    const apptTimeStr = appointment.startTime;

    if (status === AppointmentStatus.CONFIRMED) {
      notificationService.notifyAppointmentUpdate(clientUser._id.toString(), {
        appointmentId,
        status,
        message: `Your appointment with ${artistUser.firstName} on ${apptDateStr} is confirmed!`,
      });
      await sendAppointmentConfirmationEmail(
        clientUser.email,
        clientUser.firstName,
        artistUser.firstName,
        apptDateStr,
        apptTimeStr
      );
    } else {
      // For other status updates like CANCELLED, COMPLETED, REJECTED
      notificationService.notifyAppointmentUpdate(clientUser._id.toString(), {
        appointmentId,
        status,
        message: `Your appointment with ${artistUser.firstName} on ${apptDateStr} is now ${status}.`,
      });
      if (
        appointment.user._id.toString() !== appointment.artist._id.toString()
      ) {
        // Don't notify self if artist cancels their own slot
        notificationService.notifyAppointmentUpdate(artistUser._id.toString(), {
          appointmentId,
          status,
          message: `Appointment with ${clientUser.firstName} on ${apptDateStr} is now ${status}.`,
        });
      }
      await sendAppointmentUpdateEmail(
        clientUser.email,
        clientUser.firstName,
        artistUser.firstName,
        apptDateStr,
        apptTimeStr,
        status
      );
      if (currentUserRole !== UserRole.USER) {
        // If artist or admin changed status, also notify other party (artist if user cancelled, user if artist changed)
        const otherPartyEmail =
          currentUserRole === UserRole.ARTIST
            ? clientUser.email
            : artistUser.email;
        const otherPartyName =
          currentUserRole === UserRole.ARTIST
            ? clientUser.firstName
            : artistUser.firstName;
        const counterpartName =
          currentUserRole === UserRole.ARTIST
            ? artistUser.firstName
            : clientUser.firstName;
        await sendAppointmentUpdateEmail(
          otherPartyEmail,
          otherPartyName,
          counterpartName,
          apptDateStr,
          apptTimeStr,
          status
        );
      }
    }

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          appointment,
          `Appointment status updated to ${status}.`
        )
      );
  }
);

// User or Artist updating details of a PENDING or CONFIRMED appointment (e.g., notes, time (if allowed))
export const updateAppointmentDetails = asyncHandler(
  async (req: IRequest, res: Response, next: NextFunction) => {
    const { appointmentId } = req.params;
    const updates = req.body;
    const currentUserId = req.user?._id;
    const currentUserRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Invalid appointment ID format."
        )
      );
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(httpStatusCodes.NOT_FOUND, "Appointment not found.");
    }

    // Authorization & Logic
    const isUserParty =
      appointment.user.toString() === currentUserId?.toString();
    const isArtistParty =
      appointment.artist.toString() === currentUserId?.toString();

    if (!isUserParty && !isArtistParty && currentUserRole !== UserRole.ADMIN) {
      throw new ApiError(
        httpStatusCodes.FORBIDDEN,
        "Not authorized to update this appointment."
      );
    }

    // Prevent status changes through this endpoint
    if (updates.status) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Use the dedicated status update endpoint to change appointment status."
        )
      );
    }

    // Only allow updates on PENDING or CONFIRMED appointments by user/artist
    if (
      ![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(
        appointment.status
      ) &&
      currentUserRole !== UserRole.ADMIN
    ) {
      return next(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          `Cannot update appointment with status: ${appointment.status}.`
        )
      );
    }

    // Specific fields control
    if (currentUserRole === UserRole.USER && !isUserParty) {
      /* Should not happen if primary check passed */
    }
    if (currentUserRole === UserRole.USER) {
      // User can update their notes, potentially suggest new time/date (if logic allows & status is PENDING)
      if (updates.artistNotes) delete updates.artistNotes; // User cannot set artist notes
      if (updates.price) delete updates.price; // User usually doesn't set price
    }

    if (currentUserRole === UserRole.ARTIST && !isArtistParty) {
      /* Should not happen */
    }
    if (currentUserRole === UserRole.ARTIST) {
      // Artist can update their notes, price (if status is PENDING/CONFIRMED)
    }

    Object.assign(appointment, updates);
    await appointment.save();

    // TODO: Notify other party about the update.
    // const notificationService = getNotificationService();
    // const otherPartyId = isUserParty ? appointment.artist.toString() : appointment.user.toString();
    // notificationService.sendNotificationToUser(otherPartyId, 'appointment_details_updated', { appointmentId, updates });

    res
      .status(httpStatusCodes.OK)
      .json(
        new ApiResponse(
          httpStatusCodes.OK,
          appointment,
          "Appointment details updated."
        )
      );
  }
);

// Admin: Get all appointments (more comprehensive than getMy)
export const getAllAppointmentsAdmin = asyncHandler(
  async (req: IRequest, res: Response) => {
    const filters = pick(req.query, [
      "userId",
      "artistId",
      "status",
      "dateFrom",
      "dateTo",
    ]);
    const options = pick(req.query, ["sortBy", "limit", "page", "sortOrder"]);
    const query: any = { ...filters };

    if (filters.dateFrom)
      query.appointmentDate = {
        ...query.appointmentDate,
        $gte: new Date(filters.dateFrom as string),
      };
    if (filters.dateTo)
      query.appointmentDate = {
        ...query.appointmentDate,
        $lte: new Date(filters.dateTo as string),
      };

    const appointments = await Appointment.find(query)
      .populate("user", "firstName lastName email")
      .populate("artist", "firstName lastName email")
      .populate("design", "title")
      .sort({
        [typeof options.sortBy === "string"
          ? options.sortBy
          : "appointmentDate"]: options.sortOrder === "desc" ? -1 : 1,
      })
      .skip(
        ((parseInt(options.page as string) || 1) - 1) *
          (parseInt(options.limit as string) || 10)
      )
      .limit(parseInt(options.limit as string) || 10);

    const totalAppointments = await Appointment.countDocuments(query);

    res.status(httpStatusCodes.OK).json(
      new ApiResponse(
        httpStatusCodes.OK,
        {
          appointments,
          currentPage: parseInt(options.page as string) || 1,
          totalPages: Math.ceil(
            totalAppointments / (parseInt(options.limit as string) || 10)
          ),
          totalAppointments,
        },
        "All appointments fetched for admin."
      )
    );
  }
);
