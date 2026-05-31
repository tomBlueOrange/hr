import React from "react";

import './RequiredIcon.css'

interface Props {
	style?: React.CSSProperties
}

export const RequiredIcon: React.FC<Props> = ({style={}}) => {


	return (
		<div className="blue-orange-default-required-icon" style={style}>
			<i className="ri-asterisk"></i>
		</div>
	)
}