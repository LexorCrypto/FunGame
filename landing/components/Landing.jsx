'use client';

import { useEffect, useState } from 'react';
import TeaserCanvas from './TeaserCanvas';
import i18n from '../lib/i18n';
import { useGameStore } from '../lib/store';

export default function Landing() {
  const locale = useGameStore((state) => state.locale);
  const toggleLocale = useGameStore((state) => state.toggleLocale);
  const zaps = useGameStore((state) => state.zaps);
  const breached = useGameStore((state) => state.breached);
  const [dossierIndex, setDossierIndex] = useState(0);
  const copy = i18n[locale];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDossierIndex((current) => (current + 1) % copy.dossier.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [copy.dossier.length]);

  return (
    <main className="landing">
      <header className="header">
        <div>
          <h1>PISSUARIUS</h1>
          <p className="subtitle">{copy.subtitle}</p>
        </div>
        <div className="language-switcher" aria-label={copy.lang}>
          <button className={locale === 'ru' ? 'is-active' : ''} type="button" onClick={locale === 'ru' ? undefined : toggleLocale}>RU</button>
          <span aria-hidden="true">|</span>
          <button className={locale === 'en' ? 'is-active' : ''} type="button" onClick={locale === 'en' ? undefined : toggleLocale}>EN</button>
        </div>
      </header>

      <section className="teaser" aria-label="Pissuarius teaser">
        <TeaserCanvas />
      </section>

      <section className="counters" aria-live="polite">
        <p>{copy.cleaned}: <strong>{zaps}</strong></p>
        <p>{copy.breached}: <strong>{breached}</strong></p>
      </section>

      <p className="dossier" key={`${locale}-${dossierIndex}`}>{copy.dossier[dossierIndex]}</p>

      <a className="play-button" href="./game.html">{copy.play}</a>
      <p className="controls">{copy.controls}</p>
    </main>
  );
}
