import React, {useRef, useState} from "react";

import './Week.css';
import {DatePickerMonth} from "../../../../../interfaces/AppInterfaces";
import {Day, DayObj} from "../day/Day";


export interface WeekObj {
	days: Array<DayObj>
}

interface Props {
	week: WeekObj,
	onClick?: (day: DayObj) => void,
	onMouseEnter?: (day: DayObj) => void,
	onMouseLeave?: (day: DayObj) => void,
}

export const Week: React.FC<Props> = ({
										  week,
										  onClick,
										  onMouseEnter,
										  onMouseLeave}) => {


	return (
		<tr>
			{week.days.map((day, index) => (
				<Day
					key={index}
					day={day}
					onClick={onClick}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}></Day>
			))}
		</tr>
	);
};