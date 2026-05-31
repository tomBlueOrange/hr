import React, {useEffect, useRef, useState} from "react";

import './TextArea.css';
import {HelpIcon} from "../help/HelpIcon";
import {RequiredIcon} from "../required-icon/RequiredIcon";

interface Props {
	value?:string;
	placeholder?: string;
	style?: React.CSSProperties;
	onChange?: (value: string) => void;
	label?:string;
	required?: boolean;
	disabled?: boolean;
	help?: string;
	labelStyle?: React.CSSProperties
}

export const TextArea: React.FC<Props> = ({
											  value="",
											  placeholder="",
											  style = {},
											  onChange,
											  label,
											  required=false,
											  disabled=false,
											  help,
											  labelStyle={}}) => {


	const [text, setText] = useState(value);

	useEffect(() => {
		setText(value);
	}, [value]);

	const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = event.target.value;
		if (onChange) {
			onChange(newValue);
		}
		setText(newValue);
	};

	return (
		<div className="blue-orange-text-area-input-cont" style={style}>
			{label &&
				<div className={"blue-orange-default-input-label-cont"} style={labelStyle}>
					{label}
					{help && <HelpIcon label={help}></HelpIcon>}
					{required && <RequiredIcon></RequiredIcon>}
				</div>
			}
			<textarea
				disabled={disabled}
				value={text}
				className="blue-orange-default-text-area"
				placeholder={placeholder}
				onChange={handleInputChange}
				style={style}>
			</textarea>
		</div>
	);
};