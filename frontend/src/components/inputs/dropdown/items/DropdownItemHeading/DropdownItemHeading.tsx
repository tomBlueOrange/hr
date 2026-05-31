import React, {ReactNode, useState} from "react";
import { v4 as uuidv4 } from 'uuid';

import './DropdownItemHeading.css'
import {Image} from "../../../../media/image/Image";

interface Props {
	label: string,
	value: string,
	selected: boolean,
	disabled?: boolean
}
export const DropdownItemHeading: React.FC<Props> = ({label, value, selected, disabled=false}) => {

	return (
		<div className="blue-orange-dropdown-item-text-heading no-select">{label}</div>
	)
}