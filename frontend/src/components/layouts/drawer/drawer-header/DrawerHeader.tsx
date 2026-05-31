import React from "react";

import './DrawerHeader.css'
import {ButtonIcon} from "../../../buttons/button-icon/ButtonIcon";

interface Props {
	label: string,
	onClose?: () => void;
}

export const DrawerHeader: React.FC<Props> = ({label, onClose}) => {

	const closeClicked = () => {
		if (onClose) {
			onClose();
		}
	}

	return (
		<div className="blue-orange-drawer-header">
			<div className="blue-orange-drawer-header-label">{label}</div>
			<div className="blue-orange-drawer-header-close-btn">
				<ButtonIcon icon={"ri-close-line"} style={{backgroundColor: "transparent", border: "0px solid transparent"}} onClick={closeClicked}></ButtonIcon>
			</div>
		</div>
	)
}
