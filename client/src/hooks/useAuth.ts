import { authStore } from "../store/authStore";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    setLogin,
    logout,
    updateUser,
  } = authStore();
  return {
    user,
    isAuthenticated,
    loading,
    error,
    setLogin,
    logout,
    updateUser,
  };
};
