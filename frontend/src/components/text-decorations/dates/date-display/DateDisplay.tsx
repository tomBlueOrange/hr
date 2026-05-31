import React from "react";
import moment from "moment";

interface Props {
    targetDate: string | Date;
    dateFormat?: string;
}

export const DateDisplay: React.FC<Props> = ({
                                                 targetDate,
                                                 dateFormat,
                                             }) => {

    const formatDate = (date: moment.Moment) => {
        if (dateFormat) {
            return date.format(dateFormat);
        }
        return date.format();
    };

    const renderTimeDisplay = () => {
        const target = moment(targetDate);
        return `${formatDate(target)}`;
    };

    return <>{renderTimeDisplay()}</>;
};
