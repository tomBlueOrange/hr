import React, {ReactNode} from "react";

import './NumberText.css'

interface Props {
	value: number,
	decimalPlaces?: number,
	numberFormat?: string
}

export const NumberText: React.FC<Props> = ({value, decimalPlaces, numberFormat="en-AU"}) => {

	const formatNumber = () => {
		if (decimalPlaces) {
			return new Intl.NumberFormat(numberFormat, {
				minimumFractionDigits: decimalPlaces,
				maximumFractionDigits: decimalPlaces,
			}).format(value)
		}
		return new Intl.NumberFormat(numberFormat, {
		}).format(value)
	}

	const formattedNumber = formatNumber();

	return (
		<>{formattedNumber}</>
	)
}