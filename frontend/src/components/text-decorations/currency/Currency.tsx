import React, {ReactNode} from "react";

import './Currency.css'

interface Props {
	amount: number,
	currency: string;
	numberFormat?: string;
}

export const Currency: React.FC<Props> = ({amount, currency, numberFormat="en-AU"}) => {

	const formatNumber = () => {
		return new Intl.NumberFormat(numberFormat, {
			style: 'currency',
			currency: currency,
		}).format(amount)
	}

	const formattedNumber = formatNumber();

	return (
		<>{formattedNumber}</>
	)
}