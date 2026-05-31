import React from "react";

import './ModalBody.css'

interface Props {
	children: React.ReactNode;
}

export const ModalBody: React.FC<Props> = ({children}) => {

	return (
		<div className="blue-orange-modal-body">{children}</div>
	)
}
