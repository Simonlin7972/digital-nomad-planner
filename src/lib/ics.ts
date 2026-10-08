// A one-event calendar file for a flight, from the ticket's departure ("2027-01-04T09:10", local time at the
// airport, or a date alone). The time is written without a zone ("floating"), so the calendar shows it as typed;
// a date alone becomes an all-day event.

const escape = (text: string) => text.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function flightIcs(departure: string, summary: string, description: string): Blob | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(departure);
  if (!m) return null;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//digital-nomad-planner//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}`,
    `DTSTAMP:${stamp}`,
    ...(m[4] ? [`DTSTART:${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00`, 'DURATION:PT1H'] : [`DTSTART;VALUE=DATE:${m[1]}${m[2]}${m[3]}`]),
    `SUMMARY:${escape(summary)}`,
    ...(description ? [`DESCRIPTION:${escape(description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar' });
}
