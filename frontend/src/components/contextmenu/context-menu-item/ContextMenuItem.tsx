import React from "react";

import './ContextMenuItem.css'
import {IContextMenuItem} from "../contextmenu/ContextMenu";

interface Props {
	item: IContextMenuItem,
	onClick?: (item: IContextMenuItem) => void,
}

export const ContextMenuItem: React.FC<Props> = ({item, onClick}) => {

	const itemClicked = () => {
		if (onClick) {
			onClick(item);
		}
	}

	return (
		<div className="blue-orange-context-menu-general-row blue-orange-context-menu-item" onClick={itemClicked}>
			<div className="blue-orange-context-menu-item-left-cont">
				{item.icon && (
					<div className="blue-orange-default-context-menu-row-icon"><i className={item.icon}></i></div>
				)}
				<div>{item.label}</div>
			</div>
			{item.rightIcon && (
				<div className="blue-orange-default-context-menu-row-right-icon"><i className={item.rightIcon}></i></div>
			)}
		</div>
	)
}