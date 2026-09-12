"use client";

import {
    useState,
} from "react";

import Link from "next/link";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    DOCUMENT_TYPE_OPTIONS,
    isDocumentType,
    type DocumentType,
} from "@/modules/customers/documents/documentTypes";

import {
    formatDocument,
    getDocumentMaxLength,
    getDocumentPlaceholder,
} from "@/modules/customers/documents/documentFormatter";

type CustomerFormValues = {
    name?: string | null;

    document_type?:
        string | null;

    document_number?:
        string | null;

    email?: string | null;

    phone?: string | null;

    birth_date?:
        string | null;

    notes?: string | null;
};

type CustomerFormProps = {
    action: (
        formData: FormData
    ) => void | Promise<void>;

    customer?:
        CustomerFormValues;

    mode?:
        "create" | "edit";

    returnTo?: string | null;
};

function onlyPhoneDigits(
    value: string
): string {
    return value
        .replace(/\D/g, "")
        .slice(0, 15);
}

export function CustomerForm({
    action,
    customer,
    mode = "create",
    returnTo = null,
}: CustomerFormProps) {
    const {
        dictionary,
    } = useI18n();

    const t =
        dictionary.customers.form;

    const initialDocumentType:
        DocumentType =
        customer?.document_type &&
        isDocumentType(
            customer.document_type
        )
            ? customer.document_type
            : "CPF";

    const [
        documentType,
        setDocumentType,
    ] = useState<DocumentType>(
        initialDocumentType
    );

    const [
        documentNumber,
        setDocumentNumber,
    ] = useState(
        customer?.document_number
            ? formatDocument(
                  initialDocumentType,
                  customer.document_number
              )
            : ""
    );

    const isEditing =
        mode === "edit";

    function handleDocumentTypeChange(
        value: string
    ) {
        if (!isDocumentType(value)) {
            return;
        }

        setDocumentType(value);

        setDocumentNumber(
            formatDocument(
                value,
                documentNumber
            )
        );
    }

    return (
        <form
            action={action}
            className="customer-form"
        >
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
            {/* =====================================
                NAME — FULL WIDTH
               ===================================== */}

            <div className="form-group">
                <label htmlFor="name">
                    {t.name}
                </label>

                <input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={
                        customer?.name ??
                        ""
                    }
                    required
                    autoComplete="name"
                />
            </div>

            {/* =====================================
                DOCUMENT TYPE + DOCUMENT NUMBER
               ===================================== */}

            <div className="customer-form-row">
                <div className="form-group">
                    <label htmlFor="document_type">
                        {
                            t.documentType
                        }
                    </label>

                    <select
                        id="document_type"
                        name="document_type"
                        value={
                            documentType
                        }
                        onChange={(
                            event
                        ) =>
                            handleDocumentTypeChange(
                                event
                                    .target
                                    .value
                            )
                        }
                    >
                        {DOCUMENT_TYPE_OPTIONS.map(
                            (
                                option
                            ) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="document_number">
                        {
                            t.documentNumber
                        }
                    </label>

                    <input
                        id="document_number"
                        name="document_number"
                        type="text"
                        inputMode={
                            documentType ===
                            "CPF"
                                ? "numeric"
                                : "text"
                        }
                        value={
                            documentNumber
                        }
                        maxLength={
                            getDocumentMaxLength(
                                documentType
                            )
                        }
                        placeholder={
                            getDocumentPlaceholder(
                                documentType
                            )
                        }
                        onChange={(
                            event
                        ) => {
                            setDocumentNumber(
                                formatDocument(
                                    documentType,
                                    event
                                        .target
                                        .value
                                )
                            );
                        }}
                        autoComplete="off"
                    />
                </div>
            </div>

            {/* =====================================
                EMAIL + PHONE
               ===================================== */}

            <div className="customer-form-row">
                <div className="form-group">
                    <label htmlFor="email">
                        {t.email}
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={
                            customer?.email ??
                            ""
                        }
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">
                        {t.phone}
                    </label>

                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        defaultValue={
                            customer?.phone ??
                            ""
                        }
                        onInput={(
                            event
                        ) => {
                            const input =
                                event
                                    .currentTarget;

                            input.value =
                                onlyPhoneDigits(
                                    input.value
                                );
                        }}
                        autoComplete="tel"
                    />
                </div>
            </div>

            {/* =====================================
                BIRTH DATE — HALF WIDTH
               ===================================== */}

            <div className="customer-form-row">
                <div className="form-group">
                    <label htmlFor="birth_date">
                        {
                            t.birthDate
                        }
                    </label>

                    <input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        defaultValue={
                            customer
                                ?.birth_date ??
                            ""
                        }
                    />
                </div>

                <div
                    className="customer-form-empty-column"
                    aria-hidden="true"
                />
            </div>

            {/* =====================================
                NOTES — FULL WIDTH
               ===================================== */}

            <div className="form-group">
                <label htmlFor="notes">
                    {t.notes}
                </label>

                <textarea
                    id="notes"
                    name="notes"
                    defaultValue={
                        customer?.notes ??
                        ""
                    }
                    rows={5}
                />
            </div>

            {/* =====================================
                ACTIONS
               ===================================== */}

            <div className="customer-form-actions">
                <button
                    type="submit"
                    className="primary-button"
                >
                    {isEditing
                        ? t.save
                        : t.create}
                </button>

                <Link
                    href="/customers"
                    className="secondary-button"
                >
                    {t.back}
                </Link>
            </div>
        </form>
    );
}