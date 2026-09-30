import { getCountries, getCountryCallingCode } from "libphonenumber-js/min"

export type HpxCountry = { id: string; name: string; code: string; flag: string }

// Regional indicator letters spell the flag emoji
const flagOf = (id: string) =>
  String.fromCodePoint(...[...id].map((letter) => 127397 + letter.charCodeAt(0)))

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

// Every region with a calling code, straight from the phone number metadata
export const countries: HpxCountry[] = getCountries()
  .map((id) => ({
    id,
    name: regionNames.of(id) ?? id,
    code: `+${getCountryCallingCode(id)}`,
    flag: flagOf(id),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
