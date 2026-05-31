import React from "react";

import './DropdownItem.css'
import {DropdownItemObj, DropdownItemType} from "../../../../interfaces/AppInterfaces";
import {DropdownItemImage} from "../DropdownItemImage/DropdownItemImage";
import {DropdownItemIcon} from "../DropdownItemIcon/DropdownItemIcon";
import {DropdownItemHeading} from "../DropdownItemHeading/DropdownItemHeading";
import {DropdownItemText} from "../DropdownItemText/DropdownItemText";

interface Props {
	item: DropdownItemObj,
	displayedValue?: boolean,
	onClick?: (item: DropdownItemObj) => void,
}
export const DropdownItem: React.FC<Props> = ({
												  item,
												  displayedValue = false,
												  onClick}) => {

	const generateItemStyle = () => {
		var className = "blue-orange-dropdown-item"
		return className;
	}

	const handleClick = () => {
		if (onClick && (item.disabled == undefined || !item.disabled) && item.type !== DropdownItemType.HEADING) {
			onClick(item);
		}
	}

	return (
		<>
			{displayedValue &&
				<div>
					{item.type == DropdownItemType.IMAGE &&
						<DropdownItemImage
							src={item.src as string}
							value={item.reference}
							label={item.label}
							selected={false}></DropdownItemImage>}
					{item.type == DropdownItemType.ICON &&
						<DropdownItemIcon
							src={item.src as string}
							value={item.reference}
							label={item.label}
							selected={false}></DropdownItemIcon>}
					{item.type == DropdownItemType.HEADING &&
						<DropdownItemHeading
							label={item.label}
							value={item.reference}
							selected={false}></DropdownItemHeading>}
					{item.type == DropdownItemType.TEXT &&
						<DropdownItemText
							label={item.label}
							value={item.reference}
							selected={false}></DropdownItemText>}
				</div>
			}
			{!displayedValue &&
				<div className="blue-orange-dropdown-item" onClick={handleClick}>
					{item.type == DropdownItemType.IMAGE &&
						<DropdownItemImage
							src={item.src as string}
							label={item.label}
							value={item.reference}
							selected={item.selected}></DropdownItemImage>}
					{item.type == DropdownItemType.ICON &&
						<DropdownItemIcon
							src={item.src as string}
							label={item.label}
							value={item.reference}
							selected={item.selected}></DropdownItemIcon>}
					{item.type == DropdownItemType.HEADING &&
						<DropdownItemHeading
							label={item.label}
							value={item.reference}
							selected={item.selected}></DropdownItemHeading>}
					{item.type == DropdownItemType.TEXT &&
						<DropdownItemText
							label={item.label}
							value={item.reference}
							selected={item.selected}></DropdownItemText>}
				</div>
			}

		</>
	)
}