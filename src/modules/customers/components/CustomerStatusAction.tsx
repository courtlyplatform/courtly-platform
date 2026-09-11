"use client";

import {
    useState,
} from "react";

import {
    ConfirmDialog,
} from "@/shared/ui/confirmDialog";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

type CustomerStatusActionProps = {
    customerId: string;

    customerName: string;

    active: boolean;

    action: (
        formData: FormData
    ) => void | Promise<void>;
};

export function CustomerStatusAction({
    customerId,
    customerName,
    active,
    action,
}: CustomerStatusActionProps) {
    const {
        dictionary,
    } = useI18n();

    const [
        dialogOpen,
        setDialogOpen,
    ] = useState(false);

    /*
     * Reactivate continues behaving exactly
     * as it did before.
     *
     * Only deactivation requires confirmation.
     */
    if (!active) {
        return (
            <form action={action}>
                <input
                    type="hidden"
                    name="customerId"
                    value={customerId}
                />

                <button
                    type="submit"
                    className="action-button"
                >
                    {
                        dictionary
                            .customers
                            .actions
                            .reactivate
                    }
                </button>
            </form>
        );
    }

    return (
        <>
            <button
                type="button"
                className="action-button"
                onClick={() =>
                    setDialogOpen(true)
                }
            >
                {
                    dictionary
                        .customers
                        .actions
                        .deactivate
                }
            </button>

            <ConfirmDialog
                open={dialogOpen}
                title={
                    dictionary
                        .customers
                        .confirmation
                        .deactivateTitle
                }
                description={
                    dictionary
                        .customers
                        .confirmation
                        .deactivateDescription.replace(
                            "{name}",
                            customerName
                        )
                }
                confirmLabel={
                    dictionary
                        .customers
                        .confirmation
                        .confirmDeactivate
                }
                cancelLabel={
                    dictionary
                        .common
                        .actions
                        .cancel
                }
                variant="danger"
                onCancel={() =>
                    setDialogOpen(false)
                }
                onConfirm={() => {
                    const formData =
                        new FormData();

                    formData.set(
                        "customerId",
                        customerId
                    );

                    void action(
                        formData
                    );

                    setDialogOpen(false);
                }}
            />
        </>
    );
}