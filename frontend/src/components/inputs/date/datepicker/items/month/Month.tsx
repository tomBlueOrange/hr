import React, {ChangeEvent, ReactEventHandler, useEffect, useRef, useState} from "react";

import './Month.css';
import {DatePickerMonth} from "../../../../../interfaces/AppInterfaces";
import {DayObj} from "../day/Day";
import {Week, WeekObj} from "../week/Week";
import {ButtonIcon} from "../../../../../buttons/button-icon/ButtonIcon";

interface Props {
	date?: Date,
	hideInActiveMonths?: boolean,
	minStartingYear?: number,
	maxStartingYear?: number,
	sundayStart?: boolean,
	showHeader?: boolean,
	showTime?: boolean,
	hour?: number,
	minute?: number,
	second?: number,
	millisecond?: number,
	onSelection?: (date: Date) => void
}

export const Month: React.FC<Props> = ({
										   date,
										   hideInActiveMonths = false,
										   minStartingYear=1900,
										   maxStartingYear=2200,
										   sundayStart  = false,
										   showHeader = true,
										   showTime = true,
										   hour = 0,
										   minute = 0,
										   second = 0,
										   millisecond = 0,
										   onSelection}) => {

	const todayDate = new Date();

	const generateYearSelection = () => {
		const possibleYears = []
		for (var i= minStartingYear; i < maxStartingYear; i++) {
			possibleYears.push(i);
		}
		return possibleYears;
	}

	const [selectedDate, setSelectedDate] = useState(date);

	const [currentMonth, setCurrentMonth] = useState(selectedDate ? selectedDate.getMonth() : todayDate.getMonth());

	const [currentYear, setCurrentYear] = useState(selectedDate ? selectedDate.getFullYear() : todayDate.getFullYear());

	const [yearSelection, setYearSelection] = useState(generateYearSelection());

	const selectedHour = useRef<number>(hour);

	const selectedMinute = useRef<number>(minute);

	const selectedSecond = useRef<number>(second);

	const selectedMillisecond = useRef<number>(millisecond);

	const generateDaysInMonth = (year: number, month: number): Array<WeekObj> => {
		const daysInMonth: Array<WeekObj> = [];
		const realDate = new Date();
		const firstDayOfMonth = new Date(year, month, 1);
		const realMonth = new Date(year, month, 1)
		const lastDayOfMonth = new Date(year, month + 1, 0);
		const startDay = new Date(firstDayOfMonth);
		if (sundayStart) {
			startDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
		} else {
			startDay.setDate(firstDayOfMonth.getDate() - (firstDayOfMonth.getDay() - 1));
		}
		const endDay = new Date(lastDayOfMonth);
		endDay.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
		let currentDay = new Date(startDay);
		while (currentDay <= endDay) {
			const week: DayObj[] = [];
			for (let i = 0; i < 7; i++) {
				week.push({
					day: currentDay.getDate(),
					month: currentDay.getMonth(),
					year: currentDay.getFullYear(),
					hideInActiveMonth: hideInActiveMonths,
					selected: selectedDate ? currentDay.getDate() == selectedDate.getDate() &&
						currentDay.getMonth() == selectedDate.getMonth() &&
						currentDay.getFullYear() == selectedDate.getFullYear() : false,
					currentDay: currentDay.getDate() == realDate.getDate() &&
						currentDay.getMonth() == realDate.getMonth() &&
						currentDay.getFullYear() == realDate.getFullYear(),
					inActiveMonth: realMonth.getMonth() != currentDay.getMonth()
				});
				currentDay.setDate(currentDay.getDate() + 1);
			}
			daysInMonth.push({days: week});
		}
		return daysInMonth;
	}

	const [daysInMonth, setDaysInMonth] = useState(generateDaysInMonth(
		selectedDate ? selectedDate.getFullYear() : todayDate.getFullYear(),
		selectedDate ? selectedDate.getMonth() : todayDate.getMonth()));

	const onDaySelected = (day: DayObj) => {
		const date = new Date(
			day.year,
			day.month,
			day.day,
			selectedHour.current,
			selectedMinute.current,
			selectedSecond.current,
			selectedMillisecond.current);
		if (onSelection) {
			onSelection(date)
		}
		setSelectedDate(date);
	}

	useEffect(() => {
		setDaysInMonth(generateDaysInMonth(
			selectedDate ? selectedDate.getFullYear() : todayDate.getFullYear(),
			selectedDate ? selectedDate.getMonth() : todayDate.getMonth()))
	}, [selectedDate]);

	useEffect(() => {
		setDaysInMonth(generateDaysInMonth(
			date ? date.getFullYear() : todayDate.getFullYear(),
			date ? date.getMonth() : todayDate.getMonth()));
		setSelectedDate(date);
	}, [date]);

	const btnStyle: React.CSSProperties = {
		height: "28px",
		width: "28px"
	}

	const clickPreviousMonth = () => {
		if (currentMonth - 1 < 0) {
			setDaysInMonth(generateDaysInMonth(currentYear - 1, 12))
			setCurrentMonth(12);
			setCurrentYear(currentYear - 1);
		} else {
			setDaysInMonth(generateDaysInMonth(currentYear, currentMonth - 1));
			setCurrentMonth(currentMonth - 1);
		}
	}

	const clickNextMonth = () => {
		if (currentMonth + 1 > 11) {
			setDaysInMonth(generateDaysInMonth(currentYear + 1, 1))
			setCurrentMonth(1);
			setCurrentYear(currentYear + 1);
		} else {
			setDaysInMonth(generateDaysInMonth(currentYear, currentMonth + 1));
			setCurrentMonth(currentMonth + 1);
		}
	}

	const changeMonth = (event: ChangeEvent<HTMLSelectElement>) => {
		setDaysInMonth(generateDaysInMonth(currentYear, +event.target.value));
		setCurrentMonth(+event.target.value)
	}

	const changeYear = (event: ChangeEvent<HTMLSelectElement>) => {
		setDaysInMonth(generateDaysInMonth(+event.target.value, currentMonth));
		setCurrentYear(+event.target.value)
	}

	useEffect(() => {
		selectedHour.current = hour;
	}, [hour]);

	useEffect(() => {
		selectedMinute.current = minute;
	}, [minute]);

	useEffect(() => {
		selectedSecond.current = second;
	}, [second]);

	useEffect(() => {
		selectedMillisecond.current = millisecond;
	}, [millisecond]);


	return (
		<div className="blue-orange-date-picker-cont">
			{showHeader &&
				<div className="blue-orange-date-picker-header">
					<ButtonIcon icon={"ri-arrow-left-s-line"} style={btnStyle} onClick={clickPreviousMonth}></ButtonIcon>
					<div className="blue-orange-date-picker-month-heading-text-group">
						<div className="blue-orange-date-picker-month-heading">
							{currentMonth == 0 && "January"}
							{currentMonth == 1 && "February"}
							{currentMonth == 2 && "March"}
							{currentMonth == 3 && "April"}
							{currentMonth == 4 && "May"}
							{currentMonth == 5 && "June"}
							{currentMonth == 6 && "July"}
							{currentMonth == 7 && "August"}
							{currentMonth == 8 && "September"}
							{currentMonth == 9 && "October"}
							{currentMonth == 10 && "November"}
							{currentMonth == 11 && "December"}
							<select className="blue-orange-date-picker-header-select" value={currentMonth} onChange={changeMonth}>
								<option value={0}>January</option>
								<option value={1}>February</option>
								<option value={2}>March</option>
								<option value={3}>April</option>
								<option value={4}>May</option>
								<option value={5}>June</option>
								<option value={6}>July</option>
								<option value={7}>August</option>
								<option value={8}>September</option>
								<option value={9}>October</option>
								<option value={10}>November</option>
								<option value={11}>December</option>
							</select>
						</div>
						<div className="blue-orange-date-picker-year-heading">
							{currentYear}
							<select className="blue-orange-date-picker-header-select" value={currentYear} onChange={changeYear}>
								{yearSelection.map((item, index) => (
									<option key={index} value={item}>{item}</option>
								))}
							</select>
						</div>
					</div>
					<ButtonIcon icon={"ri-arrow-right-s-line"} style={btnStyle} onClick={clickNextMonth}></ButtonIcon>
				</div>
			}
			<table className="blue-orange-date-picker">
				<thead>
				{sundayStart &&
					<tr>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Sunday">Su</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Monday">Mo</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Tuesday">Tu</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Wednesday">We</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Thursday">Th</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Friday">Fr</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Sat">Sa</th>
					</tr>
				}
				{!sundayStart &&
					<tr>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Monday">Mo</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Tuesday">Tu</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Wednesday">We</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Thursday">Th</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Friday">Fr</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Sat">Sa</th>
						<th scope="col" className="blue-orange-date-picker-day-heading" aria-label="Sunday">Su</th>
					</tr>
				}
				</thead>
				<tbody>
				{daysInMonth.map((week, index) => (
					<Week key={index} week={week} onClick={onDaySelected}></Week>
				))}
				</tbody>
			</table>
		</div>
	);
};