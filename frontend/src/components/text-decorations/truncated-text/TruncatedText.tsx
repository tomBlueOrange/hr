import React from "react";
import "./TruncatedText.css"; // Import CSS for static styles

interface Props {
    text: string;
    maxLines: number;
    lineHeight?: number; // Optional customization for line height
}

export const TruncatedText: React.FC<Props> = ({ text, maxLines, lineHeight = 1.5 }) => {
    return (
        <div
            className="blue-orange-truncated-text"
            style={{
                WebkitLineClamp: maxLines,
                maxHeight: `${maxLines * lineHeight}em`,
                lineHeight: `${lineHeight}em`,
            }}
            title={text}
        >
            {text}
        </div>
    );
};