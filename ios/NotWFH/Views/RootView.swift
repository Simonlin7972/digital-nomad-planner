import SwiftUI

/// Signed out: the sign-in page. Signed in: the itinerary. Nothing until the stored session has been looked up.
struct RootView: View {
    @Environment(Cloud.self) private var cloud

    var body: some View {
        if !cloud.ready {
            ProgressView()
        } else if cloud.session == nil {
            SignInView()
        } else {
            ItineraryView()
        }
    }
}
