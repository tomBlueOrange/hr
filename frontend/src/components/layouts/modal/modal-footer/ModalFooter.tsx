import React from "react";

import './ModalFooter.css'
import {ModalFooterLeft} from "../modal-footer-left/ModalFooterLeft";
import {ModalFooterRight} from "../modal-footer-right/ModalFooterRight";

interface Props {
	children: React.ReactNode;
}

export const ModalFooter: React.FC<Props> = ({children}) => {

	const leftItems: React.ReactNode[] = [];

	const rightItems: React.ReactNode[] = [];

	React.Children.forEach(children, child => {
		if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
			if (child.type === ModalFooterLeft) {
				leftItems.push(child.props.children);
			} else if (child.type === ModalFooterRight) {
				rightItems.push(child.props.children);
			}
		}
	});


	return (
		<div className="blue-orange-modal-footer">
			<div className="blue-orange-modal-footer-left">{leftItems}</div>
			<div className="blue-orange-modal-footer-right">{rightItems}</div>
		</div>
	)
}
