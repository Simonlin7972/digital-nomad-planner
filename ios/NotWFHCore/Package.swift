// swift-tools-version: 6.0
// The planner's data model and day-count rules, ported from src/lib (storage.ts, weeks.ts, stayRules.ts),
// with no UI and no network, so `swift test` runs it on a Mac with just the command line tools.
import PackageDescription

let package = Package(
    name: "NotWFHCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "NotWFHCore", targets: ["NotWFHCore"])],
    targets: [
        .target(name: "NotWFHCore"),
        .testTarget(name: "NotWFHCoreTests", dependencies: ["NotWFHCore"]),
    ],
    swiftLanguageModes: [.v6]
)
