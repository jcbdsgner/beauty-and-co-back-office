export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const countries: Country[] = [
  { code: "SN", name: "Sénégal", dialCode: "221", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "225", flag: "🇨🇮" },
  { code: "ML", name: "Mali", dialCode: "223", flag: "🇲🇱" },
  { code: "MR", name: "Mauritanie", dialCode: "222", flag: "🇲🇷" },
  { code: "GN", name: "Guinée", dialCode: "224", flag: "🇬🇳" },
  { code: "GM", name: "Gambie", dialCode: "220", flag: "🇬🇲" },
  { code: "BF", name: "Burkina Faso", dialCode: "226", flag: "🇧🇫" },
  { code: "TG", name: "Togo", dialCode: "228", flag: "🇹🇬" },
  { code: "BJ", name: "Bénin", dialCode: "229", flag: "🇧🇯" },
  { code: "MA", name: "Maroc", dialCode: "212", flag: "🇲🇦" },
  { code: "FR", name: "France", dialCode: "33", flag: "🇫🇷" },
  { code: "BE", name: "Belgique", dialCode: "32", flag: "🇧🇪" },
  { code: "GB", name: "Royaume-Uni", dialCode: "44", flag: "🇬🇧" },
  { code: "US", name: "États-Unis", dialCode: "1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dialCode: "1", flag: "🇨🇦" },
];

export const defaultCountry: Country = countries[0];

export function findCountry(code: string): Country {
  return countries.find((country) => country.code === code) ?? defaultCountry;
}
