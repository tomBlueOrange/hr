import React from "react";

import './DrawerBody.css'

interface Props {
	children: React.ReactNode;
}

export const DrawerBody: React.FC<Props> = ({children}) => {

	return (
		<div className="blue-orange-drawer-body">{children}</div>
	)
}
