package com.buildtrack.checkin

import java.util.UUID

/**
 * The whole domain of the check-in app.
 *
 * Deliberately the same shape as the iOS version, including the boundary rule: a check-in
 * at exactly the interval is not yet overdue. The two platforms have to agree, and the
 * only way to keep them agreeing is to assert it on both sides.
 *
 * No Android imports. Time is a parameter, so the tests are plain JVM tests.
 */
data class CheckIn(
    val id: UUID = UUID.randomUUID(),
    val recordedAtMillis: Long,
    val note: String? = null,
) {
    val cleanNote: String? get() = note?.trim()?.ifEmpty { null }
}

object CheckInSchedule {
    const val DEFAULT_INTERVAL_MS = 8 * 60 * 60 * 1000L

    fun isOverdue(
        lastCheckIn: CheckIn?,
        nowMillis: Long,
        intervalMillis: Long = DEFAULT_INTERVAL_MS,
    ): Boolean {
        // Never checked in is not overdue. Somebody who has just installed the app should
        // not be greeted by a warning.
        if (lastCheckIn == null) return false
        return nowMillis - lastCheckIn.recordedAtMillis > intervalMillis
    }

    fun nextDue(after: CheckIn, intervalMillis: Long = DEFAULT_INTERVAL_MS): Long =
        after.recordedAtMillis + intervalMillis
}
