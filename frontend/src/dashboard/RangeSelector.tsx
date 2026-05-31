import React from "react";
import {MetricsRange} from "../api/types";
import {Dropdown} from "../components/inputs/dropdown/basic/Dropdown";
import {DropdownItemText} from "../components/inputs/dropdown/items/DropdownItemText/DropdownItemText";
import {DropdownItemObj} from "../components/interfaces/AppInterfaces";

const RANGES: {value: MetricsRange; label: string}[] = [
    {value: "30m", label: "Last 30 minutes"},
    {value: "1h", label: "Last hour"},
    {value: "6h", label: "Last 6 hours"},
    {value: "12h", label: "Last 12 hours"},
    {value: "1d", label: "Last 24 hours"},
    {value: "7d", label: "Last 7 days"},
    {value: "30d", label: "Last 30 days"},
    {value: "1y", label: "Last year"},
    {value: "all", label: "All time"},
];

interface Props {
    value: MetricsRange;
    onChange: (range: MetricsRange) => void;
}

export const RangeSelector: React.FC<Props> = ({value, onChange}) => {
    // The Dropdown reports the selected child via its `reference` (the item's `value`).
    const handleSelection = (item: DropdownItemObj) => {
        const match = RANGES.find((r) => r.value === item.reference);
        if (match && match.value !== value) {
            onChange(match.value);
        }
    };

    return (
        <div className="hr-range-selector" aria-label="Time range">
            <Dropdown onSelection={handleSelection} contextMaxHeight={320}>
                {RANGES.map((r) => (
                    <DropdownItemText
                        key={r.value}
                        label={r.label}
                        value={r.value}
                        selected={r.value === value}
                    />
                ))}
            </Dropdown>
        </div>
    );
};
