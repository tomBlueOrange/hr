import React, {useEffect, useRef, useState} from "react";

import './MetricCard.css'


export enum MetricLabelPosition{
	TOP,
	BOTTOM
}

interface Props {
	text: string;
	label?: string;
	labelPosition?: MetricLabelPosition;
	icon?: string;
	style?: React.CSSProperties;
	iconStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
	valueStyle?: React.CSSProperties;
	onClick?: () => void;
}

export const MetricCard: React.FC<Props> = ({
												text,
												label,
												labelPosition=MetricLabelPosition.TOP,
												icon,
												style = {},
												iconStyle = {},
												labelStyle = {},
												valueStyle = {},
												onClick
											}) => {

	const defaultCopyStyle: React.CSSProperties = {}

	const defaultCopiedStyle: React.CSSProperties = {
		backgroundColor: "#186A3B",
		color: "white"
	}

	const metricCardClicked = () => {
		if (onClick) {
			onClick();
		}
	}

	return (
		<div className="blue-orange-metrics-card" style={style} onClick={metricCardClicked}>
			{icon &&
				<div className="blue-orange-metrics-card-icon" style={iconStyle}>
					<i className={icon}></i>
				</div>
			}
			<div className="blue-orange-metrics-card-body">
				{label && labelPosition == MetricLabelPosition.TOP &&
					<div className="blue-orange-metrics-card-body-title blue-orange-metrics-card-body-title-top" style={labelStyle}>{label}</div>
				}
				<div className="blue-orange-metrics-card-value" style={valueStyle}>{text}</div>
				{label && labelPosition == MetricLabelPosition.BOTTOM &&
					<div className="blue-orange-metrics-card-body-title blue-orange-metrics-card-body-title-bottom" style={labelStyle}>{label}</div>
				}
			</div>
		</div>
	)
}
