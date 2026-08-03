import React, { createContext, useLayoutEffect, useState, useMemo, FC, ReactNode } from 'react';
import PropTypes from 'prop-types';
import useDeviceScreen from '../hooks/useDeviceScreen';

const MOBILE_BREAKPOINT_SIZE = 768;

export interface IThemeContextProps {
	darkModeStatus: boolean;
	fullScreenStatus: boolean;
	mobileDesign: boolean;
	rightPanel: boolean;
	setDarkModeStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setFullScreenStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setRightPanel: (value: ((prevState: boolean) => boolean) | boolean) => void;
}
const ThemeContext = createContext<IThemeContextProps>({} as IThemeContextProps);

interface IThemeContextProviderProps {
	children: ReactNode;
}
export const ThemeContextProvider: FC<IThemeContextProviderProps> = ({ children }) => {
	const deviceScreen = useDeviceScreen();
	const mobileDesign = (deviceScreen?.width ?? 0) <= MOBILE_BREAKPOINT_SIZE;

	const [darkModeStatus, setDarkModeStatus] = useState(
		localStorage.getItem('facit_darkModeStatus')
			? localStorage.getItem('facit_darkModeStatus') === 'true'
			: false,
	);

	useLayoutEffect(() => {
		localStorage.setItem('facit_darkModeStatus', darkModeStatus.toString());
		document.documentElement.setAttribute('theme', darkModeStatus ? 'dark' : 'light');
		document.documentElement.setAttribute('data-bs-theme', darkModeStatus ? 'dark' : 'light');
	}, [darkModeStatus]);

	const [fullScreenStatus, setFullScreenStatus] = useState(false);
	const [rightPanel, setRightPanel] = useState(false);

	const values: IThemeContextProps = useMemo(
		() => ({
			mobileDesign,
			darkModeStatus,
			setDarkModeStatus,
			fullScreenStatus,
			setFullScreenStatus,
			rightPanel,
			setRightPanel,
		}),
		[darkModeStatus, fullScreenStatus, mobileDesign, rightPanel],
	);

	return <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>;
};
ThemeContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default ThemeContext;
