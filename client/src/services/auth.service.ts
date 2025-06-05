import api from "./api";
import type {
  LoginResponse,
  RegisterResponse,
} from "../interfaces/auth.interface";
import { type IUser } from "../interfaces/user.interface";

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", { email, password });
  return response.data.data;
};

export const register = async (
  userData: Partial<IUser> & { password: string }
): Promise<RegisterResponse> => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const getMe = async (): Promise<IUser> => {
  const response = await api.get("/auth/me");
  return response.data.user; // Assuming the backend returns { user: IUser }
};

export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (
  token: string,
  password: string,
  passwordConfirm: string
): Promise<{ message: string }> => {
  const response = await api.patch(`/auth/reset-password/${token}`, {
    password,
    passwordConfirm,
  });
  return response.data;
};
