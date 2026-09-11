import type {
    DocumentType,
} from "./documentTypes";

export function onlyDigits(
    value: string
): string {
    return value.replace(/\D/g, "");
}

function formatCpf(
    value: string
): string {
    const digits =
        onlyDigits(value).slice(
            0,
            11
        );

    if (digits.length <= 3) {
        return digits;
    }

    if (digits.length <= 6) {
        return (
            digits.slice(0, 3) +
            "." +
            digits.slice(3)
        );
    }

    if (digits.length <= 9) {
        return (
            digits.slice(0, 3) +
            "." +
            digits.slice(3, 6) +
            "." +
            digits.slice(6)
        );
    }

    return (
        digits.slice(0, 3) +
        "." +
        digits.slice(3, 6) +
        "." +
        digits.slice(6, 9) +
        "-" +
        digits.slice(9, 11)
    );
}

export function formatDocument(
    type: DocumentType,
    value: string
): string {
    switch (type) {
        case "CPF":
            return formatCpf(value);

        default:
            return value;
    }
}

export function normalizeDocument(
    type: DocumentType,
    value: string
): string {
    switch (type) {
        case "CPF":
            return onlyDigits(
                value
            ).slice(0, 11);

        default:
            return value.trim();
    }
}

export function getDocumentMaxLength(
    type: DocumentType
): number {
    switch (type) {
        case "CPF":
            return 14;

        default:
            return 50;
    }
}

export function getDocumentPlaceholder(
    type: DocumentType
): string {
    switch (type) {
        case "CPF":
            return "000.000.000-00";

        default:
            return "";
    }
}