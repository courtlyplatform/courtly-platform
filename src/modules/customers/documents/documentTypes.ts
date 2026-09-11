export const DOCUMENT_TYPES = {
    CPF: "CPF",
} as const;

export type DocumentType =
    keyof typeof DOCUMENT_TYPES;

export type DocumentTypeOption = {
    value: DocumentType;
    label: string;
};

export const DOCUMENT_TYPE_OPTIONS:
    DocumentTypeOption[] = [
        {
            value: "CPF",
            label: "CPF",
        },
    ];

export function isDocumentType(
    value: string
): value is DocumentType {
    return value in DOCUMENT_TYPES;
}