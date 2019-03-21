package com.guardianlink.checkin

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mirrors the iOS suite case for case, including the boundary.
 *
 * NOT EXECUTED. No Gradle distribution on the build machine. The CI job runs these.
 */
class CheckInScheduleTest {

    private val now = 1_773_000_000_000L

    @Test
    fun `never checked in is not overdue`() {
        assertFalse(CheckInSchedule.isOverdue(null, now))
    }

    @Test
    fun `recent check-in is not overdue`() {
        val recent = CheckIn(recordedAtMillis = now - 3_600_000)
        assertFalse(CheckInSchedule.isOverdue(recent, now))
    }

    @Test
    fun `old check-in is overdue`() {
        val old = CheckIn(recordedAtMillis = now - 9 * 3_600_000)
        assertTrue(CheckInSchedule.isOverdue(old, now))
    }

    @Test
    fun `exactly at the interval is not yet overdue`() {
        // The boundary belongs to not-overdue, matching iOS.
        val boundary = CheckIn(recordedAtMillis = now - CheckInSchedule.DEFAULT_INTERVAL_MS)
        assertFalse(CheckInSchedule.isOverdue(boundary, now))
    }

    @Test
    fun `next due is one interval after the check-in`() {
        val checkIn = CheckIn(recordedAtMillis = now)
        assertEquals(now + CheckInSchedule.DEFAULT_INTERVAL_MS, CheckInSchedule.nextDue(checkIn))
    }

    @Test
    fun `a whitespace only note becomes null`() {
        assertNull(CheckIn(recordedAtMillis = now, note = "   ").cleanNote)
    }
}
