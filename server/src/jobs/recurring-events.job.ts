import { process_recurring_events } from '../services/recurring-events.service';

const RECURRING_EVENTS_INTERVAL_MS = 60 * 1000; // 1 minute

let is_running = false;

/**
 * Starts the automatic recurring-event processor.
 *
 * Every minute we check the database for recurring events
 * that have started and do not have a next occurrence yet.
 */
export function start_recurring_events_job(): void {
  console.log('[recurrence] Recurring events job started');

  const run = async () => {
    // Prevent overlapping runs if one database operation takes
    // longer than the interval.
    if (is_running) {
      return;
    }

    is_running = true;

    try {
      await process_recurring_events();
    } catch (error) {
      console.error(
        '[recurrence] Recurring events job failed',
        error,
      );
    } finally {
      is_running = false;
    }
  };

  // Run once immediately when the server starts.
  void run();

  // Then check every minute.
  setInterval(() => {
    void run();
  }, RECURRING_EVENTS_INTERVAL_MS);
}
