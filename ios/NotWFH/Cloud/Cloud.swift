import Foundation
import Observation
import Supabase
import NotWFHCore

// The cloud copy, read-only. The phone never writes a row: the web app owns the sync rules (src/lib/sync.ts), and
// a device that only pulls can't clash with them. Same project, schema and anon key as src/lib/cloud.ts; the anon
// key is public by design, row level security is what keeps one person's rows from another.
enum CloudConfig {
    static let ref = "qdjungqzeovpdnrijyls"
    static let url = URL(string: "https://\(ref).supabase.co")!
    static let anonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkanVuZ3F6ZW92cGRucmlqeWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Njk0MjEsImV4cCI6MjA1OTM0NTQyMX0.p55IfEzshqh3awQFN7DLTncLueh1WdtEb9wBzmlLe18"
    /// Where Google's redirect lands: the app's URL scheme (Info.plist). Must be listed under Authentication →
    /// URL Configuration → Additional Redirect URLs in the Supabase dashboard.
    static let redirect = URL(string: "notwfh://auth-callback")!
}

@MainActor
@Observable
final class Cloud {
    private let client: SupabaseClient

    /// False until the stored session has been looked up, so the sign-in page doesn't flash on launch.
    private(set) var ready = false
    private(set) var session: Session?
    private(set) var plans: [PlanRecord] = []
    private(set) var profile = ProfileRecord()
    private(set) var loading = false
    private(set) var error: String?

    init() {
        client = SupabaseClient(
            supabaseURL: CloudConfig.url,
            supabaseKey: CloudConfig.anonKey,
            options: SupabaseClientOptions(
                db: .init(schema: "nomad"),
                auth: .init(redirectToURL: CloudConfig.redirect, flowType: .pkce)
            )
        )
    }

    /// Follows the session for the life of the app: the first event is the stored session (or none), later ones
    /// sign-ins, refreshes and sign-outs. Each signed-in session pulls once.
    func start() async {
        for await (_, session) in client.auth.authStateChanges {
            self.session = session
            ready = true
            if session == nil {
                plans = []
                profile = ProfileRecord()
            } else {
                await pull()
            }
        }
    }

    /// Google through the system's web sign-in sheet (Google refuses embedded web views). The session comes back
    /// through `CloudConfig.redirect`, which the library completes itself.
    func signIn() async {
        error = nil
        do {
            _ = try await client.auth.signInWithOAuth(provider: .google, redirectTo: CloudConfig.redirect)
        } catch {
            if (error as? AuthError).map(isCancelled) != true { self.error = error.localizedDescription }
        }
    }

    /// This device only, like the web app's ordinary sign-out: the cloud rows and the other devices stay.
    func signOut() async {
        try? await client.auth.signOut(scope: .local)
    }

    /// A callback that reached the app as an opened URL rather than through the sign-in sheet.
    func handle(_ url: URL) async {
        guard url.scheme == CloudConfig.redirect.scheme else { return }
        do { try await client.auth.session(from: url) } catch { self.error = error.localizedDescription }
    }

    /// Reads every year's plan and the profile. Called on sign-in, when the app comes to the front and on pull-to-refresh.
    func pull() async {
        guard session != nil, !loading else { return }
        loading = true
        defer { loading = false }
        do {
            let rows: [PlanRow] = try await Self.rows(client, from: "plans", columns: "year, data", orderBy: "year")
            plans = rows.map(\.data)
            let settings: [SettingsRow] = try await Self.rows(client, from: "settings", columns: "data", limit: 1)
            profile = settings.first?.data ?? ProfileRecord()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    private struct PlanRow: Decodable, Sendable { let year: Int; let data: PlanRecord }
    private struct SettingsRow: Decodable, Sendable { let data: ProfileRecord }

    /// Runs a select off the main actor and hands back only the decoded rows: the library's response type isn't
    /// Sendable, so it must not cross into the actor.
    nonisolated private static func rows<T: Decodable & Sendable>(
        _ client: SupabaseClient, from table: String, columns: String, orderBy: String? = nil, limit: Int? = nil
    ) async throws -> [T] {
        var query: PostgrestTransformBuilder = client.from(table).select(columns)
        if let orderBy { query = query.order(orderBy) }
        if let limit { query = query.limit(limit) }
        return try await query.execute().value
    }

    private func isCancelled(_ error: AuthError) -> Bool {
        // The person closed the sign-in sheet: not worth a message.
        error.localizedDescription.localizedCaseInsensitiveContains("cancel")
    }
}
