import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ImageSquare } from '@phosphor-icons/react/dist/csr/ImageSquare';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useScrollLock } from '../hooks/useScrollLock';
import { t, useLocale } from '../lib/i18n';
import { MAX_IMAGES, MAX_IMAGE_BYTES, sendReport } from '../lib/report';
import './Dialog.css';
import './Editor.css';
import './ReportDialog.css';

type Shot = { file: File; url: string };

// Report a problem or suggest something: a title, what happened, up to three screenshots and, if they like, an address to reply to.
// Sent by e-mail (see lib/report.ts); nothing from the plan is included.
export function ReportDialog({ onClose }: { onClose: () => void }) {
  useLocale();
  useScrollLock();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [shots, setShots] = useState<Shot[]>([]);
  const [problem, setProblem] = useState(''); // a message about the pictures or the sending
  const [state, setState] = useState<'editing' | 'sending' | 'sent'>('editing');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && state !== 'sending' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, state]);
  // Previews are object URLs; let them go when the dialog closes.
  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.url)), [shots]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    const tooBig = images.filter((f) => f.size > MAX_IMAGE_BYTES);
    const room = MAX_IMAGES - shots.length;
    const fitting = images.filter((f) => f.size <= MAX_IMAGE_BYTES).slice(0, room);
    setShots((prev) => [...prev, ...fitting.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    setProblem(
      tooBig.length
        ? t('report.tooBig', { mb: MAX_IMAGE_BYTES / 1024 / 1024 })
        : images.length - tooBig.length > room
          ? t('report.tooMany', { n: MAX_IMAGES })
          : '',
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || state === 'sending') return;
    setState('sending');
    setProblem('');
    try {
      await sendReport({ title: title.trim(), body: body.trim(), email: email.trim(), images: shots.map((s) => s.file) });
      setState('sent');
    } catch {
      setState('editing');
      setProblem(t('report.failed'));
    }
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && state !== 'sending' && onClose()}>
      <form className="editor report" onSubmit={submit} aria-labelledby="report-title">
        <h2 id="report-title">
          {t('report.title')}
          <button type="button" className="close" onClick={onClose} aria-label={t('help.close')} disabled={state === 'sending'}>
            <X size={16} weight="bold" />
          </button>
        </h2>

        {state === 'sent' ? (
          <div className="report-sent" role="status">
            <CheckCircle size={40} weight="bold" />
            <p>{t('report.thanks')}</p>
            <div className="buttons">
              <span className="spacer" />
              <button type="button" className="primary" onClick={onClose} autoFocus>
                {t('help.close')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <label>
              {t('report.subject')}
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t('report.subjectPh')} required autoFocus />
            </label>
            <label>
              {t('report.body')}
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={4000} placeholder={t('report.bodyPh')} required />
            </label>
            <div className="field">
              {t('report.images', { n: MAX_IMAGES })}
              <div className="report-shots">
                {shots.map((s, i) => (
                  <div key={s.url} className="report-shot">
                    <img src={s.url} alt={s.file.name} />
                    <button
                      type="button"
                      aria-label={t('report.remove')}
                      onClick={() => {
                        URL.revokeObjectURL(s.url);
                        setShots((prev) => prev.filter((_, j) => j !== i));
                      }}
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </div>
                ))}
                {shots.length < MAX_IMAGES && (
                  <button type="button" className="report-add" onClick={() => fileRef.current?.click()}>
                    <ImageSquare size={20} weight="bold" />
                    {t('report.add')}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            <label>
              {t('report.email')}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} placeholder={t('report.emailPh')} />
            </label>
            {problem && <p className="error">{problem}</p>}
            <p className="report-note">{t('report.note')}</p>
            <div className="buttons">
              <span className="spacer" />
              <button type="button" onClick={onClose} disabled={state === 'sending'}>
                {t('editor.cancel')}
              </button>
              <button type="submit" className="primary" disabled={!title.trim() || !body.trim() || state === 'sending'}>
                {state === 'sending' ? t('report.sending') : t('report.send')}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
