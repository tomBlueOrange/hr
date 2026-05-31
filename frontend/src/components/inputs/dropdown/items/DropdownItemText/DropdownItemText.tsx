import React, {ReactNode, useState} from "react";
import { v4 as uuidv4 } from 'uuid';

import './DropdownItemText.css'
import {Image} from "../../../../media/image/Image";

interface Props {
	label: string,
	value: string,
	selected: boolean,
	disabled?: boolean
}
export const DropdownItemText: React.FC<Props> = ({label, value, selected, disabled=false}) => {

	var textStyle: React.CSSProperties = {
		fontWeight: 500
	}

	return (
		<div className="blue-orange-dropdown-item-text no-select" style={textStyle}>{label}</div>
	)
}