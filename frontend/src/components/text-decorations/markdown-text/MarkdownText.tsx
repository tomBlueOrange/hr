import React, {useEffect, useState, useRef} from "react";
import hljs from "highlight.js";
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

import './MarkdownText.css';
import 'highlight.js/styles/atom-one-dark.css';

interface Props {
	children: string;
	enableMath?: boolean;
	enableGfm?: boolean;
	enableCodeHighlighting?: boolean;
	className?: string;
}

export const MarkdownText: React.FC<Props> = ({
	children,
	enableMath = true,
	enableGfm = true,
	enableCodeHighlighting = true,
	className = ""
}) => {
	const [renderedContent, setRenderedContent] = useState<string>("");
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const renderMarkdown = async () => {
			let processor: any = unified().use(remarkParse);

			if (enableGfm) {
				processor = processor.use(remarkGfm);
			}
			if (enableMath) {
				processor = processor.use(remarkMath);
			}

			processor = processor.use(remarkRehype);

			if (enableMath) {
				processor = processor.use(rehypeKatex);
			}

			processor = processor.use(rehypeStringify);

			const result = await processor.process(children);
			setRenderedContent(String(result));
		};

		renderMarkdown();
	}, [children, enableMath, enableGfm]);

	useEffect(() => {
		if (enableCodeHighlighting && renderedContent && containerRef.current) {
			const codeBlocks = containerRef.current.querySelectorAll('pre code');
			codeBlocks.forEach((block) => {
				hljs.highlightElement(block as HTMLElement);
			});
		}
	}, [renderedContent, enableCodeHighlighting]);

	return (
		<div
			ref={containerRef}
			className={`blue-orange-markdown-text ${className}`.trim()}
			dangerouslySetInnerHTML={{__html: renderedContent}}
		/>
	);
};
