import Foundation

/// Where you are, where you go next, and the rest, from every year's stays: the phone's view
/// (`MobileItinerary.tsx`). On a travel day two stays cover today: the one being left is "now" and the one
/// arriving today is "next". A stay can appear in two plans (the borrowed days at a year's edges), so the next
/// stay must start after the current one.
public struct Itinerary: Equatable, Sendable {
    public let today: Int
    public let current: Stay?
    public let next: Stay?
    /// Stays that start after today, `next` included.
    public let upcoming: [Stay]
    /// Stays that ended before today, latest first.
    public let past: [Stay]

    public init(stays: [Stay], today: Int) {
        self.today = today
        let sorted = stays.sorted { $0.startDay < $1.startDay }
        let covering = sorted.filter { $0.range.contains(today) }
        let thisYear = Days.components(today).year
        let current = covering.first { $0.year == thisYear } ?? covering.first
        self.current = current
        if let current {
            next = sorted.first { $0.startDay > current.startDay && $0.startDay >= current.endDay }
        } else {
            next = sorted.first { $0.startDay > today }
        }
        upcoming = sorted.filter { $0.startDay > today }
        past = sorted.filter { $0.endDay < today }.reversed()
    }

    public var leavingToday: Bool { next.map { $0.startDay == today } ?? false }
    public var daysUntilNext: Int? { next.map { $0.startDay - today } }

    /// "Day 38 of 50 · 12 to go" for the current stay.
    public var progress: (day: Int, total: Int, left: Int)? {
        current.map { (today - $0.startDay + 1, $0.days, $0.endDay - today) }
    }
}
