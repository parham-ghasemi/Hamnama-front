export function toPersianNumerals(value: string | number): string {
  const digits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  return String(value).replace(/\d/g, (digit) => digits[+digit]);
}

export function toEnglishNumerals(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";

  return value.replace(/[۰-۹]/g, (digit) =>
    String(englishDigits[persianDigits.indexOf(digit)])
  );
}