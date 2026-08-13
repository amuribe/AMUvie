import type { DropdownOption } from "../types/types";

export const RATING_OPTIONS: DropdownOption[] = Array.from({ length: 21 }, (_, index) => {
    // Break up each int into .5 increments
    const value = (index / 2).toFixed(1);

    // Return the dropdown option
    return {
        label: `${value} / 10`,
        value
    };
});