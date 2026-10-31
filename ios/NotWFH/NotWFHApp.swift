import SwiftUI

@main
struct NotWFHApp: App {
    @State private var cloud = Cloud()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(cloud)
                .task { await cloud.start() }
                .onOpenURL { url in Task { await cloud.handle(url) } }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { Task { await cloud.pull() } }
                }
        }
    }
}
