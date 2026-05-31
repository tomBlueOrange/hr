import React from "react";
import "./TruncatedTextWrapper.css"; // Import CSS for static styles

interface Props {
    children: React.ReactNode;
    maxLines: number;
    lineHeight?: number; // Optional customization for line height
}

export const TruncatedTextWrapper: React.FC<Props> = ({ children, maxLines, lineHeight = 1.5 }) => {
    return (
        <div
            className="blue-orange-truncated-text"
            style={{
                WebkitLineClamp: maxLines,
                maxHeight: `${maxLines * lineHeight}em`,
                lineHeight: `${lineHeight}em`,
            }}>
            {children}
        </div>
    );
};