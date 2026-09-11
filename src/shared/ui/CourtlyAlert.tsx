"use client";

import {
    useState,
} from "react";


type CourtlyAlertProps = {
    type:
        | "success"
        | "error";

    message: string;

    closeLabel?: string;
};


export function CourtlyAlert({
    type,
    message,
    closeLabel = "Close",
}: CourtlyAlertProps) {
    const [
        visible,
        setVisible,
    ] = useState(true);


    if (!visible) {
        return null;
    }


    return (
        <div
            className={
                `courtly-alert courtly-alert--${type}`
            }
            role={
                type === "error"
                    ? "alert"
                    : "status"
            }
        >
            <div className="courtly-alert__icon">
                {type === "success"
                    ? "✓"
                    : "!"}
            </div>

            <div className="courtly-alert__content">
                <strong>
                    {type === "success"
                        ? "✓"
                        : "!"}
                </strong>

                <span>
                    {message}
                </span>
            </div>

            <button
                type="button"
                className="courtly-alert__close"
                onClick={() =>
                    setVisible(false)
                }
                aria-label={
                    closeLabel
                }
            >
                ×
            </button>
        </div>
    );
}