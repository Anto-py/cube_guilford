/**
 * Raccourcis clavier du parcours.
 */
export function brancherClavier({ suivant, precedent, zoomer, recentrer, fermer }) {
  document.addEventListener('keydown', (ev) => {
    const cible = ev.target;
    if (cible instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) {
      return;
    }

    switch (ev.key) {
      case 'ArrowRight':
        ev.preventDefault();
        suivant();
        break;
      case 'ArrowLeft':
        ev.preventDefault();
        precedent();
        break;
      case '+':
      case '=':
        ev.preventDefault();
        zoomer(1.15);
        break;
      case '-':
      case '_':
        ev.preventDefault();
        zoomer(1 / 1.15);
        break;
      case '0':
        ev.preventDefault();
        recentrer();
        break;
      case 'Escape':
        fermer();
        break;
      default:
        break;
    }
  });
}
