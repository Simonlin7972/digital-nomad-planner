// Moving a plan to another device by link: every year's plan, compressed into the part of the address after #.
// Browsers never send that part to the server, so the plan goes from one browser to the other without passing
// through the site. Opening the link imports it the same way a file import does.

const HASH = '#plan=';

// The link's first character says how the rest is packed: z = deflate-raw, j = plain JSON (browsers without
// CompressionStream). Both are base64url.
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

// The export file's shape, as far as the link needs it.
type ExportStay = {
  country: string;
  city: string;
  start: string;
  end: string;
  color?: string;
  companions?: string;
  note?: string;
  ticket?: Record<string, string>;
};
type ExportFile = { version: number; years: Record<string, { year: number; stays: ExportStay[] }> };

const TICKET_KEYS = ['airline', 'flightNo', 'departure', 'bookingRef', 'price'] as const;
const DAY_MS = 86_400_000;
const dayOf = (iso: string, year: number) => Math.round((Date.parse(iso) - Date.UTC(year, 0, 1)) / DAY_MS);
const isoOf = (day: number, year: number) => new Date(Date.UTC(year, 0, 1) + day * DAY_MS).toISOString().slice(0, 10);

// The link packs the export file tighter than the file does, so a full plan still fits in a QR code: no stay ids
// (an import makes new ones), each stay a row [days since the previous one ended, length, country, city, color,
// companions, note, ticket], dates counted from 1 January, the ticket a row of its fields, empty ends dropped.
// A whole year with notes and flights comes to well under a thousand characters.
function pack(file: ExportFile) {
  const years: Record<string, unknown[]> = {};
  for (const [key, plan] of Object.entries(file.years)) {
    let prev = 0;
    years[key] = plan.stays.map((s) => {
      const start = dayOf(s.start, plan.year);
      const end = dayOf(s.end, plan.year);
      const ticket = s.ticket ? TICKET_KEYS.map((k) => s.ticket![k] ?? '') : 0;
      if (Array.isArray(ticket)) while (ticket.length && !ticket[ticket.length - 1]) ticket.pop();
      const row: unknown[] = [start - prev, end - start, s.country, s.city, s.color ?? '', s.companions ?? '', s.note ?? '', ticket];
      while (row.length && (row[row.length - 1] === '' || row[row.length - 1] === 0)) row.pop();
      prev = end;
      return row;
    });
  }
  return { v: 3, y: years };
}

// Back to the export file's shape, for the same sanitising import as a file.
function unpack(data: { v: number; y: Record<string, unknown[][]> }): ExportFile {
  const years: ExportFile['years'] = {};
  for (const [key, rows] of Object.entries(data.y)) {
    const year = Number(key);
    let prev = 0;
    years[key] = {
      year,
      stays: rows.map(([gap, length, country = '', city = '', color, companions, note, ticket]) => {
        const start = prev + Number(gap);
        const end = start + Number(length);
        prev = end;
        return {
          country: String(country),
          city: String(city),
          start: isoOf(start, year),
          end: isoOf(end, year),
          ...(color ? { color: String(color) } : {}),
          ...(companions ? { companions: String(companions) } : {}),
          ...(note ? { note: String(note) } : {}),
          ...(Array.isArray(ticket)
            ? { ticket: Object.fromEntries(TICKET_KEYS.flatMap((k, i) => (ticket[i] ? [[k, String(ticket[i])]] : []))) }
            : {}),
        };
      }),
    };
  }
  return { version: 2, years };
}

export async function encodePlan(file: ExportFile): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(pack(file)));
  if (typeof CompressionStream !== 'function') return `j${toBase64Url(bytes)}`;
  return `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
}

// Returns the plan as an export file, ready for sanitizeAll.
export async function decodePlan(code: string): Promise<ExportFile> {
  const bytes = fromBase64Url(code.slice(1));
  const json = code[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  return unpack(JSON.parse(new TextDecoder().decode(json)));
}

// The address to open on the other device: this page, with the plan after #.
export function transferUrl(code: string): string {
  return `${location.origin}${location.pathname}${HASH}${code}`;
}

// Leaves out the booking reference and the fare from every ticket in an export file, keeping the flight itself.
export function withoutTicketDetails(file: ExportFile): ExportFile {
  const copy = structuredClone(file);
  for (const plan of Object.values(copy.years))
    for (const stay of plan.stays) {
      if (!stay.ticket) continue;
      delete stay.ticket.bookingRef;
      delete stay.ticket.price;
    }
  return copy;
}

// Leaves out every note: the fallback when a plan with long notes is too much for one QR code.
export function withoutNotes(file: ExportFile): ExportFile {
  const copy = structuredClone(file);
  for (const plan of Object.values(copy.years)) for (const stay of plan.stays) delete stay.note;
  return copy;
}

let pending: string | null = null;

// Takes a plan link out of the address before anything else reads it, so it never reaches the history, a reload
// or the page view sent to analytics. Call once, first thing on load.
export function takeTransferHash() {
  if (!location.hash.startsWith(HASH)) return;
  pending = location.hash.slice(HASH.length);
  history.replaceState(history.state, '', location.pathname + location.search);
}

// The plan link this page was opened with, once.
export function pendingTransfer(): string | null {
  const code = pending;
  pending = null;
  return code;
}

// A plan link opened in a tab already showing the planner changes only the part after #, which doesn't reload
// the page; this catches that case. Returns the unsubscribe.
export function onTransferLink(handle: (code: string) => void): () => void {
  const listener = () => {
    takeTransferHash();
    const code = pendingTransfer();
    if (code) handle(code);
  };
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}
