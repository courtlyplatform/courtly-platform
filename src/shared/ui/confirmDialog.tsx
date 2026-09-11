"use client";

import {
    useEffect,
    useRef,
} from "react";

type ConfirmDialogProps = {
    open: boolean;

    title: string;

    description: string;

    confirmLabel: string;

    cancelLabel: string;

    variant?: "default" | "danger";

    onConfirm: () => void;

    onCancel: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (event.key === "Escape") {
                onCancel();
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [open, onCancel]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="confirm-dialog-overlay"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onCancel();
                }
            }}
        >
            <div
                ref={dialogRef}
                className="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
            >
                <div
                    className={
                        variant === "danger"
                            ? "confirm-dialog-icon confirm-dialog-icon--danger"
                            : "confirm-dialog-icon"
                    }
                    aria-hidden="true"
                >
                    !
                </div>

                <div className="confirm-dialog-content">
                    <h2 id="confirm-dialog-title">
                        {title}
                    </h2>

                    <p id="confirm-dialog-description">
                        {description}
                    </p>
                </div>

                <div className="confirm-dialog-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                        autoFocus
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        className={
                            variant === "danger"
                                ? "danger-button"
                                : "primary-button"
                        }
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}