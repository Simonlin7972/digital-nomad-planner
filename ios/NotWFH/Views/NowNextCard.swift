import SwiftUI
import NotWFHCore

struct NowNextCard: View {
    let itinerary: Itinerary

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let current = itinerary.current, let progress = itinerary.progress {
                VStack(alignment: .leading, spacing: 6) {
                    Tag("mobile.now")
                    PlaceText(stay: current).font(.title2.weight(.semibold))
                    ProgressView(value: Double(progress.day), total: Double(progress.total))
                        .tint(.primary)
                    Text("mobile.dayOf \(progress.day) \(progress.total)")
                        + Text(verbatim: " · ")
                        + Text("mobile.daysLeft \(progress.left)")
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }
            if let next = itinerary.next {
                if itinerary.current != nil { Divider() }
                VStack(alignment: .leading, spacing: 6) {
                    Tag("mobile.next")
                    PlaceText(stay: next).font(.title2.weight(.semibold)).foregroundStyle(.primary)
                    HStack(spacing: 4) {
                        Text(DayText.range(next))
                        Text(verbatim: "·")
                        if itinerary.leavingToday {
                            Text("mobile.travelToday")
                        } else if let days = itinerary.daysUntilNext {
                            Text("mobile.inDays \(days)")
                        }
                    }
                    if let flight = next.ticket.flatMap(DayText.flight) {
                        Label(flight, systemImage: "airplane").font(.footnote)
                    }
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
    }
}

/// The small uppercase label above a card's place: NOW / NEXT.
struct Tag: View {
    let key: LocalizedStringKey
    init(_ key: LocalizedStringKey) { self.key = key }

    var body: some View {
        Text(key)
            .font(.caption.weight(.semibold))
            .textCase(.uppercase)
            .foregroundStyle(.secondary)
    }
}

/// Flag, city and country, from the stored language-neutral place.
struct PlaceText: View {
    let stay: Stay

    var body: some View {
        HStack(spacing: 8) {
            let flag = PlaceName.flag(stay.country)
            if !flag.isEmpty { Text(flag) }
            Text(PlaceName.full(country: stay.country, city: stay.city))
        }
    }
}

/// Date text for a stay. Days are whole calendar dates, so they are formatted in UTC, never shifted by the
/// phone's time zone.
enum DayText {
    static func day(_ day: Int, year: Bool = false) -> String {
        let base = Date.FormatStyle(timeZone: .gmt).month(.abbreviated).day()
        return Days.date(day).formatted(year ? base.year() : base)
    }

    /// "Mar 1 – Apr 10" (with the year when the stay isn't in this calendar year).
    static func range(_ stay: Stay, today: Int = Days.today()) -> String {
        let thisYear = Days.components(today).year
        let showYear = Days.components(stay.startDay).year != thisYear || Days.components(stay.endDay).year != thisYear
        return "\(day(stay.startDay, year: showYear)) – \(day(stay.endDay, year: showYear))"
    }

    /// "TAP TP 1234", whichever parts the ticket has. Never the booking reference or the fare.
    static func flight(_ ticket: Ticket) -> String? {
        let parts = [ticket.airline, ticket.flightNo].compactMap { $0 }.filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " ")
    }
}
