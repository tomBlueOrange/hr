import React, {useEffect, useRef, useState} from "react";

import './MetricWithCopy.css'
import {ButtonIcon} from "../../buttons/button-icon/ButtonIcon";

interface Props {
	text: string;
	label?: string;
	copiedBtnStyle?: React.CSSProperties;
	copyBtnStyle?: React.CSSProperties;
	valueStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
}

export const MetricWithCopy: React.FC<Props> = ({
												text,
												label,
												copiedBtnStyle={backgroundColor: "#186A3B", color: "white"},
												copyBtnStyle={},
												valueStyle =  {},
												labelStyle = {}}) => {


	const [btnStyle, setBtnStyle] = useState(copyBtnStyle);

	const copyTextClicked = () => {
		navigator.clipboard.writeText(text).then(() => {
			setBtnStyle(copiedBtnStyle);
			setTimeout(() => {
				setBtnStyle(copyBtnStyle);
			}, 2000)
		})
	}

	return (
		<div className="blue-orange-metrics-with-copy">
			{label &&
				<div className="blue-orange-default-input-label-cont" style={labelStyle}>{label}</div>
			}
			<div className="blue-orange-metrics-with-copy-body">
				<div className="blue-orange-metrics-with-copy-value" style={valueStyle}>{text}</div>
				<ButtonIcon icon={"ri-file-copy-line"} style={btnStyle} onClick={copyTextClicked}></ButtonIcon>
			</div>
		</div>
	)
}
