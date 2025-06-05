import { create } from "zustand";
import { type IDesign } from "../interfaces/design.interface";

interface DesignState {
  designs: IDesign[];
  featuredDesigns: IDesign[];
  selectedDesign: IDesign | null;
  loading: boolean;
  error: string | null;
}

interface DesignActions {
  setDesigns: (designs: IDesign[]) => void;
  setFeaturedDesigns: (designs: IDesign[]) => void;
  setSelectedDesign: (design: IDesign | null) => void;
  addDesign: (design: IDesign) => void;
  updateDesign: (designId: string, updatedData: Partial<IDesign>) => void;
  deleteDesign: (designId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const designStore = create<DesignState & DesignActions>((set) => ({
  designs: [],
  featuredDesigns: [],
  selectedDesign: null,
  loading: false,
  error: null,

  setDesigns: (designs) => set({ designs }),
  setFeaturedDesigns: (designs) => set({ featuredDesigns: designs }),
  setSelectedDesign: (design) => set({ selectedDesign: design }),
  addDesign: (design) =>
    set((state) => ({ designs: [...state.designs, design] })),
  updateDesign: (designId, updatedData) =>
    set((state) => ({
      designs: state.designs.map((design) =>
        design._id === designId ? { ...design, ...updatedData } : design
      ),
      featuredDesigns: state.featuredDesigns.map((design) =>
        design._id === designId ? { ...design, ...updatedData } : design
      ),
      selectedDesign:
        state.selectedDesign?._id === designId
          ? { ...state.selectedDesign, ...updatedData }
          : state.selectedDesign,
    })),
  deleteDesign: (designId) =>
    set((state) => ({
      designs: state.designs.filter((design) => design._id !== designId),
      featuredDesigns: state.featuredDesigns.filter(
        (design) => design._id !== designId
      ),
      selectedDesign:
        state.selectedDesign?._id === designId ? null : state.selectedDesign,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
