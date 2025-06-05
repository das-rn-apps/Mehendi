import api from "./api";
import { type IUser } from "../interfaces/user.interface";

export const getAllUsers = async (): Promise<IUser[]> => {
  const response = await api.get("/users");
  return response.data.users; // Assuming the backend returns { users: IUser[] }
};

export const getUserById = async (id: string): Promise<IUser> => {
  const response = await api.get(`/users/${id}`);
  return response.data.data.user;
};

export const updateMe = async (userData: Partial<IUser>): Promise<IUser> => {
  const response = await api.patch("/users/update-me", userData);
  return response.data.user;
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await api.patch("/users/update-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// Artist specific services
export const getAllArtists = async (): Promise<IUser[]> => {
  const response = await api.get("/users/artists/public");
  return response.data.data.artists;
};

export const getArtistById = async (artistId: string): Promise<IUser> => {
  const response = await api.get(`/users/artists/public/${artistId}`);
  return response.data.data.artist;
};
