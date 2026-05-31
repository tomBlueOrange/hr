import React from "react";

import './CenteredDiv.css'

interface Props {
	children: React.ReactNode
}

export const CenteredDiv: React.FC<Props> = ({children}) => {

	return (
		<div className="blue-orange-layouts-centered-div">
			{children}
		</div>
	)
}