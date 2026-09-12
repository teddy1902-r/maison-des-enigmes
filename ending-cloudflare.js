// Image finale livrée uniquement par le Worker après une accusation correcte.
window.whoFinish = async () => {
  const g = window.who;
  if (!g) return;
  const remaining = whoSuspects.filter(s => !g.eliminated.has(s.id));
  if (remaining.length !== 1) {
    modal('ENQUÊTE INCOMPLÈTE','Choisissez une personne','Pour terminer, un seul portrait doit rester.',`<button class="primary" onclick="renderWhoIsIt()">RETOURNER AUX INDICES</button>`);
    return;
  }
  const chosen = remaining[0];
  modal('VÉRIFICATION','Vérification en cours','<p>Votre accusation est en cours de vérification…</p>');
  try {
    const r = await fetch(`${WHO_API}/verify`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({suspect: chosen.id}),
      cache: 'no-store'
    });
    if (!r.ok) throw new Error('verify');
    const data = await r.json();
    if (data.correct) {
      g.finished = true;
      window.verifiedCulprit = chosen;
      window.finalEndingImage = typeof data.finalImage === 'string' ? data.finalImage : '';
      finishInvestigation();
    } else {
      modal('ENQUÊTE ÉCHOUÉE','Mauvaise personne','Ce suspect n’est pas le bon. Aucun malus : recommencez le Qui est-ce ?.',`<button class="primary" onclick="whoIsItGame()">RECOMMENCER</button>`);
    }
  } catch (e) {
    modal('CONNEXION','Vérification impossible','<p>Impossible de joindre le service de validation. Réessayez.</p>',`<button class="primary" onclick="whoFinish()">RÉESSAYER</button>`);
  }
};

window.showConclusion = function () {
  const culprit = window.verifiedCulprit || null;
  closeModal();
  $('game').classList.add('hidden');
  $('end-screen').classList.remove('hidden');
  $('end-label').textContent = 'AFFAIRE RÉSOLUE';
  $('end-title').textContent = 'LE TUEUR EST DÉMASQUÉ';
  const art = $('end-art');
  if (art) {
    if (window.finalEndingImage) {
      art.src = window.finalEndingImage;
      art.alt = 'Arrestation du coupable';
    } else {
      art.removeAttribute('src');
      art.alt = 'Affaire résolue';
    }
  }
  $('end-text').textContent = culprit ? `${culprit.name} est le coupable. Vous avez résolu l’enquête.` : 'Vous avez résolu l’enquête.';
};
