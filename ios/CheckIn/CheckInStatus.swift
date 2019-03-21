import Foundation

/// The whole domain of the check-in app.
///
/// The app is deliberately small: a list of check-ins and a button. It exists to give the
/// release pipeline something real to build, sign, gate and ship. Anything larger would
/// obscure what this repository is about.
///
/// It is still written properly, because a toy app with untestable code would undermine
/// the point: the gates only mean something if there is something for them to gate.
struct CheckIn: Equatable, Identifiable, Codable {
    let id: UUID
    let recordedAt: Date
    let note: String?

    init(id: UUID = UUID(), recordedAt: Date, note: String? = nil) {
        self.id = id
        self.recordedAt = recordedAt
        self.note = note?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}

/// Decides whether a check-in is overdue.
///
/// Pure, and time is a parameter, so the tests do not wait. Same rule as the flagship.
enum CheckInSchedule {
    static let defaultInterval: TimeInterval = 8 * 3600

    static func isOverdue(lastCheckIn: CheckIn?, at now: Date, interval: TimeInterval = defaultInterval) -> Bool {
        guard let lastCheckIn else {
            // Never checked in is not overdue. Somebody who has just installed the app
            // should not be greeted by a warning.
            return false
        }
        return now.timeIntervalSince(lastCheckIn.recordedAt) > interval
    }

    static func nextDue(after checkIn: CheckIn, interval: TimeInterval = defaultInterval) -> Date {
        checkIn.recordedAt.addingTimeInterval(interval)
    }
}
