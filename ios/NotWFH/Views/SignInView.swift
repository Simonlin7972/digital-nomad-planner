import SwiftUI

struct SignInView: View {
    @Environment(Cloud.self) private var cloud
    @State private var busy = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("app.name")
                .font(.largeTitle.weight(.semibold))
            Text("A Digital Nomad Planner")
                .font(.footnote)
                .foregroundStyle(.secondary)
            Text("signin.body")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 32)
            Button {
                busy = true
                Task {
                    await cloud.signIn()
                    busy = false
                }
            } label: {
                Text("signin.button")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(busy)
            .padding(.horizontal, 32)
            if let error = cloud.error {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            Spacer()
            Text("signin.readOnly")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
                .padding(.bottom, 16)
        }
        .tint(.primary)
    }
}
