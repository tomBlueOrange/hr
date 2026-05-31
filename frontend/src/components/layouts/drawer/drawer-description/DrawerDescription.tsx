import React from "react";

import './DrawerDescription.css'

interface Props {
	description: string
}

export const DrawerDescription: React.FC<Props> = ({description}) => {

	return (
		<div className="blue-orange-drawer-description">{description}</div>
	)
}
