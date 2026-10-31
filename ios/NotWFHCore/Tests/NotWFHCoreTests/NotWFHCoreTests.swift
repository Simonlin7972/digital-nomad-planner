import XCTest
@testable import NotWFHCore

final class DaysTests: XCTestCase {
    func testIsoRoundTrip() {
        for iso in ["1970-01-01", "2026-12-28", "2027-07-05", "2028-02-29", "2028-12-31"] {
            let day = Days.epochDay(iso: iso)
            XCTAssertNotNil(day, iso)
            XCTAssertEqual(Days.iso(day!), iso)
        }
        XCTAssertEqual(Days.epochDay(iso: "1970-01-02"), 1)
    }

    func testRejectsBadDates() {
        for bad in ["2027-02-29", "2027-4-1", "2027/04/01", "", "2027-13-01", "27-01-01"] {
            XCTAssertNil(Days.epochDay(iso: bad), bad)
        }
    }

    func testCoveredCountsATravelDayOnce() {
        let a = Days.epochDay(iso: "2027-03-01")!...Days.epochDay(iso: "2027-03-10")!
        let b = Days.epochDay(iso: "2027-03-10")!...Days.epochDay(iso: "2027-03-20")!
        XCTAssertEqual(Days.covered([a, b], within: Days.yearRange(2027)), 20)
        XCTAssertEqual(Days.covered([b, a], within: a), 10)
    }

    func testTodayUsesTheLocalDate() {
        var tokyo = Calendar(identifier: .gregorian)
        tokyo.timeZone = TimeZone(identifier: "Asia/Tokyo")!
        // 23:30 UTC on 4 July is already 5 July in Tokyo.
        let now = Date(timeIntervalSince1970: TimeInterval(Days.epochDay(iso: "2027-07-04")! * 86_400 + 23 * 3600 + 1800))
        XCTAssertEqual(Days.iso(Days.today(now, in: tokyo)), "2027-07-05")
    }
}

final class PlanTests: XCTestCase {
    // The export form, as `serialize` writes it, with one malformed entry and one legacy field the phone ignores.
    let json = """
    {"year":2027,"stays":[
      {"id":"a","country":"pt","city":"Lisbon","start":"2027-03-01","end":"2027-04-10","color":"coral",
       "ticket":{"airline":"TAP","flightNo":"TP 1234","departure":"2027-03-01T10:00","bookingRef":"ABC123"}},
      {"id":"b","country":"th","city":"","start":"2027-04-10","end":"2027-05-20","note":"visa run"},
      {"id":"bad","country":"xx","city":"Nowhere","start":"not a date","end":"2027-05-20"},
      {"country":"fr","city":"Paris","start":"2027-07-01","end":"2027-07-05"},
      {"id":"c","city":"Kyoto","start":"2027-06-01","end":"2027-06-14","companions":"M"}
    ]}
    """

    func testDecodesTheExportFormLeniently() throws {
        let plan = try JSONDecoder().decode(PlanRecord.self, from: Data(json.utf8))
        XCTAssertEqual(plan.year, 2027)
        XCTAssertEqual(plan.stays.map(\.id), ["a", "b", "bad", "c"]) // no id: dropped; bad dates: dropped by resolved()
        XCTAssertEqual(plan.stays[0].ticket?.flightNo, "TP 1234")
        XCTAssertEqual(plan.stays[3].country, "")
        let stays = plan.resolved()
        XCTAssertEqual(stays.map(\.id), ["a", "b", "c"])
        XCTAssertEqual(stays[0].days, 41)
        XCTAssertTrue(stays[0].isLocked)
        XCTAssertFalse(stays[1].isLocked)
    }

    func testMergeOrdersAcrossYears() throws {
        let p27 = try JSONDecoder().decode(PlanRecord.self, from: Data(json.utf8))
        let p26 = PlanRecord(year: 2026, stays: [StayRecord(id: "z", country: "tw", city: "Taipei", start: "2026-11-01", end: "2026-12-31")])
        XCTAssertEqual(mergeStays([p27, p26]).map(\.id), ["z", "a", "b", "c"])
    }

    func testProfileDefaults() throws {
        let p = try JSONDecoder().decode(ProfileRecord.self, from: Data("{\"nickname\":\"S\",\"passport\":\"tw\"}".utf8))
        XCTAssertEqual(p.passport, "tw")
        XCTAssertEqual(p.taxResidence, "tw")
        XCTAssertEqual(p.tempUnit, "c")
    }
}

final class ItineraryTests: XCTestCase {
    func stay(_ id: String, _ country: String, _ start: String, _ end: String, year: Int = 2027) -> Stay {
        Stay(StayRecord(id: id, country: country, start: start, end: end), year: year)!
    }

    func testNowAndNext() {
        let stays = [stay("a", "pt", "2027-03-01", "2027-04-10"), stay("b", "th", "2027-04-10", "2027-05-20"), stay("c", "jp", "2027-06-01", "2027-06-14")]
        let mid = Itinerary(stays: stays, today: Days.epochDay(iso: "2027-03-20")!)
        XCTAssertEqual(mid.current?.id, "a")
        XCTAssertEqual(mid.next?.id, "b")
        XCTAssertEqual(mid.progress?.day, 20)
        XCTAssertEqual(mid.progress?.total, 41)
        XCTAssertEqual(mid.progress?.left, 21)
        XCTAssertEqual(mid.daysUntilNext, 21)
        XCTAssertFalse(mid.leavingToday)
        XCTAssertEqual(mid.upcoming.map(\.id), ["b", "c"])
        XCTAssertEqual(mid.past, [])
    }

    func testTravelDaySplitsNowAndNext() {
        let stays = [stay("a", "pt", "2027-03-01", "2027-04-10"), stay("b", "th", "2027-04-10", "2027-05-20")]
        let it = Itinerary(stays: stays, today: Days.epochDay(iso: "2027-04-10")!)
        XCTAssertEqual(it.current?.id, "a")
        XCTAssertEqual(it.next?.id, "b")
        XCTAssertTrue(it.leavingToday)
    }

    func testBetweenStaysAndAfterAll() {
        let stays = [stay("a", "pt", "2027-03-01", "2027-04-10"), stay("c", "jp", "2027-06-01", "2027-06-14")]
        let gap = Itinerary(stays: stays, today: Days.epochDay(iso: "2027-05-01")!)
        XCTAssertNil(gap.current)
        XCTAssertEqual(gap.next?.id, "c")
        XCTAssertEqual(gap.past.map(\.id), ["a"])
        let after = Itinerary(stays: stays, today: Days.epochDay(iso: "2027-07-01")!)
        XCTAssertNil(after.current)
        XCTAssertNil(after.next)
        XCTAssertEqual(after.past.map(\.id), ["c", "a"])
    }

    func testSameDatesInTwoPlansPreferThisYear() {
        // The borrowed days at the edge: the same stay kept in 2026's and 2027's plan.
        let stays = [stay("x26", "tw", "2026-12-28", "2027-01-03", year: 2026), stay("x27", "tw", "2026-12-28", "2027-01-03", year: 2027), stay("n", "jp", "2027-01-03", "2027-01-20")]
        let it = Itinerary(stays: stays, today: Days.epochDay(iso: "2027-01-01")!)
        XCTAssertEqual(it.current?.id, "x27")
        XCTAssertEqual(it.next?.id, "n")
    }
}

final class StayRulesTests: XCTestCase {
    func stay(_ id: String, _ country: String, _ start: String, _ end: String) -> Stay {
        Stay(StayRecord(id: id, country: country, start: start, end: end), year: 2027)!
    }

    func testSchengenWindow() {
        let stays = [stay("a", "pt", "2027-01-01", "2027-02-28"), stay("b", "th", "2027-03-01", "2027-03-31"), stay("c", "es", "2027-04-01", "2027-05-15")]
        XCTAssertEqual(StayRules.schengenDays(stays, endingOn: Days.epochDay(iso: "2027-02-28")!), 59)
        XCTAssertEqual(StayRules.schengenDays(stays, endingOn: Days.epochDay(iso: "2027-03-31")!), 59)
        // 1 Jan to 15 May is 135 days; the window ending 15 May starts 17 Nov, so every Schengen day is inside it.
        XCTAssertEqual(StayRules.schengenDays(stays, endingOn: Days.epochDay(iso: "2027-05-15")!), 59 + 45)
        let peak = StayRules.schengenPeak(stays)
        XCTAssertEqual(peak.peak, 104)
        XCTAssertEqual(peak.firstOver.map(Days.iso), "2027-05-02")
        XCTAssertEqual(StayRules.schengenPeak([stays[1]]), .init(peak: 0, firstOver: nil))
    }

    func testResidenceDaysCountTravelDayOnce() {
        let stays = [stay("a", "tw", "2026-12-20", "2027-01-10"), stay("b", "tw", "2027-01-10", "2027-02-01"), stay("c", "jp", "2027-02-01", "2027-02-20")]
        XCTAssertEqual(StayRules.residenceDays(stays, country: "tw", year: 2027), 32)
        XCTAssertEqual(StayRules.residenceDays(stays, country: "tw", year: 2026), 12)
        XCTAssertEqual(StayRules.residenceDays(stays, country: "", year: 2027), 0)
    }

    func testPassports() {
        XCTAssertTrue(StayRules.schengenApplies(passport: "tw"))
        XCTAssertTrue(StayRules.schengenApplies(passport: ""))
        XCTAssertFalse(StayRules.schengenApplies(passport: "de"))
    }
}
