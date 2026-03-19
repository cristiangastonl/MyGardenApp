import { Paths, File, Directory } from 'expo-file-system';
import { DiagnosisSeverity, TrackingStatus, Plant, SavedDiagnosis } from '../types';
import { scheduleFollowUpReminder, cancelFollowUpReminder } from '../utils/notificationScheduler';

// Severity label config for UI display (PROB-09)
// Emoji are stored HERE in TRACKING_STATUS_CONFIG.emoji — NOT in i18n translation strings.
// The UI renders: `${TRACKING_STATUS_CONFIG[status].emoji} ${t(TRACKING_STATUS_CONFIG[status].labelKey)}`
// This separation allows reuse of label keys without emoji in contexts where emoji are unwanted.
export const TRACKING_STATUS_CONFIG: Record<TrackingStatus, { emoji: string; labelKey: string; color: string }> = {
  watching:         { emoji: '🟠', labelKey: 'diagnosis.tracking.statusWatching',        color: '#c47a20' },
  needs_attention:  { emoji: '🟡', labelKey: 'diagnosis.tracking.statusNeedsAttention',  color: '#b8960c' },
  recovering:       { emoji: '🟢', labelKey: 'diagnosis.tracking.statusRecovering',      color: '#5b9a6a' },
  resolved:         { emoji: '✅', labelKey: 'diagnosis.tracking.statusResolved',         color: '#5b9a6a' },
};

// DiagnosisSeverity -> initial TrackingStatus (PROB-03, PROB-09)
export function severityToTrackingStatus(severity: DiagnosisSeverity): TrackingStatus {
  switch (severity) {
    case 'severe':   return 'watching';
    case 'moderate': return 'needs_attention';
    case 'minor':    return 'needs_attention';
    case 'healthy':  return 'recovering';
  }
}

// TrackingStatus -> follow-up interval in days (PROB-03)
// Per CONTEXT.md: Watch closely -> 3d, Needs attention -> 7d, minor opt-in -> 14d
export function getFollowUpDays(status: TrackingStatus): number {
  switch (status) {
    case 'watching':        return 3;
    case 'needs_attention': return 7;
    case 'recovering':      return 14;
    case 'resolved':        return 0;
  }
}

// Convenience: severity -> follow-up days (combines both mappings)
// IMPORTANT: minor severity gets 14 days per CONTEXT.md locked decision,
// even though it maps to 'needs_attention' status (which is 7 days).
// The severity-level override ensures the user's 14-day decision is honored.
export function severityToFollowUpDays(severity: DiagnosisSeverity): number {
  if (severity === 'minor') return 14;  // User opts in to track minor; longer interval
  return getFollowUpDays(severityToTrackingStatus(severity));
}

// Calculate follow-up date from now
export function calculateFollowUpDate(severity: DiagnosisSeverity): Date {
  const days = severityToFollowUpDays(severity);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Determine if "Track this problem" button should show (PROB-01)
export function shouldShowTrackButton(overallStatus: DiagnosisSeverity, isPremium: boolean): boolean {
  if (!isPremium) return false;
  if (overallStatus === 'healthy') return false;
  return true;
}

// Determine if track button should show as "optional" (less prominent) -- per CONTEXT.md
export function isTrackingOptional(overallStatus: DiagnosisSeverity): boolean {
  return overallStatus === 'minor';
}

/**
 * Copy a diagnosis photo from cache to persistent storage (PROB-10).
 *
 * IMPORTANT: This function is SYNCHRONOUS. It uses expo-file-system's
 * File.copy() which is a synchronous operation (matching the pattern in
 * photoService.ts). It returns a string, NOT a Promise<string>.
 * Callers MUST NOT await it.
 *
 * Scope: Called for follow-up chat photos when the diagnosis is tracked
 * (isTracked === true). Initial diagnosis photos do not need persistence
 * because they are base64-encoded and sent to the edge function, not stored
 * long-term by URI. Follow-up photos are stored by URI in ProblemEntry.photoUri
 * and must survive cache clears.
 *
 * Call site: usePlantDiagnosis.sendChatMessage, when imageUri is provided
 * and the current diagnosis isTracked.
 */
export function persistDiagnosisPhoto(
  diagnosisId: string,
  cacheUri: string
): string {
  const dirPath = `${Paths.document.uri}diagnosis-photos/${diagnosisId}/`;
  const dir = new Directory(dirPath);
  if (!dir.exists) dir.create();

  const filename = `${Date.now()}.jpg`;
  const dest = new File(`${dirPath}${filename}`);
  const source = new File(cacheUri);
  source.copy(dest);
  return dest.uri;
}

/**
 * Orchestrate the full "Track this problem" flow (PROB-01, NOTF-01, NOTF-04)
 * Called when user taps the Track button in DiagnosisResults.
 */
export async function startTracking(
  plant: Plant,
  diagnosis: SavedDiagnosis,
  trackProblemAction: (
    plantId: string,
    diagnosisId: string,
    trackingStatus: TrackingStatus,
    followUpDate: string,
    notificationId: string | null,
    problemSummary: string
  ) => void
): Promise<void> {
  const severity = diagnosis.severity || diagnosis.result.overallStatus;
  const trackingStatus = severityToTrackingStatus(severity);
  const followUpDate = calculateFollowUpDate(severity);

  // Cancel existing notification if re-tracking (NOTF-04 dedup)
  if (diagnosis.followUpNotificationId) {
    await cancelFollowUpReminder(diagnosis.followUpNotificationId);
  }

  // Schedule follow-up notification (NOTF-01)
  const notificationId = await scheduleFollowUpReminder(plant, diagnosis, followUpDate);

  // Persist tracking data to storage
  trackProblemAction(
    plant.id,
    diagnosis.id,
    trackingStatus,
    followUpDate.toISOString(),
    notificationId,
    diagnosis.problemSummary || diagnosis.result.summary
  );
}
