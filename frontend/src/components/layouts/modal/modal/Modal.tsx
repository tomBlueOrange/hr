import React from "react";

import './Modal.css'

interface Props {
	children: React.ReactNode;
	width?: number,
	minWidth?: number;
	minHeight?: number;
	onClose?: () => void;
}

export const Modal: React.FC<Props> = ({children, width=375, minWidth=375, minHeight=0, onClose}) => {

	const handleBackdropClicked = () => {
		if (onClose) {
			onClose()
		}
	}

	return (
		<div className="blue-orange-modal-window">
			<div className="blue-orange-modal-backdrop" onClick={handleBackdropClicked}></div>
			<div className="blue-orange-modal-content">
				<div className="blue-orange-modal-card shadow" style={{width: width + "px", minWidth: minWidth + "px", minHeight: minHeight + "px"}}>{children}</div>
			</div>
		</div>
	)
}
