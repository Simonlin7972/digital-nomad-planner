import Foundation

// Day-count rules that depend on where you are (src/lib/stayRules.ts and profile.ts). Derived from the stays on
// every read, never stored. Country codes are the stay's stored ISO codes, so only places picked from the list count.
public enum StayRules {
    static let schengen: Set<String> = [
        "at", "be", "bg", "ch", "cz", "de", "dk", "ee", "es", "fi", "fr", "gr", "hr", "hu", "is",
        "it", "li", "lt", "lu", "lv", "mt", "nl", "no", "pl", "pt", "ro", "se", "si", "sk",
    ]
    /// Citizens of these can stay in the Schengen area without the 90/180 limit (EU, EEA and Switzerland).
    static let freeMovement: Set<String> = [
        "at", "be", "bg", "hr", "cy", "cz", "dk", "ee", "fi", "fr", "de", "gr", "hu", "ie", "it", "lv", "lt", "lu",
        "mt", "nl", "pl", "pt", "ro", "sk", "si", "es", "se", "is", "li", "no", "ch",
    ]
    public static let schengenLimit = 90
    public static let schengenWindow = 180
    public static let residencyDays = 183

    public static func isSchengen(_ country: String) -> Bool { schengen.contains(country) }

    /// Whether the 90/180 count means anything for this passport ('' = unknown, so it does).
    public static func schengenApplies(passport: String) -> Bool { !freeMovement.contains(passport) }

    /// Days spent in the Schengen area in the 180 days ending on `day` (inclusive), each day counted once.
    public static func schengenDays(_ stays: [Stay], endingOn day: Int) -> Int {
        let window = (day - schengenWindow + 1)...day
        return Days.covered(stays.filter { isSchengen($0.country) }.map(\.range), within: window)
    }

    public struct SchengenPeak: Equatable, Sendable {
        /// The highest 180-day count reached on any planned day.
        public let peak: Int
        /// The first day the count passes the limit, if it does.
        public let firstOver: Int?

        public init(peak: Int, firstOver: Int?) {
            self.peak = peak
            self.firstOver = firstOver
        }
    }

    /// Runs the 180-day window over every planned Schengen day.
    public static func schengenPeak(_ stays: [Stay]) -> SchengenPeak {
        let inside = stays.filter { isSchengen($0.country) }
        guard let lo = inside.map(\.startDay).min(), let hi = inside.map(\.endDay).max() else {
            return SchengenPeak(peak: 0, firstOver: nil)
        }
        var covered = [Bool](repeating: false, count: hi - lo + 1)
        for s in inside { for d in s.range { covered[d - lo] = true } }
        var peak = 0
        var firstOver: Int? = nil
        var count = 0
        for i in covered.indices {
            count += covered[i] ? 1 : 0
            if i >= schengenWindow, covered[i - schengenWindow] { count -= 1 }
            guard covered[i] else { continue }
            peak = max(peak, count)
            if count > schengenLimit, firstOver == nil { firstOver = lo + i }
        }
        return SchengenPeak(peak: peak, firstOver: firstOver)
    }

    /// Days in `country` during the calendar year, a travel day counted once (`residenceDays` in stayRules.ts).
    public static func residenceDays(_ stays: [Stay], country: String, year: Int) -> Int {
        guard !country.isEmpty else { return 0 }
        return Days.covered(stays.filter { $0.country == country }.map(\.range), within: Days.yearRange(year))
    }
}
