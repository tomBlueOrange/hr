import React, {ReactNode} from "react";

import './GeneralHeading.css'
interface Props {
	children: ReactNode;
	style?: React.CSSProperties;
}
export const GeneralHeading: React.FC<Props> = ({children, style={}}) => {
	return (
		<h2 className="blue-orange-general-heading" style={style}>{children}</h2>
	)
}