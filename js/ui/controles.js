/**
 * Boutons toujours visibles : zoom, dézoom, recentrage.
 */
export function creerControles(actions) {
  const conteneur = document.getElementById('controles');

  conteneur.addEventListener('click', (ev) => {
    const bouton = ev.target.closest('button[data-controle]');
    if (!bouton) return;

    switch (bouton.dataset.controle) {
      case 'plus':
        actions.zoomer(1.2);
        break;
      case 'moins':
        actions.zoomer(1 / 1.2);
        break;
      default:
        actions.recentrer();
    }
  });
}
