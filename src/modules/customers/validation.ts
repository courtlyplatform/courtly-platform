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


export type CustomerValidationErrorCode =
    | "nameRequired"
    | "invalidDocumentType"
    | "invalidDocument"
    | "invalidData";


export class CustomerValidationError
    extends Error {
    code: CustomerValidationErrorCode;

    constructor(
        code: CustomerValidationErrorCode
    ) {
        super(code);

        this.name =
            "CustomerValidationError";

        this.code =
            code;
    }
}


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
        throw new CustomerValidationError(
            "nameRequired"
        );
    }


    let documentType:
        DocumentType | null =
        null;

    let documentNumber:
        string | null =
        null;


    /*
     * A document is optional.
     *
     * However, when the user provides
     * a document number, a valid type
     * must also be provided.
     */
    if (rawDocumentNumber) {
        if (
            !isDocumentType(
                rawDocumentType
            )
        ) {
            throw new CustomerValidationError(
                "invalidDocumentType"
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
            throw new CustomerValidationError(
                "invalidDocument"
            );
        }
    }


    const phone =
        normalizePhone(
            rawPhone
        );


    return {
        name,

        documentType,

        documentNumber,

        email:
            email ||
            null,

        phone:
            phone ||
            null,

        birthDate:
            birthDate ||
            null,

        notes:
            notes ||
            null,
    };
}


export function normalizePhone(
    value: string
): string {
    return value
        .replace(
            /\D/g,
            ""
        )
        .slice(
            0,
            15
        );
}