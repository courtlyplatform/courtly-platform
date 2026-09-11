import {
    normalizeDocument,
} from "./documentFormatter";

import type {
    DocumentType,
} from "./documentTypes";

function isValidCpf(
    value: string
): boolean {
    const cpf =
        normalizeDocument(
            "CPF",
            value
        );

    if (cpf.length !== 11) {
        return false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calculateDigit = (
        partialCpf: string,
        initialWeight: number
    ): number => {
        let sum = 0;

        for (
            let index = 0;
            index <
            partialCpf.length;
            index++
        ) {
            sum +=
                Number(
                    partialCpf[index]
                ) *
                (
                    initialWeight -
                    index
                );
        }

        const remainder =
            (sum * 10) % 11;

        return remainder === 10
            ? 0
            : remainder;
    };

    const firstDigit =
        calculateDigit(
            cpf.slice(0, 9),
            10
        );

    if (
        firstDigit !==
        Number(cpf[9])
    ) {
        return false;
    }

    const secondDigit =
        calculateDigit(
            cpf.slice(0, 10),
            11
        );

    return (
        secondDigit ===
        Number(cpf[10])
    );
}

export function isValidDocument(
    type: DocumentType,
    value: string
): boolean {
    switch (type) {
        case "CPF":
            return isValidCpf(
                value
            );

        default:
            return false;
    }
}