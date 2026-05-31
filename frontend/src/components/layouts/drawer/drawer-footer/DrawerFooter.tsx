import React from "react";

import './DrawerFooter.css'
import {DrawerFooterLeft} from "../drawer-footer-left/DrawerFooterLeft";
import {DrawerFooterRight} from "../drawer-footer-right/DrawerFooterRight";

interface Props {
	children: React.ReactNode;
}

export const DrawerFooter: React.FC<Props> = ({children}) => {

	const leftItems: React.ReactNode[] = [];

	const rightItems: React.ReactNode[] = [];

	React.Children.forEach(children, child => {
		if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
			if (child.type === DrawerFooterLeft) {
				leftItems.push(child.props.children);
			} else if (child.type === DrawerFooterRight) {
				rightItems.push(child.props.children);
			}
		}
	});


	return (
		<div className="blue-orange-drawer-footer">
			<div className="blue-orange-drawer-footer-left">{leftItems}</div>
			<div className="blue-orange-drawer-footer-right">{rightItems}</div>
		</div>
	)
}
