import React, {ReactNode} from "react";

import './TBody.css'

interface Props {
	children: ReactNode
}
export const TBody: React.FC<Props> = ({children}) => {


	return (
		<tbody>
			{children}
		</tbody>
	)
}