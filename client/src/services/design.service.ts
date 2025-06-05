import api from "./api";
import { type IDesign } from "../interfaces/design.interface";

export const getAllDesigns = async (): Promise<IDesign[]> => {
  const response = await api.get("/designs");
  return response.data.data.designs;
};

// export const getAllDesigns = async (
//   params?: Record<string, any>
// ): Promise<IDesign[]> => {
//   const response = await api.get("/designs", { params });
//   return response.data.designs;
// };

export const getDesignById = async (id: string): Promise<IDesign> => {
  const response = await api.get(`/designs/${id}`);
  return response.data.design;
};

export const createDesign = async (designData: FormData): Promise<IDesign> => {
  const response = await api.post("/designs", designData, {
    headers: {
      "Content-Type": "multipart/form-data", // Important for file uploads
    },
  });
  return response.data.design;
};

export const updateDesign = async (
  id: string,
  designData: Partial<IDesign>
): Promise<IDesign> => {
  const response = await api.patch(`/designs/${id}`, designData);
  return response.data.design;
};

export const deleteDesign = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/designs/${id}`);
  return response.data;
};

export const likeDesign = async (
  id: string
): Promise<{ message: string; likesCount: number }> => {
  const response = await api.post(`/designs/${id}/like`);
  return response.data;
};

export const unlikeDesign = async (
  id: string
): Promise<{ message: string; likesCount: number }> => {
  const response = await api.post(`/designs/${id}/unlike`);
  return response.data;
};
