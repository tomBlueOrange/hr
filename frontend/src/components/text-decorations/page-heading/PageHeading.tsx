import React, {ReactNode} from "react";

import './PageHeading.css'
interface Props {
	children: ReactNode;
	style?: React.CSSProperties;
}
export const PageHeading: React.FC<Props> = ({children, style={}}) => {
	return (
		<h1 className="blue-orange-default-heading" style={style}>{children}</h1>
	)
}
