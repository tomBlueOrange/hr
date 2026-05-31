import React, {ReactNode} from "react";

import './Badge.css'

interface Props {
	children: ReactNode;
	style?: React.CSSProperties;
}

export const Badge: React.FC<Props> = ({children, style={}}) => {

	return (
		<div className="blue-orange-badge no-select" style={style}>{children}</div>
	)
}