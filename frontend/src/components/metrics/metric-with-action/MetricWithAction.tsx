import React, {useEffect, useRef, useState} from "react";

import './MetricWithAction.css'
import {ButtonIcon} from "../../buttons/button-icon/ButtonIcon";

interface Props {
	text: string;
	icon: string;
	label?: string;
	actionBtnStyle?: React.CSSProperties;
	valueStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
	onClick?: () => void;
}

export const MetricWithAction: React.FC<Props> = ({
												text,
												icon,
												label,
											    actionBtnStyle={},
												valueStyle =  {},
												labelStyle = {},
											    onClick}) => {


	const [btnStyle, setBtnStyle] = useState(actionBtnStyle);

	const handleClickEvent = () => {
		if (onClick) {
			onClick()
		}
	}

	return (
		<div className="blue-orange-metrics-with-action">
			{label &&
				<div className="blue-orange-default-input-label-cont" style={labelStyle}>{label}</div>
			}
			<div className="blue-orange-metrics-with-action-body">
				<div className="blue-orange-metrics-with-action-value" style={valueStyle}>{text}</div>
				<ButtonIcon icon={icon} style={btnStyle} onClick={handleClickEvent}></ButtonIcon>
			</div>
		</div>
	)
}
