import React from "react";

import './ContextMenuHeading.css'
import {IContextMenuItem} from "../contextmenu/ContextMenu";

interface Props {
	item: IContextMenuItem,
	onClick?: (item: IContextMenuItem) => void,
}

export const ContextMenuHeading: React.FC<Props> = ({item}) => {

	return (
		<div className="blue-orange-context-menu-general-row blue-orange-context-menu-heading">
			<div className="blue-orange-context-menu-heading-left-cont">
				{item.icon && (
					<div className="blue-orange-default-context-menu-row-icon"><i className={item.icon}></i></div>
				)}
				<div>{item.label}</div>
			</div>
		</div>
	)
}