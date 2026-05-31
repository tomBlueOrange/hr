import React, {ReactNode, useEffect, useRef, useState} from "react";

import './DropdownItemStyle.css'
import {DropdownItemObj, DropdownItemType} from "../../../../interfaces/AppInterfaces";

interface Props {
	children: ReactNode;
	item: DropdownItemObj;
	update?: Date;
}
export const DropdownItemStyle: React.FC<Props> = ({children, item, update}) => {


	const itemRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setClassName(generateItemStyle(item));
		if (item.focused) {
			itemRef.current?.scrollIntoView(true);
		}
	}, [item, update]);

	const generateItemStyle = (item: DropdownItemObj) => {
		var className = "blue-orange-dropdown-item-cont"
		if (item.type != DropdownItemType.HEADING && !item.disabled) {
			className += " blue-orange-dropdown-item-hoverable"
		}
		if (item.disabled) {
			className += " blue-orange-dropdown-item-disabled"
		}
		if (item.focused) {
			className += " blue-orange-dropdown-item-focused"
		}
		return className;
	}

	const [className, setClassName] = useState<string>(generateItemStyle(item))

	return (
		<div ref={itemRef} className={className}>{children}</div>
	)
}