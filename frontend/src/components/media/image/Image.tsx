import React, {ReactNode} from "react";

import './Image.css'

interface Props {
	src: string,
	height?: number,
	width?: number,
	alt: string,
	borderRadius?: string,
	fit?: string,
	shadow?: boolean,
	loading?: boolean,
}
export const Image: React.FC<Props> = ({
										   	src,
										   	height,
										   	width,
										   	alt,
										   borderRadius,
										   	fit,
											shadow,
										   loading
									   }) => {

	const generateObjectFit = () => {
		if (fit == undefined) {
			return 'unset';
		} else if (fit.toLowerCase() == 'cover') {
			return 'cover';
		} else if (fit.toLowerCase() == 'contain') {
			return 'contain';
		} else if (fit.toLowerCase() == 'fill') {
			return 'fill';
		}
		return 'unset';
	}

	const imageStyle: React.CSSProperties = {
		objectFit: generateObjectFit(),
		width: "100%",
		height: "100%"
	}

	const containerStyle: React.CSSProperties = {
		width: width == undefined ? "unset" : width,
		height: height == undefined ? "unset" : height,
		borderRadius: borderRadius,
	}

	const generateClassName = () => {
		if (shadow) {
			return 'blue-orange-image shadow'
		}
		return 'blue-orange-image'
	}

	return (
		<div className={generateClassName()} style={containerStyle}>
			<img src={src} alt={alt} style={imageStyle}/>
		</div>
	)
}