import SwiftUI
import NotWFHCore

struct StayRow: View {
    let stay: Stay

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            PlaceText(stay: stay).font(.body.weight(.semibold))
            HStack(spacing: 4) {
                Text(DayText.range(stay))
                Text(verbatim: "·")
                Text("unit.days \(stay.days)")
                if stay.isLocked { Image(systemName: "ticket").imageScale(.small) }
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
            if let flight = stay.ticket.flatMap(DayText.flight) {
                Label(flight, systemImage: "airplane").font(.footnote).foregroundStyle(.secondary)
            }
            if let companions = stay.companions, !companions.isEmpty {
                Label(companions, systemImage: "person.2").font(.footnote).foregroundStyle(.secondary)
            }
            if let note = stay.note, !note.isEmpty {
                Text(note).font(.footnote).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}
