/* Correctifs et ajustements du jeu chargés après script-core.js. */

/* Navigation robuste après un mini-jeu réussi. */
const originalGoRoom = goRoom;
goRoom = function(n){
  closeModal();
  originalGoRoom(n);
};

/* Après une victoire, la zone porte/tapis devient un accès direct à la suite. */
document.addEventListener('click', function(event){
  const door = event.target.closest('.mini-door-hotspot');
  if(!door) return;
  const n = state.room;
  if(!state.miniSolved[n]) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(n < 3) goRoom(n + 1);
  else showConclusion();
}, true);

/* Pièce 1 : supprimer définitivement le tiroir de la progression et de la scène. */
rooms[1].required = rooms[1].required.filter(id => id !== 'drawer');
state.examined[1].delete('drawer');

/* Pièce 3 : zones recalibrées ; pièce 1 : zone tiroir supprimée à la source des hotspots. */
const originalRoomHotspots = roomHotspots;
roomHotspots = function(n){
  if(n === 1){
    return originalRoomHotspots(1).filter(zone => zone[0] !== 'drawer');
  }
  if(n !== 3) return originalRoomHotspots(n);
  return [
    ["cellardoor","Porte de la cave",58.5,22.5,17.5,40,"polygon(5% 2%,95% 0,100% 96%,4% 100%,0 8%)",()=>objectModal('PORTE','Porte de la cave','La porte devient le point d’accès au dernier mini-jeu une fois toute la cave examinée.'),true,'mini'],
    ["shelves","Étagères",14.5,16.5,26,44,"polygon(0 3%,94% 0,100% 8%,98% 100%,3% 98%)",()=>{clue('Une petite boîte métallique porte une trace de cire noire.');objectModal('ÉTAGÈRES','Étagères','Parmi les bocaux, une petite boîte métallique a été déplacée récemment.');},false],
    ["ampoule","Ampoule",46.8,6.5,5.2,11,"polygon(39% 0,61% 0,78% 18%,74% 49%,62% 70%,61% 91%,39% 100%,38% 73%,25% 52%,22% 22%)",()=>{clue('L’ampoule porte une fine trace de cire noire sur son culot.');objectModal('OBJET','Ampoule','L’ampoule est allumée. Une fine trace sombre apparaît sur le métal du culot.');},false],
    ["crates","Caisses en bois",19,58.5,23,22,"polygon(4% 17%,35% 0,100% 8%,96% 86%,67% 100%,0 88%)",()=>{clue('Une fibre de tissu noir est coincée entre deux planches.');objectModal('TRACE','Caisses en bois','Une fibre sombre est coincée entre les planches. Elle correspond à un vêtement épais.');},false],
    ["barrel","Fût",45.2,42.5,11.5,29,"polygon(19% 0,80% 0,100% 14%,97% 88%,79% 100%,20% 99%,3% 87%,0 14%)",()=>objectModal('OBJET','Fût','Le fût est fermé. Une odeur de solvant flotte autour du bouchon.'),false],
    ["ladder","Échelle",4.2,53.5,20.5,46.5,"polygon(25% 0,75% 0,100% 100%,72% 100%,61% 11%,39% 11%,28% 100%,0 100%)",()=>objectModal('OBJET','Échelle','Une marche porte une marque récente de chaussure.'),false],
    ["workbench","Établi",75.5,49,19.5,32,"polygon(2% 14%,22% 0,91% 4%,100% 22%,97% 89%,75% 100%,6% 96%,0 72%)",()=>{clue('L’établi contient une pince portant des traces de cire noire.');objectModal('OUTIL','Établi','Une pince métallique présente une petite trace de cire noire sur sa poignée.');},false],
    ["greenbarrel","Baril vert",80.2,67,14.5,33,"polygon(22% 0,78% 2,100% 14%,97% 90%,75% 100%,20% 98%,0 87%,2% 15%)",()=>objectModal('OBJET','Baril vert','Le baril est vide. Une marque de cire noire est visible sur le rebord.'),false]
  ];
};

/* Sécurité supplémentaire : aucune ancienne zone tiroir ne doit rester dans le DOM. */
const renderRoomWithoutDrawer = renderRoom;
renderRoom = function(n){
  renderRoomWithoutDrawer(n);
  if(n === 1){
    document.querySelectorAll('[data-hotspot="drawer"]').forEach(zone => zone.remove());
  }
};

/* Gomoku : conserver le plateau après une défaite et permettre de rejouer. */
renderGomoku = function(msg='À vous.', defeated=false){
  const b = window.gomoku;
  const cells = b.flatMap((row,r)=>row.map((v,c)=>`<button class="gomoku-cell ${v?'mark-'+(v==='●'?'human':'ai'):''} ${window.gomokuLast&&window.gomokuLast.r===r&&window.gomokuLast.c===c?'last-move':''}" onclick="gomokuMove(${r},${c})" ${v||window.gomokuBusy||defeated?'disabled':''} aria-label="Ligne ${r+1}, colonne ${c+1}"><span>${v==='●'?'O':v==='×'?'X':''}</span></button>`)).join('');
  const actions = defeated
    ? `<button class="primary" onclick="gomokuGame()">REJOUER</button><button class="secondary" onclick="closeModal()">QUITTER</button>`
    : `<button class="secondary" onclick="closeModal()">QUITTER</button>`;
  const status = defeated
    ? `<p class="mini-msg mini-defeat"><strong>VOUS AVEZ PERDU.</strong> ${msg}</p>`
    : `<p class="mini-msg">${msg}</p>`;
  modal('MINI-JEU · 1/3','Gomoku — Le carnet codé',`<div class="mini-layout"><div class="mini-play gomoku-play"><div class="gomoku-board">${cells}</div>${status}</div><aside class="mini-instructions"><div class="mini-instructions-label">COMMENT JOUER</div><h4>Gomoku</h4><p>Alignez <b>5 O</b> avant les <b>X</b>.</p><ul><li>Vous jouez <b>O</b>.</li><li>L’ordinateur joue <b>X</b>.</li><li>Placez votre symbole sur une case vide.</li><li>Le premier à aligner 5 symboles gagne.</li></ul><div class="mini-tip"><b>À savoir</b><br>L’ordinateur analyse les menaces et les coups possibles à l’avance.</div><div class="mini-no-penalty">Aucune pénalité en cas de défaite.</div></aside></div>`,actions);
};

window.gomokuMove = (r,c)=>{
  const b=window.gomoku;if(!b||window.gomokuBusy||r<0||r>=15||c<0||c>=15||b[r][c])return;
  b[r][c]='●';window.gomokuLast={r,c};renderGomoku('L’ordinateur réfléchit…');
  if(gomokuLines(b,r,c,'●')){winMini(1,'Le carnet codé est déchiffré : la première piste mène au bureau.');return;}
  if(gomokuFull(b)){window.gomokuBusy=true;renderGomoku('Match nul. Vous pouvez rejouer.',true);return;}
  window.gomokuBusy=true;const token=miniSession;miniTimer=setTimeout(()=>{
    miniTimer=null;if(token!==miniSession||!window.gomoku||!window.gomokuBusy)return;
    const move=gomokuAI();if(!move){window.gomokuBusy=false;renderGomoku('À vous.');return;}
    const [ar,ac]=move;if(!window.gomoku[ar]||window.gomoku[ar][ac]){window.gomokuBusy=false;renderGomoku('À vous.');return;}
    window.gomoku[ar][ac]='×';window.gomokuLast={r:ar,c:ac};window.gomokuBusy=false;
    if(gomokuLines(window.gomoku,ar,ac,'×')){window.gomokuBusy=true;renderGomoku('L’ordinateur a aligné cinq X. Le coup gagnant reste affiché sur le plateau.',true);return;}
    if(gomokuFull(window.gomoku)){window.gomokuBusy=true;renderGomoku('Match nul. Vous pouvez rejouer.',true);return;}
    renderGomoku('À vous.');
  },180);
};

/* Puissance 4 : garder le plateau visible après la défaite et montrer précisément l'alignement gagnant. */
function c4WinningCells(b,r,c,p){
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  for(const [dr,dc] of dirs){
    const line=[{r,c}];
    for(let s=1;s<6;s++){
      const rr=r-dr*s,cc=c-dc*s;
      if(rr<0||rr>=6||cc<0||cc>=7||b[rr][cc]!==p)break;
      line.unshift({r:rr,c:cc});
    }
    for(let s=1;s<6;s++){
      const rr=r+dr*s,cc=c+dc*s;
      if(rr<0||rr>=6||cc<0||cc>=7||b[rr][cc]!==p)break;
      line.push({r:rr,c:cc});
    }
    if(line.length>=4)return line;
  }
  return [];
}

const connect4GameBase = connect4Game;
connect4Game = function(){
  window.c4Winning=[];
  window.c4Result='playing';
  connect4GameBase();
};

renderConnect4 = function(msg='À vous.', result=window.c4Result||'playing'){
  const b=window.c4;
  const finished=result==='lost'||result==='draw';
  const winning=new Set((window.c4Winning||[]).map(pos=>`${pos.r}:${pos.c}`));
  const cells=b.flatMap((row,r)=>row.map((v,c)=>{
    const isLast=window.c4Last&&window.c4Last.r===r&&window.c4Last.c===c;
    const isWinning=winning.has(`${r}:${c}`);
    return `<button class="c4-cell ${isLast?'last-move':''} ${isWinning?'winning-cell':''}" onclick="c4Move(${c})" ${v||window.c4Busy||finished?'disabled':''} aria-label="Ligne ${r+1}, colonne ${c+1}${isWinning?', alignement gagnant':''}"><span class="c4-disc ${v===1?'player':v===2?'ai':''}"></span></button>`;
  })).join('');
  const cols=[0,1,2,3,4,5,6].map(c=>`<button class="c4-drop" onclick="c4Move(${c})" ${b[0][c]||window.c4Busy||finished?'disabled':''}>▼</button>`).join('');
  const actions=finished
    ? `<button class="primary" onclick="connect4Game()">REJOUER</button><button class="secondary" onclick="closeModal()">QUITTER</button>`
    : `<button class="secondary" onclick="closeModal()">QUITTER</button>`;
  const status=result==='lost'
    ? `<p class="mini-msg mini-defeat"><strong>VOUS AVEZ PERDU.</strong> ${msg}</p>`
    : result==='draw'
      ? `<p class="mini-msg mini-draw"><strong>MATCH NUL.</strong> ${msg}</p>`
      : `<p class="mini-msg">${msg}</p>`;
  modal('MINI-JEU · 2/3','Puissance 4 — Le dossier',`<div class="mini-layout"><div class="mini-play c4-play"><div class="c4-wrap"><div class="c4-controls">${cols}</div><div class="c4-board">${cells}</div></div>${status}</div><aside class="mini-instructions"><div class="mini-instructions-label">COMMENT JOUER</div><h4>Puissance 4</h4><p>Alignez <b>4 jetons</b> avant l’ordinateur.</p><ul><li>Vous jouez <b>jaune</b>.</li><li>L’ordinateur joue <b>rouge</b>.</li><li>Cliquez sur une flèche pour choisir une colonne.</li><li>Les jetons tombent automatiquement.</li><li>Le premier à aligner 4 jetons gagne.</li></ul><div class="mini-tip"><b>Stratégie</b><br>L’ordinateur bloque les menaces et cherche ses propres alignements, avec une préférence pour le centre.</div><div class="mini-no-penalty">Aucune pénalité en cas de défaite.</div></aside></div>`,actions);
};

window.c4Move = col=>{
  const b=window.c4;if(!b||window.c4Busy||!Number.isInteger(col)||col<0||col>=7||b[0][col])return;
  window.c4Winning=[];
  window.c4Result='playing';
  const r=c4Drop(b,col,1);if(r===null)return;
  window.c4Last={r,c:col};
  renderConnect4('L’ordinateur réfléchit…','playing');
  if(c4Win(b,r,col,1)){winMini(2,'Le dossier du bureau révèle la seconde piste : le dernier appel mène à la cave.');return;}
  if(!c4Moves(b).length){
    window.c4Busy=true;
    window.c4Result='draw';
    renderConnect4('Le plateau est complet. Vous pouvez rejouer.','draw');
    return;
  }
  window.c4Busy=true;
  const token=miniSession;
  miniTimer=setTimeout(()=>{
    miniTimer=null;
    if(token!==miniSession||!window.c4||!window.c4Busy)return;
    const move=c4AI();
    if(move===null){window.c4Busy=false;renderConnect4('À vous.','playing');return;}
    const ar=c4Drop(window.c4,move,2);
    if(ar===null){window.c4Busy=false;renderConnect4('À vous.','playing');return;}
    window.c4Last={r:ar,c:move};
    window.c4Busy=false;
    if(c4Win(window.c4,ar,move,2)){
      window.c4Winning=c4WinningCells(window.c4,ar,move,2);
      window.c4Result='lost';
      window.c4Busy=true;
      renderConnect4('L’alignement gagnant rouge reste surligné sur le plateau. Cliquez sur REJOUER quand vous êtes prêt.','lost');
      return;
    }
    if(!c4Moves(window.c4).length){
      window.c4Result='draw';
      window.c4Busy=true;
      renderConnect4('Le plateau est complet. Vous pouvez rejouer.','draw');
      return;
    }
    window.c4Result='playing';
    renderConnect4('À vous.','playing');
  },180);
};

/* Pièce 3 : la bonde et les planches sont supprimées de la progression. */
rooms[3].required = ['shelves','ampoule','crates','barrel','ladder','workbench','greenbarrel'];
state.examined[3].delete('drain');
state.examined[3].delete('boards');

/* Qui est-ce ? : placer le bouton de navigation juste à côté de la question. */
renderWhoIsIt = function(message=''){
  const g=window.who, qi=g.round, total=whoQuestions.length, q=whoQuestions[qi];
  const order=g.order||whoSuspects;
  const cards=order.map((s,i)=>{
    const dead=g.eliminated.has(s.id);
    return `<button class="who-card ${dead?'eliminated':''}" onclick="whoToggle('${s.id}')" aria-label="Éliminer ${s.name}" ${dead?'disabled':''}>
      <img src="${s.img}" alt="Portrait du suspect" draggable="false">
      <span class="who-num">${String(i+1).padStart(2,'0')}</span>
      <span class="who-name">${s.name}</span>
      ${dead?'<span class="who-cross">✕</span>':''}
    </button>`;
  }).join('');
  const remaining=whoSuspects.filter(s=>!g.eliminated.has(s.id)).length;
  const questionAction = qi<total-1
    ? `<button class="primary who-question-next" onclick="whoNext()">QUESTION SUIVANTE</button>`
    : `<button class="primary who-question-next" onclick="whoFinish()">TERMINER L'ENQUÊTE</button>`;
  modal('MINI-JEU · 3/3','Qui est-ce ?',`
    <div class="who-head"><div><strong>Indice ${qi+1} / ${total}</strong><span>${remaining} suspects encore debout</span></div><div class="who-dots">${whoQuestions.map((_,i)=>`<i class="${i<=qi?'on':''}"></i>`).join('')}</div></div>
    <div class="who-question-row">
      <div class="who-question"><div class="who-question-label">QUESTION</div><div class="who-question-text">${q.q}</div><div class="who-answer">RÉPONSE : <b>${q.answer}</b></div></div>
      <div class="who-question-action">${questionAction}</div>
    </div>
    <div class="mini-layout who-layout"><div class="mini-play who-play"><div class="who-grid">${cards}</div><p class="mini-msg">${message||'Cliquez sur les portraits à éliminer. Une fois éliminé, un suspect ne peut plus être réactivé.'}</p></div><aside class="mini-instructions"><div class="mini-instructions-label">COMMENT JOUER</div><h4>Qui est-ce ?</h4><p>Retrouvez le seul suspect qui correspond à tous les indices.</p><ul><li>Lisez la question et sa réponse.</li><li>Éliminez les portraits qui vous semblent incompatibles.</li><li>Une élimination est définitive pour cette partie.</li><li>Passez à la question suivante quand vous voulez.</li><li>À la fin, choisissez un seul suspect.</li></ul><div class="mini-tip"><b>Objectif</b><br>Essayez de déduire le coupable. Vos éliminations restent définitives jusqu’à la fin de la partie.</div><div class="mini-no-penalty">Aucune pénalité : si votre choix final est faux, vous pouvez recommencer avec les portraits mélangés.</div></aside></div>`,
    `<button class="secondary" onclick="closeModal()">QUITTER</button>`);
};
