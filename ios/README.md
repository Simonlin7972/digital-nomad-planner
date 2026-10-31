# Not WFH for iOS

The planner's phone app: a native, read-only view of the plan made on a computer. It signs in with the same Google
account, reads the same `nomad.plans` and `nomad.settings` rows the web app syncs to (see `docs/nomad-schema.sql`),
and shows where you are now, where you go next and every stay, in Traditional Chinese, English or Japanese after the
phone's language. It never writes: the web app owns the plan and the sync rules, and a device that only pulls can't
clash with them.

## Layout

```
project.yml          XcodeGen definition of the app target; NotWFH.xcodeproj is generated from it and not in git
NotWFH/              the app (SwiftUI, iOS 17+)
  NotWFHApp.swift    entry: follows the session, pulls when the app comes to the front, takes the sign-in redirect
  Cloud/Cloud.swift  the Supabase client (schema nomad, same project and anon key as src/lib/cloud.ts), Google sign-in
                     through the system sheet, sign-out of this device, pull of every year's plan and the profile
  Views/             RootView (signed out / in), SignInView, ItineraryView (now / next, upcoming, past, Schengen line),
                     NowNextCard, StayRow
  Localizable.xcstrings, InfoPlist.xcstrings   every string in zh-Hant, en and ja, the app's name included
NotWFHCore/          a Swift package with no UI and no network, ported from src/lib:
  Plan.swift         Ticket / StayRecord / PlanRecord exactly as `serialize()` writes them, lenient like `sanitize`;
                     Stay with dates resolved; ProfileRecord (the parts of Profile the phone reads)
  Days.swift         day arithmetic: a day is days since 1970-01-01 in UTC (the web counts from each year's first
                     Monday; with every year in one list there is no need), `covered` counts a travel day once
  StayRules.swift    Schengen 90/180 and the 183-day residence count, the Schengen and free-movement country lists
  Itinerary.swift    now / next / upcoming / past, the same rules as components/MobileItinerary.tsx
  PlaceName.swift    country names from the system locale (like Intl.DisplayNames), flag emoji; cities show their
                     stored English name until the city list is exported from src/lib/cities.ts
  Tests/             XCTest cases for all of the above (run from Xcode, or `swift test` with Xcode installed)
```

## Setup

1. Install Xcode 16 or later (the command line tools alone can't build an iOS app or run XCTest).
2. `brew install xcodegen`, then in this folder `xcodegen generate` and open `NotWFH.xcodeproj`. Re-run `xcodegen
   generate` after changing `project.yml` or adding files outside the `NotWFH/` folder (files inside it are picked up).
3. Xcode resolves the two packages: `NotWFHCore` (local) and `supabase-swift`.
4. Pick your team under Signing & Capabilities and run on a simulator or phone.

Signing in needs one Supabase dashboard setting, once: Authentication → URL Configuration → Additional Redirect URLs
must include `notwfh://auth-callback` (`CloudConfig.redirect`, the URL scheme in `project.yml`). Until it is there,
the Google sheet completes and Supabase refuses the redirect.

## What isn't here yet

- Sign in with Apple. The App Store requires it alongside any third-party sign-in (guideline 4.8). It also needs the
  Apple provider in the Supabase project, and an account made with Apple is a different user from the same person's
  Google account unless the identities are linked, so the Google route is the one that shares the plan with the web.
- Widgets and Live Activities (the reason to be native): a now / next widget would read the same `Cloud.pull()`.
- The city list's Chinese names, season notes and holiday sets: a script to export them from `src/lib` as JSON.
- Realtime: the app pulls on launch, on returning to the front and on pull-to-refresh, not on a change feed.
- An app icon and launch image.
- Analytics: none, on purpose. Nothing is sent anywhere except Supabase.
