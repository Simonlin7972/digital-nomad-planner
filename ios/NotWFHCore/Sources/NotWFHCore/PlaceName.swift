import Foundation

// Places are stored language-neutrally: country as an ISO code (or a region id the web app made up) and city as a
// listed city's English name. Country names come from the system, like `Intl.DisplayNames` in the browser; the
// city list's Chinese names live in src/lib/cities.ts and are not bundled yet, so a city shows its English name.
public enum PlaceName {
    /// The country's name in the given locale, or the stored value when it isn't an ISO code the system knows.
    public static func country(_ code: String, locale: Locale = .current) -> String {
        guard code.count == 2 else { return code }
        return locale.localizedString(forRegionCode: code.uppercased()) ?? code
    }

    /// The flag emoji for an ISO code, or nothing.
    public static func flag(_ code: String) -> String {
        guard code.count == 2, code.allSatisfy({ $0.isLetter }) else { return "" }
        return String(code.uppercased().unicodeScalars.compactMap { UnicodeScalar(127_397 + $0.value) }.map(Character.init))
    }

    /// "Lisbon, Portugal" / "里斯本，葡萄牙": city first, country after, whichever exist.
    public static func full(country: String, city: String, locale: Locale = .current) -> String {
        let parts = [city, country.isEmpty ? "" : self.country(country, locale: locale)].filter { !$0.isEmpty }
        let sep = locale.language.languageCode?.identifier == "en" ? ", " : "，"
        return parts.joined(separator: sep)
    }

    /// The short name: the city if there is one, else the country.
    public static func short(country: String, city: String, locale: Locale = .current) -> String {
        city.isEmpty ? self.country(country, locale: locale) : city
    }
}
