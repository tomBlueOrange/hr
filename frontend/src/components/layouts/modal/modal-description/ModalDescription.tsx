import React from "react";

import './ModalDescription.css'

interface Props {
	description: string
}

export const ModalDescription: React.FC<Props> = ({description}) => {

	return (
		<div className="blue-orange-modal-description">{description}</div>
	)
}
