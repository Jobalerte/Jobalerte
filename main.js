/* ==========================================================================
   JobAlerte — main.js
   Menu mobile, animations au scroll, bandeau d'alerte, offres récentes (accueil)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollReveal();
  initHeaderShadowOnScroll();
  loadRecentOffers();
});

/* ---------- Menu mobile ---------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Ombre légère sur le header au scroll ---------- */
function initHeaderShadowOnScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 8 ? '0 4px 16px rgba(0,0,0,0.06)' : 'none';
  }, { passive: true });
}

/* ---------- Reveal au scroll (IntersectionObserver) ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
}

/* ---------- Formatage d'une date ISO en libellé FR court ---------- */
function formatDateFr(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_LABELS = { emploi: 'Emploi', stage: 'Stage', formation: 'Formation' };

/* ---------- Charge et affiche les offres récentes sur la page d'accueil ---------- */
async function loadRecentOffers() {
  const grid = document.querySelector('#offres-recentes-grid');
  const ticker = document.querySelector('#alert-ticker-track');
  if (!grid && !ticker) return;

  try {
    const res = await fetch('data/offres.json');
    const data = await res.json();
    let offres = (data.offres || []).slice();

    // Tri par date limite la plus proche
    offres.sort((a, b) => new Date(a.dateLimite) - new Date(b.dateLimite));

    if (grid) {
      const recent = offres.slice(0, 6);
      grid.innerHTML = recent.map(offreCardHTML).join('') ||
        '<p>Aucune offre disponible pour le moment. Revenez bientôt !</p>';
    }

    if (ticker) {
      const tickerItems = offres.slice(0, 8)
        .map(o => `<span>🔔 <b>${escapeHTML(o.titre)}</b> — ${escapeHTML(o.entreprise)} · ${escapeHTML(o.lieu)}</span>`)
        .join('');
      // Dupliqué pour un défilement continu sans coupure
      ticker.innerHTML = tickerItems + tickerItems;
    }
  } catch (err) {
    if (grid) grid.innerHTML = '<p>Impossible de charger les offres pour le moment.</p>';
    console.error('Erreur de chargement des offres :', err);
  }
}

function offreCardHTML(o) {
  const badgeClass = `badge-${o.type}`;
  return `
    <article class="offre-card reveal">
      <div class="offre-card__top">
        <span class="alert-card__badge ${badgeClass}">${TYPE_LABELS[o.type] || o.type}</span>
        <span class="alert-card__time">Limite : ${formatDateFr(o.dateLimite)}</span>
      </div>
      <h4>${escapeHTML(o.titre)}</h4>
      <p class="entreprise">${escapeHTML(o.entreprise)}</p>
      <div class="offre-meta">
        <span>📍 ${escapeHTML(o.lieu)}</span>
      </div>
      <a class="btn btn-outline" href="offres.html">Voir l'offre</a>
    </article>
  `;
}

/* ---------- Sanitisation basique pour éviter l'injection HTML ---------- */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
