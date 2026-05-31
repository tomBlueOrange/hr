import React, {useEffect, useRef, useState} from "react";

import './Input.css';
import {HelpIcon} from "../help/HelpIcon";
import {RequiredIcon} from "../required-icon/RequiredIcon";

interface Props {
	value?:string | null;
	label?:string;
	placeholder?: string;
	isEmail?: boolean;
	isNumber?: boolean;
	preventSpaces?:boolean;
	style?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
	isPassword?: boolean;
	isInvalid?: boolean;
	onChange?: (value: string) => void;
	focus?: boolean;
	disabled?: boolean;
	focusIn?: () => void;
	focusOut?: () => void;
	enterEvent?: () => void;
	required?: boolean;
	help?: string;
	validateKey?: (key: string) => boolean;
}

export const Input: React.FC<Props> = ({
										   value,
										   label,
										   placeholder="",
										   onChange,
										   isPassword,
										   isInvalid,
										   isEmail,
										   isNumber,
										   preventSpaces,
										   style={},
										   labelStyle={},
										   focus=false,
										   disabled=false,
										   focusIn,
										   focusOut,
	                                       enterEvent,
										   required=false,
									       help,
	                                       validateKey

}) => {

	const generateClassname = () => {
		var className = "blue-orange-input";
		if (isInvalid) {
			className += " blue-orange-input-invalid";
		}
		return className;
	}

	const [inputValue, setInputValue] = useState(value === undefined ? "" : value);

	const [inputClassName, setInputClassName] = useState(generateClassname());

	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleKeydownChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if ((preventSpaces || isEmail) && (event.key === "Space" || event.key === " ")) {
			event.preventDefault();
		} else if (validateKey && !validateKey(event.key)) {
			event.preventDefault();
		}
		if (event.key === "Enter" && enterEvent) {
			enterEvent();
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;
		setInputValue(newValue);
		if (onChange) {
			onChange(newValue);
		}
	};

	const generateType = () => {
		if (isPassword) {
			return "password"
		} else if (isEmail) {
			return "email"
		} else if (isNumber) {
			return "number"
		}
		return "text";
	}

	const focusInEvent = () => {
		if (focusIn) {
			focusIn();
		}
	}

	const focusOutEvent = () => {
		if (focusOut) {
			focusOut();
		}
	}

	useEffect(() => {
		if (focus) {
			inputRef.current?.focus();
		}
	}, [focus]);

	useEffect(() => {
		setInputClassName(generateClassname())
	}, [isInvalid]);

	useEffect(() => {
		setInputValue(value === undefined ? "" : value);
	}, [value]);

	return (
		<div className="blue-orange-default-input-cont">
			{label &&
				<div className={"blue-orange-default-input-label-cont"} style={labelStyle}>
					{label}
					{help && <HelpIcon label={help}></HelpIcon>}
					{required && <RequiredIcon></RequiredIcon>}
				</div>
			}
			<input
				ref={inputRef}
				className={inputClassName}
				style={style}
				placeholder={placeholder}
				value={inputValue === undefined || inputValue == null ? "" : inputValue}
				onKeyDown={handleKeydownChange}
				onChange={handleInputChange}
				onFocus={focusInEvent}
				onBlur={focusOutEvent}
				type={generateType()}
				disabled={disabled}
			/>
		</div>

	);
};