import React, {useEffect, useState} from "react";

import './Drawer.css'

export enum DrawerPosition {
	LEFT,
	RIGHT,
	TOP,
	BOTTOM
}

interface Props {
	children: React.ReactNode;
	position?: DrawerPosition,
	height?: string;
	width?: string;
	onClose?: () => void;
}

export const Drawer: React.FC<Props> = ({children, position = DrawerPosition.TOP, height="375px", width="375px", onClose}) => {

	const [animate, setAnimate] = useState(false);

	const generateDrawerStyle = (): React.CSSProperties => {
		if (position == DrawerPosition.RIGHT) {
			return {
				justifyContent: "flex-end"
			}
		} else if (position == DrawerPosition.LEFT) {
			return {
				justifyContent: "flex-start"
			}
		} else if (position == DrawerPosition.TOP) {
			return {
				flexDirection: "column",
				justifyContent: "flex-start"
			}
		} else if (position == DrawerPosition.BOTTOM) {
			return {
				flexDirection: "column",
				justifyContent: "flex-end"
			}
		}
		return {}
	}

	useEffect(() => {
		setAnimate(true);
	}, []);

	const handleBackdropClicked = () => {
		if (onClose) {
			onClose()
		}
	}

	return (
		<div className="blue-orange-drawer-window" style={generateDrawerStyle()}>
			<div className="blue-orange-drawer-backdrop" onClick={handleBackdropClicked}></div>
			<div className="blue-orange-drawer-content">
				{position == DrawerPosition.RIGHT && <div className={animate ? "blue-orange-drawer-card-right blue-orange-drawer-card-enter" : "blue-orange-drawer-card-right"} style={{width: width}}>{children}</div>}
				{position == DrawerPosition.LEFT && <div className={animate ? "blue-orange-drawer-card-left blue-orange-drawer-card-enter" : "blue-orange-drawer-card-left"} style={{width: width}}>{children}</div>}
				{position == DrawerPosition.TOP && <div className={animate ? "blue-orange-drawer-card-top blue-orange-drawer-card-enter" : "blue-orange-drawer-card-top"} style={{height: height}}>{children}</div>}
				{position == DrawerPosition.BOTTOM && <div className={animate ? "blue-orange-drawer-card-bottom blue-orange-drawer-card-enter" : "blue-orange-drawer-card-bottom"} style={{height: height}}>{children}</div>}
			</div>
		</div>
	)
}
