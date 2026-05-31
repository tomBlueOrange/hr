import React from "react";

import './Skeleton.css'

interface Props {
	animationDuration?: number,
	style?: React.CSSProperties
}

export const Skeleton: React.FC<Props> = ({style={}}) => {

	return (
		<div className="blue-orange-loading-skeleton" style={style}></div>
	)
}