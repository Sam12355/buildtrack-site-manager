import XCTest

@testable import CheckIn

/// NOT EXECUTED. No macOS and no Xcode on the build machine. The CI job runs these.
final class CheckInScheduleTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_773_000_000)

    func testNeverCheckedInIsNotOverdue() {
        // Somebody who has just installed the app should not be greeted by a warning.
        XCTAssertFalse(CheckInSchedule.isOverdue(lastCheckIn: nil, at: now))
    }

    func testRecentCheckInIsNotOverdue() {
        let recent = CheckIn(recordedAt: now.addingTimeInterval(-3600))
        XCTAssertFalse(CheckInSchedule.isOverdue(lastCheckIn: recent, at: now))
    }

    func testOldCheckInIsOverdue() {
        let old = CheckIn(recordedAt: now.addingTimeInterval(-9 * 3600))
        XCTAssertTrue(CheckInSchedule.isOverdue(lastCheckIn: old, at: now))
    }

    func testExactlyAtTheIntervalIsNotYetOverdue() {
        // The boundary belongs to not-overdue, so a check-in at exactly the interval does
        // not flip state in the same second it was made.
        let boundary = CheckIn(recordedAt: now.addingTimeInterval(-CheckInSchedule.defaultInterval))
        XCTAssertFalse(CheckInSchedule.isOverdue(lastCheckIn: boundary, at: now))
    }

    func testNextDueIsOneIntervalAfterTheCheckIn() {
        let checkIn = CheckIn(recordedAt: now)
        XCTAssertEqual(
            CheckInSchedule.nextDue(after: checkIn),
            now.addingTimeInterval(CheckInSchedule.defaultInterval)
        )
    }

    func testAWhitespaceOnlyNoteBecomesNil() {
        XCTAssertNil(CheckIn(recordedAt: now, note: "   ").note)
    }
}
