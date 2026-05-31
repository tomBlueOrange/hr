import React, {ReactNode} from "react";

import './JsonObjectText.css'

interface Props {
	obj: any,
	prettyPrint?: boolean
}

export const JsonObjectText: React.FC<Props> = ({obj, prettyPrint=false}) => {

	const formatObj = () => {
		if (prettyPrint) {
			return JSON.stringify(obj, null, 2);
		}
		return JSON.stringify(obj);
	}

	const formattedText = formatObj();

	return (
		<span className={prettyPrint ? "blue-orange-render-json-object-pretty" : "blue-orange-render-json-object-single-line"}>{formattedText}</span>
	)
}