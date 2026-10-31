import Foundation

// Day arithmetic. The web app counts days from the Monday before each year's 1 January (`weeks.ts`); here, with
// every year in one list, a day is simply the number of days since 1970-01-01, worked out in UTC so a time-zone
// or DST change can never move a date by a day. Only whole dates exist: a stay runs from the start of its first
// day to the end of its last.
public enum Days {
    static let utc: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }()

    /// `"2027-07-05"` → epoch day; nil for anything else (the web app accepts only this form).
    public static func epochDay(iso: String) -> Int? {
        let parts = iso.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
              let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]) else { return nil }
        return epochDay(year: y, month: m, day: d)
    }

    /// nil for a date that doesn't exist (31 April, 29 February of a common year).
    public static func epochDay(year: Int, month: Int, day: Int) -> Int? {
        let comps = DateComponents(year: year, month: month, day: day)
        guard comps.isValidDate(in: utc), let date = utc.date(from: comps) else { return nil }
        return Int((date.timeIntervalSince1970 / 86_400).rounded(.down))
    }

    /// The calendar day as a UTC date at midnight (use `utc` to read its components).
    public static func date(_ day: Int) -> Date {
        Date(timeIntervalSince1970: TimeInterval(day) * 86_400)
    }

    public static func components(_ day: Int) -> (year: Int, month: Int, day: Int, weekday: Int) {
        let c = utc.dateComponents([.year, .month, .day, .weekday], from: date(day))
        return (c.year!, c.month!, c.day!, c.weekday!)
    }

    public static func iso(_ day: Int) -> String {
        let c = components(day)
        return String(format: "%04d-%02d-%02d", c.year, c.month, c.day)
    }

    /// Today where the phone is: the local calendar date, as an epoch day.
    public static func today(_ now: Date = Date(), in calendar: Calendar = .current) -> Int {
        let c = calendar.dateComponents([.year, .month, .day], from: now)
        return epochDay(year: c.year!, month: c.month!, day: c.day!)!
    }

    /// 1 January to 31 December.
    public static func yearRange(_ year: Int) -> ClosedRange<Int> {
        epochDay(year: year, month: 1, day: 1)!...epochDay(year: year, month: 12, day: 31)!
    }

    /// Distinct days the ranges cover within `within`. Two stays can share their travel day, so adding up their
    /// lengths would count that day twice (`daysCovered` in weeks.ts).
    public static func covered(_ ranges: [ClosedRange<Int>], within: ClosedRange<Int>) -> Int {
        var total = 0
        var next = within.lowerBound // first day not yet counted
        for r in ranges.sorted(by: { $0.lowerBound < $1.lowerBound }) {
            let start = max(r.lowerBound, next)
            let end = min(r.upperBound, within.upperBound)
            if end >= start { total += end - start + 1 }
            next = max(next, end + 1)
        }
        return total
    }
}
