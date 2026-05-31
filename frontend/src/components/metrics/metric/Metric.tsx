import React, {useEffect, useRef, useState} from "react";

import './Metric.css'

interface Props {
	text: string;
	label?: string;
	valueStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
}

export const Metric: React.FC<Props> = ({
												text,
												label,
												valueStyle =  {},
												labelStyle = {}}) => {


	return (
		<div className="blue-orange-metrics">
			{label &&
				<div className="blue-orange-default-input-label-cont" style={labelStyle}>{label}</div>
			}
			<div className="blue-orange-metrics-body">
				<div className="blue-orange-metrics-value" style={valueStyle}>{text}</div>
			</div>
		</div>
	)
}
