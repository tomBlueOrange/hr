import React, {useEffect, useRef, useState} from "react";
import tippy from "tippy.js";

import './HelpIcon.css'
import {TippyHTMLElement} from "../../interfaces/AppInterfaces";

interface Props {
	label: string,
	style?: React.CSSProperties
}

export const HelpIcon: React.FC<Props> = ({
												label,
										  style={}}) => {

	const helpIconRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (label) {
			const current = helpIconRef.current as TippyHTMLElement;
			if (current) {
				tippy(current, {
					content: label,
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

	return (
		<div ref={helpIconRef} className={"blue-orange-default-help-icon"} style={style}>
			<i className="ri-question-fill"></i>
		</div>
	)
}