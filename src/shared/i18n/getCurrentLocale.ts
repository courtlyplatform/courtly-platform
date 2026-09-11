import {
    cookies,
} from "next/headers";

import {
    DEFAULT_LOCALE,
    isLocale,
    LOCALE_COOKIE_NAME,
    type Locale,
} from "./config";

export async function getCurrentLocale(): Promise<Locale> {
    const cookieStore =
        await cookies();

    const locale =
        cookieStore
            .get(LOCALE_COOKIE_NAME)
            ?.value;

    if (
        locale &&
        isLocale(locale)
    ) {
        return locale;
    }

    return DEFAULT_LOCALE;
}