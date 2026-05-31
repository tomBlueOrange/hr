import React, {useEffect, useRef, useState} from "react";
import tippy from "tippy.js";
import {TippyHTMLElement} from "../../interfaces/AppInterfaces";

import './SimpleMetric.css'

interface Props {
	text: string;
	onClick?: () => void;
	style?: React.CSSProperties;
	className?: string;
}

export const SimpleMetric: React.FC<Props> = ({
												text,
												onClick,
												style,
												className}) => {

	const generateClassname = (name: string | undefined) => {
		const base = "blue-orange-simple-metric no-select"
		if (name) {
			return base + " " + name;
		}
		return base;
	}

	const btnRef = useRef<HTMLDivElement | null>(null);

	const [classname, setClassname] = useState(generateClassname(className));

	useEffect(() => {
		setClassname(generateClassname(className))
	}, [className]);

	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	const setStyle = () => {
		return style
	}

	return (
		<div ref={btnRef} className={classname} onClick={handleClick} style={setStyle()}>{text}</div>
	)
}
