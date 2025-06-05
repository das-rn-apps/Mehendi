import { type IUser } from "./user.interface";

export interface AuthState {
  token: string | null;
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: IUser;
}

export interface RegisterResponse {
  message: string;
  user: IUser;
}
