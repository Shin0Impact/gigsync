import {
  find_recurring_events_ready_to_generate,
} from '../db/queries/events.queries';
import {
  generate_next_recurring_event,
} from './events.service';

/**
 * Generates the next occurrence for every recurring event
 * that is ready.
 *
 * The database query makes sure we only select an occurrence
 * that:
 * - is recurring
 * - has already started
 * - does not already have a child occurrence
 *
 * Each occurrence generates its own next occurrence, so the
 * previous event does not need to remain in the database forever.
 */
export async function process_recurring_events(): Promise<void> {
  const events = await find_recurring_events_ready_to_generate();

  for (const event of events) {
    try {
      await generate_next_recurring_event(event.id);

      console.log(
        `[recurrence] Generated next occurrence for event ${event.id}`,
      );
    } catch (error) {
      console.error(
        `[recurrence] Failed to generate next occurrence for event ${event.id}`,
        error,
      );
    }
  }
}
