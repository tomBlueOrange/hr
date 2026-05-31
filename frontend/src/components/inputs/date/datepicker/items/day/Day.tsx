import React, {useRef, useState} from "react";

import './Day.css';
import {DatePickerMonth} from "../../../../../interfaces/AppInterfaces";


export interface DayObj {
	day: number,
	month: number,
	year: number,
	selected?: boolean,
	highlighted?: boolean,
	currentDay?: boolean,
	inActiveMonth?: boolean,
	hideInActiveMonth?: boolean
}

interface Props {
	day: DayObj,
	onClick?: (day: DayObj) => void,
	onMouseEnter?: (day: DayObj) => void,
	onMouseLeave?: (day: DayObj) => void,
}

export const Day: React.FC<Props> = ({
										 day,
										 onMouseEnter,
										 onMouseLeave,
										 onClick}) => {

	const generateClassname = () => {
		var classname = "blue-orange-date-picker-day";
		if (day.selected) {
			classname += " blue-orange-date-picker-day-selected"
		}
		if (day.highlighted) {
			classname += " blue-orange-date-picker-day-highlighted";
		}
		if (day.currentDay) {
			classname += " blue-orange-date-picker-day-current-day";
		}
		if (day.inActiveMonth) {
			classname += " blue-orange-date-picker-day-in-active";
		}
		if (day.hideInActiveMonth && day.inActiveMonth) {
			classname += " blue-orange-date-picker-day-hide-in-active";
		}
		return classname;
	}

	const mouseEnterFunction = () => {
		if (onMouseEnter) {
			onMouseEnter(day);
		}
	}

	const mouseLeaveFunction = () => {
		if (onMouseLeave) {
			onMouseLeave(day);
		}
	}

	const clickFunction = () => {
		if (onClick) {
			onClick(day);
		}
	}

	return (
		<td
			className={generateClassname()}
			onClick={clickFunction}
			onMouseLeave={mouseLeaveFunction}
			onMouseEnter={mouseEnterFunction}
		>{day.day}</td>
	);
};