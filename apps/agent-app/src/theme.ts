import { createContext } from "react";

export type ColorModeContextType = {
	toggleColorMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType>({
	toggleColorMode: () => {},
});

export default ColorModeContext;
