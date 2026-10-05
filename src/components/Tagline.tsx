import { useEffect, useState } from 'react';
import { t } from '../lib/i18n';
import './Tagline.css';

const TYPE_MS = 55;
const ERASE_MS = 28;
const HOLD_MS = 1500;
const GAP_MS = 350;

// The line under the title. On load it types out each phrase in turn, erasing the earlier ones, and stops on the
// last. It plays once; with reduced motion it shows the last phrase straight away.
export function Tagline() {
  const phrases = [t('app.tagline.1'), t('app.tagline.2'), t('app.tagline.3')];
  const last = phrases[phrases.length - 1];
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [text, setText] = useState(still ? last : '');
  const [done, setDone] = useState(still);

  useEffect(() => {
    if (still) return;
    let timer = 0;
    let index = 0;
    let length = 0;
    let erasing = false;
    const step = () => {
      const phrase = phrases[index];
      if (!erasing) {
        length++;
        setText(phrase.slice(0, length));
        if (length < phrase.length) timer = window.setTimeout(step, TYPE_MS);
        else if (index === phrases.length - 1) setDone(true);
        else {
          erasing = true;
          timer = window.setTimeout(step, HOLD_MS);
        }
      } else {
        length--;
        setText(phrase.slice(0, length));
        if (length > 0) timer = window.setTimeout(step, ERASE_MS);
        else {
          erasing = false;
          index++;
          timer = window.setTimeout(step, GAP_MS);
        }
      }
    };
    timer = window.setTimeout(step, GAP_MS);
    return () => window.clearTimeout(timer);
    // Runs once on mount: the phrases are the same in both languages.
  }, []);

  return (
    <p className="tagline" lang="en" aria-label={last}>
      <span aria-hidden="true">{text}</span>
      {!done && <span className="caret" aria-hidden="true" />}
    </p>
  );
}
