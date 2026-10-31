import SwiftUI
import NotWFHCore

/// The phone layout, as on the web: where you are, where you go next, then every stay.
struct ItineraryView: View {
    @Environment(Cloud.self) private var cloud
    @State private var showPast = false

    var body: some View {
        let stays = mergeStays(cloud.plans)
        let itinerary = Itinerary(stays: stays, today: Days.today())
        NavigationStack {
            List {
                if itinerary.current != nil || itinerary.next != nil {
                    Section { NowNextCard(itinerary: itinerary) }
                }
                if let line = schengenLine(stays, today: itinerary.today) {
                    Section { Label(line, systemImage: "passport") }
                }
                if !itinerary.upcoming.isEmpty {
                    Section("list.upcoming") {
                        ForEach(itinerary.upcoming) { StayRow(stay: $0) }
                    }
                }
                if !itinerary.past.isEmpty {
                    Section {
                        DisclosureGroup(isExpanded: $showPast) {
                            ForEach(itinerary.past) { StayRow(stay: $0).foregroundStyle(.secondary) }
                        } label: {
                            Text("list.past \(itinerary.past.count)")
                        }
                    }
                }
                if let error = cloud.error {
                    Section { Text(error).font(.footnote).foregroundStyle(.red) }
                }
            }
            .overlay {
                if stays.isEmpty {
                    if cloud.loading {
                        ProgressView()
                    } else {
                        ContentUnavailableView("list.emptyTitle", systemImage: "airplane", description: Text("list.empty"))
                    }
                }
            }
            .refreshable { await cloud.pull() }
            .navigationTitle(Text("app.name"))
            .toolbar {
                Menu {
                    if let email = cloud.session?.user.email {
                        Text(verbatim: email)
                    }
                    Button("account.signOut", role: .destructive) {
                        Task { await cloud.signOut() }
                    }
                } label: {
                    Image(systemName: "person.crop.circle")
                }
            }
        }
    }

    /// "Schengen: 12 of 90 days in the last 180", only when it applies and something is planned there.
    private func schengenLine(_ stays: [Stay], today: Int) -> String? {
        guard StayRules.schengenApplies(passport: cloud.profile.passport),
              stays.contains(where: { StayRules.isSchengen($0.country) }) else { return nil }
        let days = StayRules.schengenDays(stays, endingOn: today)
        return String(localized: "rules.schengen \(days) \(StayRules.schengenLimit)")
    }
}
