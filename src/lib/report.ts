// Problem reports, sent by e-mail through FormSubmit (formsubmit.co), since the site has no backend of its own.
// Only what the person typed, their screenshots and a line about their browser go out; never the plan.
//
// The first report sent to a new address makes FormSubmit e-mail that address a one-time confirmation link; reports
// are delivered once it has been clicked. FormSubmit then offers a random alias for the address: put it here instead,
// so the address doesn't sit in the page's source.
import { getLocale } from './i18n';
import { YEAR } from './weeks';

const ENDPOINT = 'https://formsubmit.co/ajax/a97210230@gmail.com';

export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// FormSubmit takes at most 10MB of files per message, so pictures are scaled down (longest side 1920px) and
// re-encoded as JPEG before sending; three screenshots then come to well under the limit.
const MAX_SIDE = 1920;
const TOTAL_BYTES = 9 * 1024 * 1024;

async function shrink(file: File, quality: number): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // already small enough as it was
    return new File([blob], file.name.replace(/\.[^.]*$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // a format the browser can't draw: send it as it is
  }
}

async function shrinkAll(files: File[]): Promise<File[]> {
  for (const quality of [0.85, 0.7, 0.5]) {
    const out = await Promise.all(files.map((f) => shrink(f, quality)));
    if (out.reduce((n, f) => n + f.size, 0) <= TOTAL_BYTES) return out;
  }
  throw new Error('Images too large');
}

export type Report = { title: string; body: string; email: string; images: File[] };

// What helps reproduce a problem, and nothing from the plan: page, language, year on screen, window size, browser.
function context(): string {
  return [
    `Page: ${location.pathname}`,
    `Language: ${getLocale()}`,
    `Year: ${YEAR}`,
    `Window: ${window.innerWidth}×${window.innerHeight}`,
    `Browser: ${navigator.userAgent}`,
  ].join('\n');
}

export async function sendReport(report: Report): Promise<void> {
  const form = new FormData();
  // The mail's subject: 問題回報：<the title they wrote>
  form.append('_subject', `問題回報：${report.title}`);
  form.append('_template', 'table');
  form.append('_captcha', 'false');
  form.append('title', report.title);
  form.append('message', report.body);
  // FormSubmit uses a field named "email" as the reply-to address.
  if (report.email) form.append('email', report.email);
  form.append('context', context());
  const images = await shrinkAll(report.images);
  images.forEach((file, i) => form.append(i === 0 ? 'attachment' : `attachment${i + 1}`, file, file.name));
  const res = await fetch(ENDPOINT, { method: 'POST', body: form, headers: { Accept: 'application/json' } });
  const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null;
  if (!res.ok || data?.success === false || data?.success === 'false') throw new Error('Report not sent');
}
