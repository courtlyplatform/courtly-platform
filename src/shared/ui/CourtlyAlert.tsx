"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";

type CourtlyAlertProps = {
    type: "success" | "error";
    message: string;
    closeLabel?: string;
    autoDismissMs?: number;
    onClose?: () => void;
};

export function CourtlyAlert({
    type,
    message,
    closeLabel,
    autoDismissMs = 30_000,
    onClose,
}: CourtlyAlertProps) {
    const { dictionary } = useI18n();
    const resolvedCloseLabel = closeLabel ?? dictionary.accessibility.close;
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
        if (autoDismissMs <= 0) return;
        const timer = window.setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, autoDismissMs);
        return () => window.clearTimeout(timer);
    }, [message, type, autoDismissMs, onClose]);

    function close() {
        setVisible(false);
        onClose?.();
    }

    if (!visible) return null;

    return (
        <div className={`courtly-alert courtly-alert--${type}`} role={type === "error" ? "alert" : "status"}>
            <div className="courtly-alert__icon" aria-hidden="true">{type === "success" ? "✓" : "!"}</div>
            <div className="courtly-alert__content"><span>{message}</span></div>
            <button type="button" className="courtly-alert__close" onClick={close} aria-label={resolvedCloseLabel} title={resolvedCloseLabel}>×</button>
        </div>
    );
}
