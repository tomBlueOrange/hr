import React from "react";

import './ContextMenuSeparator.css'
import {IContextMenuItem} from "../contextmenu/ContextMenu";

interface Props {
	item: IContextMenuItem,
	onClick: (item: IContextMenuItem) => void
}

export const ContextMenuSeparator: React.FC<Props> = ({item, onClick}) => {

	return (
		<div className="blue-orange-context-menu-separator">
		</div>
	)
}