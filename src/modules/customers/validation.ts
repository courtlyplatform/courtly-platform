import {
    normalizeDocument,
} from "./documents/documentFormatter";

import {
    isDocumentType,
    type DocumentType,
} from "./documents/documentTypes";

import {
    isValidDocument,
} from "./documents/documentValidator";

export type CustomerFormData = {
    name: string;
    documentType: DocumentType | null;
    documentNumber: string | null;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
    notes: string | null;
};

export function parseCustomerFormData(
    formData: FormData
): CustomerFormData {
    const name =
        formData
            .get("name")
            ?.toString()
            .trim() ?? "";

    const rawDocumentType =
        formData
            .get("document_type")
            ?.toString()
            .trim() ?? "";

    const rawDocumentNumber =
        formData
            .get("document_number")
            ?.toString()
            .trim() ?? "";

    const email =
        formData
            .get("email")
            ?.toString()
            .trim() ?? "";

    const rawPhone =
        formData
            .get("phone")
            ?.toString()
            .trim() ?? "";

    const birthDate =
        formData
            .get("birth_date")
            ?.toString()
            .trim() ?? "";

    const notes =
        formData
            .get("notes")
            ?.toString()
            .trim() ?? "";

    if (!name) {
        throw new Error(
            "O nome do aluno é obrigatório."
        );
    }

    let documentType:
        DocumentType | null = null;

    let documentNumber:
        string | null = null;

    if (rawDocumentNumber) {
        if (
            !isDocumentType(
                rawDocumentType
            )
        ) {
            throw new Error(
                "O tipo de documento é inválido."
            );
        }

        documentType =
            rawDocumentType;

        documentNumber =
            normalizeDocument(
                documentType,
                rawDocumentNumber
            );

        if (
            !isValidDocument(
                documentType,
                documentNumber
            )
        ) {
            throw new Error(
                "O documento informado é inválido."
            );
        }
    }

    const phone =
        normalizePhone(rawPhone);

    return {
        name,
        documentType,
        documentNumber,
        email:
            email || null,
        phone:
            phone || null,
        birthDate:
            birthDate || null,
        notes:
            notes || null,
    };
}

export function normalizePhone(
    value: string
): string {
    return value
        .replace(/\D/g, "")
        .slice(0, 15);
}