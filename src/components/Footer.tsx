import { House } from '@phosphor-icons/react/dist/csr/House';
import { Megaphone } from '@phosphor-icons/react/dist/csr/Megaphone';
import { LockSimple } from '@phosphor-icons/react/dist/csr/LockSimple';
import { t, useLocale } from '../lib/i18n';
import { CHANGELOG_URL, HOME_URL } from '../lib/links';
import './Footer.css';

// A quiet line at the bottom of the planner: where the data lives, the licence, and links home, to the changelog
// page.
export function Footer() {
  useLocale();
  return (
    <footer className="app-footer">
      <span className="app-footer-note">
        <LockSimple size={14} weight="bold" />
        {t('footer.local')}
      </span>
      <span>{t('landing.footer')}</span>
      <nav>
        <a href={HOME_URL}>
          <House size={14} weight="bold" />
          {t('footer.home')}
        </a>
        <a href={CHANGELOG_URL}>
          <Megaphone size={14} weight="bold" />
          {t('changelog.title')}
        </a>
      </nav>
    </footer>
  );
}
