import {
    DEFAULT_LOCALE,
    type Locale,
} from "./config";

import {
    ptBR,
} from "./dictionaries/pt-BR";

import {
    enUS,
} from "./dictionaries/en-US";

type DeepStringify<T> = {
    [K in keyof T]:
        T[K] extends string
            ? string
            : T[K] extends object
                ? DeepStringify<T[K]>
                : T[K];
};

export type Dictionary =
    DeepStringify<typeof ptBR>;

const dictionaries: Record<
    Locale,
    Dictionary
> = {
    "pt-BR": ptBR,
    "en-US": enUS,
};

export function getDictionary(
    locale: Locale = DEFAULT_LOCALE
): Dictionary {
    return dictionaries[locale];
}