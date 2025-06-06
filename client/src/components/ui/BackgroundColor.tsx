import { useThemeStore } from "../../store/useThemeStore";
import { useState } from "react";
import { colors } from "../../utils/colors";

export const ThemeColorPalette = () => {
    const setBackgroundColor = useThemeStore((state) => state.setBackgroundColor);
    const backgroundColor = useThemeStore((state) => state.backgroundColor);
    const [selected, setSelected] = useState(backgroundColor);

    const handleSelect = (color: string) => {
        setSelected(color);
        setBackgroundColor(color);
    };

    return (
        <div className="px-4 py-3">
            <h2 className="text-base font-semibold text-gray-700 mb-3">Select Background</h2>
            <div className="grid grid-cols-10 gap-3">
                {colors.map((c) => {
                    const isSelected = selected === c.hex;
                    return (
                        <button
                            key={c.hex}
                            className={`w-7 h-7 rounded-full shadow-md transition-transform transform hover:scale-110 border-1 ${isSelected ? "ring-1 ring-indigo-500 border-indigo-500" : "border-white"
                                }`}
                            style={{ backgroundColor: c.hex }}
                            onClick={() => handleSelect(c.hex)}
                            title={c.name}
                            aria-label={`Select ${c.name}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};
