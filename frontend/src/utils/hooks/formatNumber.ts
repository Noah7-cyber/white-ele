/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Formats a number or string as a localized numeric string with optional decimal places.
 * @param amount The number or string to format.
 * @param decimalPlaces (Optional) The number of decimal places to display. Must be a positive integer.
 *   Defaults to null, which uses the default decimal places based on the type of `amount`.
 * @throws {Error} If `decimalPlaces` is provided but not a positive integer.
 * @returns A string representing the formatted number.
 */

export function formatAmount(amount?: number | string, decimalPlaces?: number): string {
  if (!+(amount?.toString()?.replaceAll(",", "") || "")) return amount ? `${amount}` : "";

  let defaultDecimalPlaces = 0;



  if (decimalPlaces === 0) {
    defaultDecimalPlaces = 0;
  } else if (decimalPlaces && !isPositiveInteger(decimalPlaces)) {
    throw new Error("decimalPlaces must be a positive integer.");
  } else if (decimalPlaces == null) {
    defaultDecimalPlaces = 2;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: decimalPlaces || defaultDecimalPlaces,
    maximumFractionDigits: decimalPlaces || defaultDecimalPlaces,
  });

  const numericAmount =
    typeof amount === "string" ? parseFloat(formattedAmountToNumber(amount)) : amount || 0;

  const formattedAmount = formatter.format(numericAmount);

  return amount?.toString()?.endsWith(".") ? `${formattedAmount}.` : formattedAmount;
}

/**
 * Checks if the given value is a positive integer.
 * @param value The value to check.
 * @returns True if the value is a positive integer, false otherwise.
 */
export function isPositiveInteger(value?: number): boolean {
  return (Number.isInteger(value) && (value || -1) > 0) || value == 0;
}

export function formattedAmountToNumber(amount?: string | number) {
  const cleanAmount = amount?.toString()?.replaceAll(",", "");

  return cleanAmount || "";
}

export function formatNumberWithCommas(value?: string | number) {
  if (!value) return "";

  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPrice(amount: number, currency = "NGN", locale = "en-NG") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export const shortenNumber = (number: number): string => {
  if (number > 1000000000000) {
    return `${(number / 1000000000000).toString()}T`;
  } else if (number > 1000000000000000) {
    return `${(number / 1000000000000000).toString()}Z`;
  } else if (number > 1000000000) {
    return `${(number / 1000000000).toString()}B`;
  } else if (number > 1000000) {
    return `${(number / 1000000).toString()}M`;
  } else if (number > 1000) {
    return `${(number / 1000).toString()}K`;
  } else {
    return number.toString();
  }
};

export function formatAmountOnType(value: any) {
  const str = String(value ?? "");
  const cleaned = str.replace(/[^0-9]/g, "");
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
