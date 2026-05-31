import React, {useEffect, useRef, useState} from "react";

import './DateContextWindowSingle.css';
import {Month} from "../month/Month";
import 'animate.css';

export enum TimePrecision {
	MINUTE,
	SECOND,
	MILLISECOND
}

interface Props {
	selectedDate?: Date,
	style: React.CSSProperties,
	showTime?: boolean,
	timePrecision?: TimePrecision,
	onSelection: (date: Date) => void;
}

export const DateContextWindowSingle: React.FC<Props> = ({selectedDate, style, showTime=true,timePrecision=TimePrecision.MINUTE, onSelection}) => {

	const padMinutesAndSeconds = (inputValue: string) => {
		if (+inputValue >= 0 && +inputValue <= 59) {
			if (inputValue.length < 2) {
				inputValue = inputValue.padStart(2, '0');
			}
			return inputValue;
		} else {
			return "00";
		}
	}

	const padMilliseconds = (inputValue: string) => {
		if (+inputValue >= 0 && +inputValue <= 999) {
			if (inputValue.length < 3) {
				inputValue = inputValue.padStart(3, '0');
			}
			return inputValue;
		} else {
			return "000";
		}
	}

	const [hourValueEdit, setHourValueEdit] = useState(selectedDate == undefined ? "0" : selectedDate.getHours().toString());

	const [hourValue, setHourValue] = useState(selectedDate == undefined ? 0 : selectedDate.getHours());

	const [minuteValueEdit, setMinuteValueEdit] = useState(selectedDate == undefined ? "00" : padMinutesAndSeconds(selectedDate.getMinutes().toString()));

	const [minuteValue, setMinuteValue] = useState(selectedDate == undefined ? 0 : selectedDate.getMinutes());

	const [secondValueEdit, setSecondValueEdit] = useState(selectedDate == undefined ? "00" : padMinutesAndSeconds(selectedDate.getSeconds().toString()));

	const [secondValue, setSecondValue] = useState(selectedDate == undefined ? 0 : selectedDate.getSeconds());

	const [millisecondValueEdit, setMillisecondValueEdit] = useState(selectedDate == undefined ? "000" : padMilliseconds(selectedDate.getMilliseconds().toString()));

	const [millisecondValue, setMillisecondValue] = useState(selectedDate == undefined ? 0 : selectedDate.getMilliseconds());

	const handleHourChange = (event:React.ChangeEvent<HTMLInputElement>) => {
		let inputValue = event.target.value;
		setHourValueEdit(inputValue);
	};

	const handleHourBlur = (event:React.ChangeEvent<HTMLInputElement>) => {
		let inputValue = event.target.value;
		if (+inputValue >= 0 && +inputValue < 24) {
			setHourValue(+inputValue);
		} else {
			setHourValue(0);
		}
	};

	const handleMinuteChange = (event:React.ChangeEvent<HTMLInputElement>) => {
		let inputValue = event.target.value;
		setMinuteValueEdit(inputValue);
	};



	const handleMinuteBlur = (event:any) => {
		let inputValue = event.target.value;
		setMinuteValueEdit(padMinutesAndSeconds(inputValue));
		if (inputValue >= 0 && inputValue <= 59) {
			setMinuteValue(+inputValue);
		} else {
			setMinuteValue(0);
		}
	};

	const handleSecondChange = (event:React.ChangeEvent<HTMLInputElement>) => {
		let inputValue = event.target.value;
		setSecondValueEdit(inputValue);
	};

	const handleSecondBlur = (event:any) => {
		let inputValue = event.target.value;
		setSecondValueEdit(padMinutesAndSeconds(inputValue));
		if (+inputValue >= 0 && +inputValue <= 59) {
			setSecondValue(+inputValue);
		} else {
			setSecondValue(0);
		}
	};

	const handleMillisecondChange = (event:React.ChangeEvent<HTMLInputElement>) => {
		let inputValue = event.target.value;
		setMillisecondValueEdit(inputValue);
	};

	const handleMillisecondBlur = (event:any) => {
		let inputValue = event.target.value;
		setMillisecondValueEdit(padMilliseconds(inputValue));
		if (+inputValue >= 0 && +inputValue <= 999) {
			setMillisecondValue(inputValue);
		} else {
			setMillisecondValue(0);
		}
	};

	const handleEnterEventHour = (event:any) => {
		if (selectedDate) {
			let inputValue = event.target.value;
			var hourVal = 0;
			if (+inputValue >= 0 && +inputValue < 24) {
				hourVal = +inputValue;
			}
			selectedDate.setHours(hourVal, minuteValue, secondValue, millisecondValue);
			if (onSelection) {
				onSelection(selectedDate)
			}
		}
	};

	const handleEnterEventMinute = (event:any) => {
		if (selectedDate) {
			let inputValue = event.target.value;
			var minuteVal = 0;
			if (+inputValue >= 0 && +inputValue <= 59) {
				minuteVal = +inputValue;
			}
			selectedDate.setHours(hourValue, minuteVal, secondValue, millisecondValue);
			if (onSelection) {
				onSelection(selectedDate)
			}
		}
	};

	const handleEnterEventSecond = (event:any) => {
		if (selectedDate) {
			let inputValue = event.target.value;
			var secondVal = 0;
			if (+inputValue >= 0 && +inputValue <= 59) {
				secondVal = +inputValue;
			}
			selectedDate.setHours(hourValue, minuteValue, secondVal, millisecondValue);
			if (onSelection) {
				onSelection(selectedDate)
			}
		}
	};

	const handleEnterEventMillisecond = (event:any) => {
		if (selectedDate) {
			let inputValue = event.target.value;
			var millisecondVal = 0;
			if (+inputValue >= 0 && +inputValue <= 999) {
				millisecondVal = +inputValue;
			}
			selectedDate.setHours(hourValue, minuteValue, secondValue, millisecondVal);
			if (onSelection) {
				onSelection(selectedDate)
			}
		}
	};

	useEffect(() => {
		setHourValueEdit(selectedDate == undefined ? "0" : selectedDate.getHours().toString());
		setHourValue(selectedDate == undefined ? 0 : selectedDate.getHours());
		setMinuteValueEdit(selectedDate == undefined ? "00" : padMinutesAndSeconds(selectedDate.getMinutes().toString()));
		setMinuteValue(selectedDate == undefined ? 0 : selectedDate.getMinutes());
		setSecondValueEdit(selectedDate == undefined ? "00" : padMinutesAndSeconds(selectedDate.getSeconds().toString()));
		setSecondValue(selectedDate == undefined ? 0 : selectedDate.getSeconds());
		setMillisecondValueEdit(selectedDate == undefined ? "000" : padMilliseconds(selectedDate.getMilliseconds().toString()));
		setMillisecondValue(selectedDate == undefined ? 0 : selectedDate.getMilliseconds());
	}, [selectedDate]);

	return (
		<div className="blue-orange-date-picker-context-window-single animate__fadeIn" style={style}>
			<Month
				date={selectedDate}
				onSelection={onSelection}
				showTime={showTime}
				hour={hourValue}
				minute={minuteValue}
				second={secondValue}
				millisecond={millisecondValue}></Month>
			{showTime &&
				<div className="blue-orange-date-picker-context-time-input-group-cont">
					<div className="blue-orange-date-picker-context-time-input-group">
						<input
							aria-label="hours (24hr clock)"
							className="blue-orange-date-picker-time-input"
							min="0"
							max="23"
							type="number"
							value={hourValueEdit}
							onKeyDown={(event) => {
								if (event.key == "Enter") {
									handleEnterEventHour(event)
								}
							}}
							onChange={handleHourChange}
							onBlur={handleHourBlur}/>
						<span>:</span>
						<input
							aria-label="minutes"
							className="blue-orange-date-picker-time-input" min="0"
							max="59"
							type="number"
							value={minuteValueEdit}
							onChange={handleMinuteChange}
							onKeyDown={(event) => {
								if (event.key == "Enter") {
									handleEnterEventMinute(event)
								}
							}}
							onBlur={handleMinuteBlur}
						/>
						<span>:</span>
						{(timePrecision == TimePrecision.SECOND || timePrecision == TimePrecision.MILLISECOND) &&
							<>
								<input
									aria-label="seconds"
									className="blue-orange-date-picker-time-input"
									min="0"
									max="59"
									type="number"
									value={secondValueEdit}
									onChange={handleSecondChange}
									onKeyDown={(event) => {
										if (event.key == "Enter") {
											handleEnterEventSecond(event)
										}
									}}
									onBlur={handleSecondBlur}/>
							</>
						}
						{timePrecision == TimePrecision.MILLISECOND &&
							<>
								<span>.</span>
								<input
									aria-label="seconds"
									className="blue-orange-date-picker-time-input"
									min="0"
									max="999"
									type="number"
									value={millisecondValueEdit}
									onChange={handleMillisecondChange}
									onKeyDown={(event) => {
										if (event.key == "Enter") {
											handleEnterEventMillisecond(event)
										}
									}}
									onBlur={handleMillisecondBlur}/>
							</>
						}
					</div>
				</div>
			}
		</div>
	);
};