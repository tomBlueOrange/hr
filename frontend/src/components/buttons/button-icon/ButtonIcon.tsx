import React, {useEffect, useRef, useState} from "react";
import tippy from "tippy.js";
import {TippyHTMLElement} from "../../interfaces/AppInterfaces";

import 'tippy.js/dist/tippy.css';
import './ButtonIcon.css'

interface Props {
	icon: string;
	label?: string;
	isDisabled?: boolean;
	onClick?: () => void;
	style?: React.CSSProperties;
	className?: string;
}

export const ButtonIcon: React.FC<Props> = ({
												icon,
												label,
												onClick,
												isDisabled,
												style,
												className}) => {

	const generateClassname = (name: string | undefined) => {
		const base = "blue-orange-default-btn-icon no-select"
		if (name) {
			return base + " " + name;
		}
		return base;
	}

	const btnRef = useRef<HTMLDivElement | null>(null);

	const [classname, setClassname] = useState(generateClassname(className));

	useEffect(() => {
		if (label) {
			const current = btnRef.current as TippyHTMLElement;
			if (current) {
				tippy(current, {
					content: label,
					zIndex: 99999999999999,
				});

				return () => {
					const tippyInstance = current._tippy;
					if (tippyInstance) {
						tippyInstance.destroy();
					}
				};
			}
		}
	}, []);

	useEffect(() => {
		setClassname(generateClassname(className))
	}, [className]);

	const handleClick = () => {
		if (!isDisabled && onClick) {
			onClick();
		}
	};

	const setStyle = () => {
		var st: React.CSSProperties = {
			cursor: isDisabled ? "not-allowed" : "pointer"
		}
		if (style) {
			st = {...style};
		}
		return st
	}

	return (
		<div ref={btnRef} className={classname} onClick={handleClick} style={setStyle()}>
			<i className={icon}></i>
		</div>
	)
}
