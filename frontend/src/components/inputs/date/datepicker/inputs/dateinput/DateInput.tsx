import React, {useEffect, useRef, useState} from "react";

import * as chrono from 'chrono-node';
import './DateInput.css';
import {Input} from "../../../../input/Input";
import moment from 'moment';
import {DateContextWindowSingle, TimePrecision} from "../../items/datecontextwindowsingle/DateContextWindowSingle";


interface Props {
	value?: Date,
	displayFormat?: string,
	placeholder?: string,
	onChange?: (date: Date) => void;
	label?:string;
	required?: boolean;
	disabled?: boolean;
	help?: string;
	style?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
	showTime?: boolean,
	timePrecision?: TimePrecision
}

export const DateInput: React.FC<Props> = ({
											   value,
											   displayFormat = 'ddd, MMMM Do YYYY',
											   placeholder,
											   onChange,
											   label,
											   required=false,
											   disabled=false,
											   help,
											   style = {},
											   labelStyle={},
											   showTime=false,
											   timePrecision=TimePrecision.MINUTE}) => {

	const getFormattedDate = (date: Date | undefined, invalid: boolean) => {
		if (invalid) {
			return "Invalid Date";
		} else if (date == undefined) {
			return "";
		} else {
			return moment(date).format(displayFormat);
		}
	}

	const [inputValue, setInputValue] = useState(getFormattedDate(value, false));

	const [dateValue, setDateValue] = useState(value);

	const [showDateSelection, setShowDateSelection] = useState(false);

	const inputRef = useRef<HTMLInputElement | null>(null);

	const updateDate = (date: Date) => {
		setDateValue(date);
		if (onChange) {
			onChange(date);
		}
	}

	const validateInputDate = () => {
		var result = chrono.en.GB.parseDate(inputValue);
		if (result == null) {
			setInputValue(getFormattedDate(undefined, true));
		} else {
			setInputValue(getFormattedDate(result, false));
			updateDate(result);
		}
	}

	const focusOut = () => {
		setShowDateSelection(false);
		validateInputDate();
	}

	const focusIn = () => {
		setShowDateSelection(true);
	}

	const storeInputChange = (value: string) => {
		setInputValue(value);
	}

	const calculateLeftPosition = () => {
		try{
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			const clientWidth = rect.width;
			const clientLeft = rect.left;
			const width = 278;
			const offset = (width - clientWidth) / 2;
			return Math.max(0, clientLeft - offset);
		} catch (e) {
			return 0;
		}

	}

	const isPosAbove = () => {
		if (getClientTop() > window.innerHeight / 2) {
			return true;
		}
		return false;
	}

	const getClientTop = () => {
		try {
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			return rect.top;
		} catch (e) {
			return 0;
		}

	}

	const getClientBottom = () => {
		try {
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			return window.innerHeight - rect.bottom;
		} catch (e) {
			return 0;
		}

	}

	const getClientHeight = () => {
		try{
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			return rect.height;
		} catch (e) {
			return 0;
		}

	}

	const calculateContextWindowPos = () : React.CSSProperties => {
		return {
			left: calculateLeftPosition(),
			bottom: isPosAbove() ? getClientBottom() + getClientHeight() + 10 + "px" : "unset",
			top: !isPosAbove() ? getClientTop() + getClientHeight() + 20 + "px" : "unset",
		}
	}

	const onDateSelected = (date: Date) => {
		setInputValue(getFormattedDate(date, false));
		updateDate(date);
		setShowDateSelection(false)
	}

	const isDescendantOf = (parent:HTMLElement | null, child:HTMLElement | null) =>{
		if (parent && child) {
			if (parent === child) {
				return child
			}
			try{
				var node = child.parentElement;
				while (node != null){
					if (node === parent){
						return node;
					}
					node = node.parentElement;
				}
				return null;
			} catch (e) {
				return null;
			}
		}
		return null;
	}

	const handleMouseDown = (e:MouseEvent) => {
		const target = e.target as HTMLElement;
		if (inputRef && !isDescendantOf(inputRef.current, target)) {
			setShowDateSelection(false);
		} else if (inputRef && !isDescendantOf(inputRef.current, target) && !showDateSelection) {
			setShowDateSelection(true);
		}
	};

	const handleKeyDown = (e:KeyboardEvent) => {
		if (e.key == "Escape") {
			setShowDateSelection(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('keydown', handleKeyDown);
		}
	}, []);

	useEffect(() => {
		if (onChange && dateValue != undefined) {
			onChange(dateValue);
		}
	}, [dateValue]);

	return (
		<div ref={inputRef} style={{width: "100%"}}>
			<Input
				label={label}
				style={style}
				disabled={disabled}
				labelStyle={labelStyle}
				required={required}
				help={help}
				placeholder={placeholder}
				value={inputValue}
				onChange={storeInputChange}
				focusIn={focusIn}
				enterEvent={validateInputDate}></Input>
			{showDateSelection &&
				<DateContextWindowSingle
					style={calculateContextWindowPos()}
					selectedDate={dateValue}
					showTime={showTime}
					timePrecision={timePrecision}
					onSelection={onDateSelected}></DateContextWindowSingle>}
		</div>
	);
};