import React from "react";

import './RightAlignedDiv.css'

interface Props {
	children: React.ReactNode
}

export const RightAlignedDiv: React.FC<Props> = ({children}) => {

	return (
		<div className="blue-orange-layouts-right-aligned-div">
			{children}
		</div>
	)
}