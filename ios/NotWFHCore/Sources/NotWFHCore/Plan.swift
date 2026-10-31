import Foundation

// The plan exactly as the web app writes it (`serialize` in src/lib/storage.ts), which is also what a
// `nomad.plans` row holds: one object per year, dates as ISO strings, places language-neutral (an ISO code or
// region id for the country, a listed city's English name for the city, anything else as typed).

/// A flight, every field optional free text. The same ticket may carry a return leg.
public struct Ticket: Codable, Equatable, Hashable, Sendable {
    public var airline: String?
    public var flightNo: String?
    public var departure: String?
    public var bookingRef: String?
    public var price: String?
    public var returnFlightNo: String?
    public var returnDeparture: String?
    public var returnAirline: String?

    public init(airline: String? = nil, flightNo: String? = nil, departure: String? = nil, bookingRef: String? = nil,
                price: String? = nil, returnFlightNo: String? = nil, returnDeparture: String? = nil, returnAirline: String? = nil) {
        self.airline = airline
        self.flightNo = flightNo
        self.departure = departure
        self.bookingRef = bookingRef
        self.price = price
        self.returnFlightNo = returnFlightNo
        self.returnDeparture = returnDeparture
        self.returnAirline = returnAirline
    }
}

/// One stay as stored. `start` and `end` are inclusive ISO dates; either place may be empty, but not both.
public struct StayRecord: Codable, Equatable, Hashable, Sendable, Identifiable {
    public var id: String
    public var country: String
    public var city: String
    public var start: String
    public var end: String
    public var color: String?
    public var companions: String?
    public var ticket: Ticket?
    public var note: String?

    public init(id: String, country: String = "", city: String = "", start: String, end: String, color: String? = nil,
                companions: String? = nil, ticket: Ticket? = nil, note: String? = nil) {
        self.id = id
        self.country = country
        self.city = city
        self.start = start
        self.end = end
        self.color = color
        self.companions = companions
        self.ticket = ticket
        self.note = note
    }

    // Lenient like `sanitize`: a missing place is empty, not an error.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        country = try c.decodeIfPresent(String.self, forKey: .country) ?? ""
        city = try c.decodeIfPresent(String.self, forKey: .city) ?? ""
        start = try c.decode(String.self, forKey: .start)
        end = try c.decode(String.self, forKey: .end)
        color = try c.decodeIfPresent(String.self, forKey: .color)
        companions = try c.decodeIfPresent(String.self, forKey: .companions)
        ticket = try? c.decodeIfPresent(Ticket.self, forKey: .ticket)
        note = try c.decodeIfPresent(String.self, forKey: .note)
    }
}

/// A year's plan. Entries that don't decode are dropped rather than failing the year, as the web app's import does.
public struct PlanRecord: Codable, Equatable, Sendable {
    public var year: Int
    public var stays: [StayRecord]

    public init(year: Int, stays: [StayRecord]) {
        self.year = year
        self.stays = stays
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        year = try c.decode(Int.self, forKey: .year)
        let raw = try c.decodeIfPresent([Lossy<StayRecord>].self, forKey: .stays) ?? []
        stays = raw.compactMap(\.value)
    }
}

/// Decodes to nil instead of throwing, so one bad entry doesn't take the list with it.
struct Lossy<T: Decodable>: Decodable {
    let value: T?
    init(from decoder: Decoder) throws {
        value = try? T(from: decoder)
    }
}

/// A stay with its dates resolved to epoch days (see `Days`), ready to compare across years.
public struct Stay: Identifiable, Equatable, Hashable, Sendable {
    public let id: String
    /// The plan it came from. The same dates can appear in two neighbouring years (the borrowed days at the edges).
    public let year: Int
    public let country: String
    public let city: String
    public let startDay: Int
    public let endDay: Int
    public let color: String?
    public let companions: String?
    public let ticket: Ticket?
    public let note: String?

    public var days: Int { endDay - startDay + 1 }
    public var range: ClosedRange<Int> { startDay...endDay }
    public var isLocked: Bool { ticket != nil }

    public init(id: String, year: Int, country: String, city: String, startDay: Int, endDay: Int, color: String? = nil,
                companions: String? = nil, ticket: Ticket? = nil, note: String? = nil) {
        self.id = id
        self.year = year
        self.country = country
        self.city = city
        self.startDay = startDay
        self.endDay = endDay
        self.color = color
        self.companions = companions
        self.ticket = ticket
        self.note = note
    }

    /// Nil when the dates don't parse or run backwards, or when both places are empty.
    public init?(_ r: StayRecord, year: Int) {
        guard let s = Days.epochDay(iso: r.start), let e = Days.epochDay(iso: r.end), e >= s else { return nil }
        let country = r.country.trimmingCharacters(in: .whitespaces)
        let city = r.city.trimmingCharacters(in: .whitespaces)
        guard !country.isEmpty || !city.isEmpty else { return nil }
        self.init(id: r.id, year: year, country: country, city: city, startDay: s, endDay: e, color: r.color,
                  companions: r.companions, ticket: r.ticket, note: r.note)
    }
}

public extension PlanRecord {
    /// The year's stays in date order.
    func resolved() -> [Stay] {
        stays.compactMap { Stay($0, year: year) }.sorted { $0.startDay < $1.startDay }
    }
}

/// Every year's stays in one list, in date order, the way the phone's now / next card reads them.
public func mergeStays(_ plans: [PlanRecord]) -> [Stay] {
    plans.sorted { $0.year < $1.year }.flatMap { $0.resolved() }.sorted { $0.startDay < $1.startDay }
}

/// The settings row (`Profile` in src/lib/profile.ts), only the parts the phone reads. Missing fields take the
/// web app's defaults.
public struct ProfileRecord: Decodable, Equatable, Sendable {
    public var nickname: String = ""
    public var homeCountry: String = ""
    public var homeCity: String = ""
    public var passport: String = ""
    public var taxResidence: String = "tw"
    public var tempUnit: String = "c"

    public init() {}

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        nickname = try c.decodeIfPresent(String.self, forKey: .nickname) ?? ""
        homeCountry = try c.decodeIfPresent(String.self, forKey: .homeCountry) ?? ""
        homeCity = try c.decodeIfPresent(String.self, forKey: .homeCity) ?? ""
        passport = try c.decodeIfPresent(String.self, forKey: .passport) ?? ""
        taxResidence = try c.decodeIfPresent(String.self, forKey: .taxResidence) ?? "tw"
        tempUnit = try c.decodeIfPresent(String.self, forKey: .tempUnit) ?? "c"
    }

    private enum CodingKeys: String, CodingKey { case nickname, homeCountry, homeCity, passport, taxResidence, tempUnit }
}
