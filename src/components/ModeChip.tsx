import { Copy } from '@phosphor-icons/react/dist/csr/Copy';
import { Scissors } from '@phosphor-icons/react/dist/csr/Scissors';
import { t, useLocale } from '../lib/i18n';
import { Presence } from './Presence';
import './ModeChip.css';

// A small label in the corner of a view saying what the held key does (B: cut, ⌥: copy), so the changed cursor
// isn't the only clue. Fades in while the key is down and out when it is let go.
export function ModeChip({ mode }: { mode: 'cut' | 'copy' | null }) {
  useLocale();
  return (
    <Presence show={mode !== null}>
      {mode && (
        <span className="mode-chip" role="status">
          {mode === 'cut' ? <Scissors size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
          {t(mode === 'cut' ? 'mode.cut' : 'mode.copy')}
        </span>
      )}
    </Presence>
  );
}
