const $ = id => document.getElementById(id);

const state = {
  room: 1,
  inventory: [],
  clues: [],
  examined: {1:new Set(),2:new Set(),3:new Set()},
  miniSolved: {1:false,2:false,3:false},
  hints: 0
};

const rooms = {
  1: {
    title: "La scène de crime",
    caption: "Cliquez directement sur les objets visibles. Les noms n'apparaissent qu'après le clic.",
    miniDoorLabel: 'la porte d’entrée',
    art: "hall",
    required: ["lamp","photo","console","drawer","rug","coat","cabinet","painting","vase","papers"],
    mini: "gomoku", miniTitle: "Gomoku — Le carnet codé"
  },
  2: {
    title: "Le bureau de la victime",
    caption: "Chaque objet visible peut être inspecté. Certaines observations sont de simples fausses pistes.",
    art: "office",
    required: ["window","typewriter","desk","wallphone","bookcase","recorder","chair"],
    mini: "connect4", miniTitle: "Puissance 4 — Le dossier", miniDoorLabel: 'le tapis'
  },
  3: {
    title: "La cave",
    caption: "Examinez tous les éléments visibles. La porte centrale servira ensuite de dernier mini-jeu.",
    art: "cellar",
    required: ["shelves","ampoule","crates","barrel","ladder","workbench","drain","boards","greenbarrel"],
    mini: "who", miniTitle: "Qui est-ce ?", miniDoorLabel: 'la porte de la cave'
  }
};

const logLines=[];
function now(){return new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
function log(t){logLines.unshift(`${now()} — ${t}`);$("log").innerHTML=logLines.slice(0,18).map(x=>`<p class="log-entry">${x}</p>`).join("");}
function has(x){return state.inventory.includes(x);}
function addItem(x){if(!has(x)){state.inventory.push(x);updateHUD();log(`Preuve récupérée : ${x}.`);}}
function clue(x){if(!state.clues.includes(x)){state.clues.push(x);updateHUD();log(`Indice consigné : ${x}.`);}}
function updateHUD(){$("status").textContent=`${state.examined[state.room].size}/${rooms[state.room].required.length} OBJETS`;$('inventory').innerHTML=state.inventory.length?state.inventory.map(x=>`<div class="item">${x}</div>`).join(""):"Aucune preuve";$('clues').innerHTML=state.clues.length?state.clues.map(x=>`<div class="clue">${x}</div>`).join(""):"Aucun indice enregistré.";}
function modal(label,title,body,actions=""){const card=$('modal').querySelector('.modal-card');card.classList.remove('mini-gomoku','mini-connect4','mini-who','mini-generic');if(/Gomoku/i.test(title))card.classList.add('mini-gomoku');else if(/Puissance 4/i.test(title))card.classList.add('mini-connect4');else if(/Qui est-ce/i.test(title))card.classList.add('mini-who');else card.classList.add('mini-generic');$("modal-label").textContent=label;$('modal-title').textContent=title;$('modal-body').innerHTML=body;$('modal-actions').innerHTML=actions?`<div class="actions">${actions}</div>`:"";$('modal').classList.remove('hidden');}
function closeModal(){cancelMiniAsync();$('modal').classList.add('hidden');}
$('close-modal').onclick=closeModal;$('restart-btn').onclick=()=>location.reload();$('end-btn').onclick=()=>location.reload();

function inspect(id,label,fn){
  const already=state.examined[state.room].has(id);
  state.examined[state.room].add(id);
  const b=document.querySelector(`[data-hotspot="${id}"]`);if(b)b.classList.add('examined');
  updateHUD();if(!already)log(`Objet examiné : ${label}.`);
  fn(already);
  checkRoomCompletion();
}
function checkRoomCompletion(){
  const r=rooms[state.room];
  const done=r.required.every(id=>state.examined[state.room].has(id));
  document.querySelectorAll('.mini-door-hotspot').forEach(b=>b.classList.toggle('unlocked',done&&!state.miniSolved[state.room]));
  const miniName = r.miniDoorLabel || 'l’élément prévu';
  $('mini-ready').textContent = `TOUS LES OBJETS EXAMINÉS · CLIQUEZ SUR ${miniName.toUpperCase()} POUR JOUER`;
  $('mini-ready').classList.toggle('hidden',!done||state.miniSolved[state.room]);
}
function requireAll(n){
  const missing=rooms[n].required.filter(id=>!state.examined[n].has(id));
  if(missing.length){modal('EXPLORATION','Il reste des objets à examiner',`<p>Il reste <strong>${missing.length}</strong> objet${missing.length>1?'s':''} à examiner.</p><p class="note">Cliquez directement sur les objets visibles. Aucun nom n'est écrit sur la photo.</p>`);return false;}return true;
}
function objectModal(label,title,body){modal(label,title,body);}

function roomHotspots(n){
  if(n===1)return [
    ["lamp","Lampe",5.8,37.5,13.5,25,"polygon(28% 0,67% 0,84% 14%,100% 35%,91% 50%,72% 55%,70% 72%,78% 92%,60% 100%,39% 96%,28% 77%,31% 58%,7% 53%,0 35%,12% 18%)",()=>objectModal('OBJET','Lampe','La lampe est allumée. Son abat-jour et son pied ne montrent aucune trace évidente de lutte.'),false],
    ["photo","Cadre photo",17.0,46.5,6.5,16.5,"polygon(8% 2%,89% 0,100% 6%,97% 95%,88% 100%,8% 96%,0 8%)",()=>{addItem('clé en laiton');clue('Une petite clé était cachée derrière le cadre photo.');objectModal('OBJET CACHÉ','Petit cadre photo','Derrière le cadre, vous trouvez une petite clé en laiton. Le portrait montre la victime avec trois proches.' )},false],
    ["console","Console",2,61,24,32,"polygon(2% 10%,25% 0,78% 0,100% 12%,97% 63%,92% 100%,5% 100%,0 58%)",()=>objectModal('MOBILIER','Console','Une fine couche de poussière couvre le meuble, sauf autour du tiroir supérieur.'),false],
    ["drawer","Tiroir de la console",14,65,9.5,8,"polygon(4% 18%,96% 0,100% 74%,7% 100%)",()=>{clue('Le tiroir de la console a été ouvert récemment.');objectModal('TRACE','Tiroir de la console','Une rayure fraîche longe la serrure. Le tiroir a été forcé puis refermé.');},false],
    ["rug","Tapis",31,57,52,43,"polygon(2% 17%,31% 0,74% 3%,100% 26%,96% 66%,73% 100%,30% 100%,0 77%)",()=>{clue('Une empreinte humide apparaît sur le bord du tapis.');objectModal('TRACE','Tapis','Une empreinte partielle apparaît sur la bordure humide du tapis. Elle vient de l’extérieur.');},false],
    ["coat","Manteau",28,14,9,43,"polygon(29% 0,69% 2,92% 28%,82% 61%,98% 100%,58% 95%,45% 69%,17% 100%,0 93%,16% 57%,6% 26%)",()=>{clue('Une trace de cire noire est présente sur la manche du manteau.');objectModal('VÊTEMENT','Manteau','Une fine trace de cire noire adhère à la manche. La poche est vide.');},false],
    ["cabinet","Horloge vitrée",69,4,18,67,"polygon(15% 0,76% 2,100% 14%,95% 95%,69% 100%,7% 95%,0 26%)",()=>{clue('L’horloge indique 22 h 47, mais son mécanisme semble avoir été arrêté puis relancé.');objectModal('HORLOGE','Horloge vitrée','Les aiguilles indiquent 22 h 47. Le mécanisme a été manipulé : l’heure affichée n’est peut-être pas fiable.');},false],
    ["painting","Tableau",87,8,13,36,"polygon(8% 3,92% 0,100% 93%,12% 100%,0 14%)",()=>objectModal('DÉCOR','Tableau','Le tableau est droit et intact. Rien d’utile à première vue.'),false],
    ["vase","Vase",84,67,16,28,"polygon(28% 0,72% 2,84% 27%,100% 78%,82% 100%,17% 96%,0 78%,16% 27%)",()=>objectModal('DÉCOR','Vase','Le vase est intact. Il ne semble pas avoir été touché.'),false],
    ["papers","Feuilles au sol",27.5,81.5,10.5,7.5,"polygon(3% 24%,25% 2%,61% 0,98% 27%,90% 76%,56% 100%,7% 86%,0 53%)",()=>{clue('Une feuille mentionne les comptes à apporter au rendez-vous.');objectModal('DOCUMENT','Feuilles au sol','Une phrase reste lisible :<p class="note">« Apporte les comptes. Je ne couvrirai plus personne. »</p>');},false],
    ["frontdoor","Porte d’entrée",36,7,26,55,"polygon(2% 4,46% 0,48% 100%,3% 96%,52% 0,98% 6,100% 97%,54% 100%)",()=>objectModal('PORTE','Porte d’entrée','La porte est verrouillée. Après l’exploration complète, elle devient le point d’accès au premier mini-jeu.'),true,'mini']
  ];
  if(n===2)return [
    ["window","Fenêtre",0,3,14,49,"polygon(0 0,83% 0,100% 12%,100% 96%,5% 100%,0 73%)",()=>{clue('La fenêtre est fermée de l’intérieur.');objectModal('FENÊTRE','Fenêtre','Aucune trace d’effraction. L’entrée s’est probablement faite par la maison elle-même.');},false],
    ["typewriter","Machine à écrire",12,44,22,18,"polygon(6% 30%,24% 8%,76% 0,100% 22%,94% 76%,67% 100%,12% 92%,0 61%)",()=>{clue('Une touche de la machine porte une trace de cire noire.');objectModal('OBJET','Machine à écrire','Le clavier et le ruban sont anciens. Une minuscule trace de cire noire apparaît sur une touche.');},false],
    ["desk","Bureau",0,48,55,52,"polygon(0 10%,28% 2%,91% 0,100% 12%,100% 42%,94% 100%,0 100%)",()=>objectModal('MOBILIER','Bureau','Les papiers ont été déplacés. Un espace propre indique qu’un dossier épais a été retiré récemment.'),false],
    ["wallphone","Téléphone mural",24,20,9,24,"polygon(22% 0,77% 0,100% 18%,92% 87%,67% 100%,26% 93%,0 70%,8% 20%)",()=>{clue('Le téléphone contient le dernier appel vers un contact enregistré sous M.');objectModal('PREUVE','Téléphone mural','Le dernier appel sortant date de 22 h 51. Le contact est enregistré sous l’initiale M.');},false],
    ["bookcase","Grande bibliothèque",52,1,21.5,53,"polygon(5% 1%,91% 0,100% 7%,98% 96%,8% 100%,0 6%)",()=>{clue('Un emplacement vide correspond à un dossier financier.');objectModal('MOBILIER','Grande bibliothèque','Une étiquette indique « COMPTES 1987 ». Le dossier manque, mais une page froissée reste coincée derrière un livre.');},false],
    ["recorder","Magnétophone",73,29,17,23,"polygon(3% 22%,22% 3%,81% 0,100% 24%,93% 88%,70% 100%,7% 91%,0 60%)",()=>{clue('Le magnétophone parle de comptes et d’une rencontre le soir du crime.');objectModal('ENREGISTREMENT','Magnétophone','La bande contient :<p class="note">« Apporte les comptes. Ce soir, je veux des explications. »</p>');},false],
    ["chair","Fauteuil",42,48,33,52,"polygon(30% 1%,58% 0,79% 8%,91% 22%,100% 48%,96% 72%,86% 91%,67% 100%,28% 98%,7% 89%,0 72%,4% 43%,13% 20%)",()=>objectModal('MOBILIER','Fauteuil','Le fauteuil a été déplacé de quelques centimètres. Une fibre sombre est accrochée au dossier.'),false],
    ["carpet","Tapis",60,64,40,36,"polygon(8% 7%,40% 0,77% 4%,100% 15%,98% 55%,90% 84%,65% 100%,25% 97%,0 78%,2% 31%)",()=>objectModal('OBJET','Tapis','Le tapis couvre le sol devant le bureau. Une fois les sept objets examinés, il devient le point d’accès au deuxième mini-jeu.'),true,'mini']
  ];
  return [
    ["shelves","Étagères",9,16,25,50,"polygon(0 3%,89% 0,100% 9%,98% 100%,3% 98%)",()=>{clue('Une petite boîte métallique porte une trace de cire noire.');objectModal('ÉTAGÈRES','Étagères','Parmi les bocaux, une petite boîte métallique a été déplacée récemment.');},false],
    ["ampoule","Ampoule",46.2,6.0,5.0,11.5,"polygon(39% 0,61% 0,77% 18%,74% 49%,62% 70%,61% 91%,39% 100%,38% 73%,25% 52%,22% 22%)",()=>{clue('L’ampoule porte une fine trace de cire noire sur son culot.');objectModal('OBJET','Ampoule','L’ampoule est allumée. Une fine trace sombre apparaît sur le métal du culot.');},false],
    ["crates","Caisses en bois",17,59,24,25,"polygon(4% 17%,35% 0,100% 8%,96% 86%,67% 100%,0 88%)",()=>{clue('Une fibre de tissu noir est coincée entre deux planches.');objectModal('TRACE','Caisses en bois','Une fibre sombre est coincée entre les planches. Elle correspond à un vêtement épais.');},false],
    ["barrel","Fût",69,45,14,28,"polygon(19% 0,80% 0,100% 14%,97% 88%,79% 100%,20% 99%,3% 87%,0 14%)",()=>objectModal('OBJET','Fût','Le fût est fermé. Une odeur de solvant flotte autour du bouchon.'),false],
    ["ladder","Échelle",77,10,10,57,"polygon(25% 0,75% 0,100% 100%,72% 100%,61% 11%,39% 11%,28% 100%,0 100%)",()=>objectModal('OBJET','Échelle','Une marche porte une marque récente de chaussure.'),false],
    ["workbench","Établi",38,58,32,35,"polygon(2% 14%,22% 0,91% 4%,100% 22%,97% 89%,75% 100%,6% 96%,0 72%)",()=>{clue('L’établi contient une pince portant des traces de cire noire.');objectModal('OUTIL','Établi','Une pince métallique présente une petite trace de cire noire sur sa poignée.');},false],
    ["drain","Bonde",57,83,14,13,"polygon(50% 0,89% 16%,100% 56%,75% 100%,25% 96%,0 54%,13% 15%)",()=>objectModal('SOL','Bonde','La bonde est humide. Rien ne semble avoir été évacué récemment.'),false],
    ["boards","Planches",0,77,28,23,"polygon(0 18%,16% 0,100% 7%,96% 100%,12% 92%)",()=>{clue('Une planche dissimule un petit morceau de papier.');objectModal('DOCUMENT','Planches','Un fragment de papier porte seulement une initiale : « M. »');},false],
    ["greenbarrel","Baril vert",78,64,17,27,"polygon(22% 0,78% 2,100% 14%,97% 90%,75% 100%,20% 98%,0 87%,2% 15%)",()=>objectModal('OBJET','Baril vert','Le baril est vide. Une marque de cire noire est visible sur le rebord.'),false],
    ["cellardoor","Porte de la cave",38,4,24,57,"polygon(3% 2%,96% 0,100% 96%,4% 100%,0 8%)",()=>objectModal('PORTE','Porte de la cave','La porte devient le point d’accès au dernier mini-jeu une fois toute la cave examinée.'),true,'mini']
  ];
}

function renderRoom(n){
  state.room=n;cancelMiniAsync();
  $('room-title').textContent=rooms[n].title;$('room-number').textContent=`0${n} / 03`;$('caption').textContent=rooms[n].caption;
  const art=$('room-art');art.className=`room-art art-${rooms[n].art}`;
  const hs=roomHotspots(n);$('hotspots').innerHTML='';
  hs.forEach(([id,label,x,y,w,h,clip,fn,door,type])=>{
    const b=document.createElement('button');b.className=`hotspot ${door?'mini-door-hotspot':''}`;b.dataset.hotspot=id;b.style.left=x+'%';b.style.top=y+'%';b.style.width=w+'%';b.style.height=h+'%';b.style.clipPath=clip;b.setAttribute('aria-label',label);b.onclick=()=>{if(door&&!requireAll(n))return;if(door&&type==='mini'){if(n===1)gomokuGame();else if(n===2)connect4Game();else whoIsItGame();}else inspect(id,label,fn);};$('hotspots').appendChild(b);
  });
  document.querySelectorAll(`[data-hotspot]`).forEach(b=>{if(state.examined[n].has(b.dataset.hotspot))b.classList.add('examined');});
  checkRoomCompletion();updateHUD();
}
function goRoom(n){cancelMiniAsync();renderRoom(n);}

let miniSession=0,miniTimer=null;
function newMiniSession(){miniSession++;if(miniTimer){clearTimeout(miniTimer);miniTimer=null;}return miniSession;}
function cancelMiniAsync(){miniSession++;if(miniTimer){clearTimeout(miniTimer);miniTimer=null;}}

function gomokuGame(){newMiniSession();window.gomoku=Array.from({length:15},()=>Array(15).fill(''));window.gomokuBusy=false;window.gomokuLast=null;renderGomoku();}
function gomokuLines(b,r,c,p){const dirs=[[1,0],[0,1],[1,1],[1,-1]];for(const [dr,dc] of dirs){let count=1;for(let k=1;k<5;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=15||cc<0||cc>=15||b[rr][cc]!==p)break;count++;}for(let k=1;k<5;k++){const rr=r-dr*k,cc=c-dc*k;if(rr<0||rr>=15||cc<0||cc>=15||b[rr][cc]!==p)break;count++;}if(count>=5)return true;}return false;}
function gomokuFull(b){return b.every(row=>row.every(v=>v));}
function gomokuWinMove(b,p){for(let r=0;r<15;r++)for(let c=0;c<15;c++)if(!b[r][c]){b[r][c]=p;const win=gomokuLines(b,r,c,p);b[r][c]='';if(win)return [r,c];}return null;}
function gomokuCandidates(b){const set=new Set();for(let r=0;r<15;r++)for(let c=0;c<15;c++)if(b[r][c])for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr>=0&&rr<15&&cc>=0&&cc<15&&!b[rr][cc])set.add(rr+','+cc);}if(!set.size)set.add('7,7');return [...set].map(s=>s.split(',').map(Number));}
function gomokuScore(b,r,c,p){let score=0;const dirs=[[1,0],[0,1],[1,1],[1,-1]];for(const [dr,dc] of dirs){let own=1,open=0;for(const sign of [-1,1]){for(let k=1;k<5;k++){const rr=r+dr*k*sign,cc=c+dc*k*sign;if(rr<0||rr>=15||cc<0||cc>=15)break;if(b[rr][cc]===p)own++;else{if(!b[rr][cc])open++;break;}}}if(own>=5)score+=1000000;else if(own===4&&open===2)score+=100000;else if(own===4)score+=10000;else if(own===3&&open===2)score+=3000;else if(own===3)score+=300;else if(own===2&&open===2)score+=200;else if(own===2)score+=50;}const center=7-Math.abs(7-r)+7-Math.abs(7-c);return score+center;}
function gomokuAI(){const b=window.gomoku;let move=gomokuWinMove(b,'×');if(move)return move;const human=gomokuWinMove(b,'●');if(human)return human;const cand=gomokuCandidates(b);let best=cand[0],bs=-Infinity;for(const [r,c] of cand){const attack=gomokuScore(b,r,c,'×');const defense=gomokuScore(b,r,c,'●');const s=attack+defense*.92;if(s>bs){bs=s;best=[r,c];}}return best;}
function renderGomoku(msg='À vous.'){
  const b=window.gomoku;
  const cells=b.flatMap((row,r)=>row.map((v,c)=>`<button class="gomoku-cell ${v?'mark-'+(v==='●'?'human':'ai'):''} ${window.gomokuLast&&window.gomokuLast.r===r&&window.gomokuLast.c===c?'last-move':''}" onclick="gomokuMove(${r},${c})" ${v||window.gomokuBusy?'disabled':''} aria-label="Ligne ${r+1}, colonne ${c+1}"><span>${v==='●'?'O':v==='×'?'X':''}</span></button>`)).join('');
  modal('MINI-JEU · 1/3','Gomoku — Le carnet codé',`<div class="mini-layout"><div class="mini-play gomoku-play"><div class="gomoku-board">${cells}</div><p class="mini-msg">${msg}</p></div><aside class="mini-instructions"><div class="mini-instructions-label">COMMENT JOUER</div><h4>Gomoku</h4><p>Alignez <b>5 O</b> avant les <b>X</b>.</p><ul><li>Vous jouez <b>O</b>.</li><li>L’ordinateur joue <b>X</b>.</li><li>Placez votre symbole sur une case vide.</li><li>Le premier à aligner 5 symboles gagne.</li></ul><div class="mini-tip"><b>À savoir</b><br>L’ordinateur analyse les menaces et les coups possibles à l’avance.</div><div class="mini-no-penalty">Aucune pénalité en cas de défaite.</div></aside></div>`,`<button class="secondary" onclick="closeModal()">QUITTER</button>`);
}
window.gomokuMove=(r,c)=>{
  const b=window.gomoku;if(!b||window.gomokuBusy||r<0||r>=15||c<0||c>=15||b[r][c])return;
  b[r][c]='●';window.gomokuLast={r,c};renderGomoku('L’ordinateur réfléchit…');
  if(gomokuLines(b,r,c,'●')){winMini(1,'Le carnet codé est déchiffré : la première piste mène au bureau.');return;}
  if(gomokuFull(b)){modal('MINI-JEU','Match nul','Aucune pénalité. Recommencez si vous souhaitez retenter.',`<button class="primary" onclick="gomokuGame()">REJOUER</button>`);return;}
  window.gomokuBusy=true;const token=miniSession;miniTimer=setTimeout(()=>{miniTimer=null;if(token!==miniSession||!window.gomoku||!window.gomokuBusy)return;const move=gomokuAI();if(!move){window.gomokuBusy=false;renderGomoku('À vous.');return;}const [ar,ac]=move;if(!window.gomoku[ar]||window.gomoku[ar][ac]){window.gomokuBusy=false;renderGomoku('À vous.');return;}window.gomoku[ar][ac]='×';window.gomokuLast={r:ar,c:ac};window.gomokuBusy=false;if(gomokuLines(window.gomoku,ar,ac,'×')){modal('MINI-JEU PERDU','Le carnet reste verrouillé','L’ordinateur a trouvé une combinaison gagnante. Aucun malus : recommencez.',`<button class="primary" onclick="gomokuGame()">REJOUER</button>`);return;}if(gomokuFull(window.gomoku)){modal('MINI-JEU','Match nul','Aucune pénalité. Recommencez si vous souhaitez retenter.',`<button class="primary" onclick="gomokuGame()">REJOUER</button>`);return;}renderGomoku('À vous.');},180);
};

function c4New(){return Array.from({length:6},()=>Array(7).fill(0));}
function c4Win(b,r,c,p){const dirs=[[1,0],[0,1],[1,1],[1,-1]];for(const [dr,dc] of dirs){let n=1;for(let s=1;s<4;s++){const rr=r+dr*s,cc=c+dc*s;if(rr<0||rr>=6||cc<0||cc>=7||b[rr][cc]!==p)break;n++;}for(let s=1;s<4;s++){const rr=r-dr*s,cc=c-dc*s;if(rr<0||rr>=6||cc<0||cc>=7||b[rr][cc]!==p)break;n++;}if(n>=4)return true;}return false;}
function c4Moves(b){const a=[];for(let c=0;c<7;c++)if(!b[0][c])a.push(c);return a;}
function c4Drop(b,c,p){if(!Number.isInteger(c)||c<0||c>=7)return null;for(let r=5;r>=0;r--)if(!b[r][c]){b[r][c]=p;return r;}return null;}
function c4Clone(b){return b.map(r=>r.slice());}
function c4Immediate(b,p){for(const c of c4Moves(b)){const t=c4Clone(b),r=c4Drop(t,c,p);if(r!==null&&c4Win(t,r,c,p))return c;}return null;}
function c4Heuristic(b){let score=0;for(let r=0;r<6;r++)if(b[r][3]===2)score+=6;return score;}
function c4AI(){const b=window.c4;let m=c4Immediate(b,2);if(m!==null)return m;m=c4Immediate(b,1);if(m!==null)return m;const moves=c4Moves(b);if(!moves.length)return null;let best=moves[0],bs=-Infinity;for(const c of moves){const t=c4Clone(b),r=c4Drop(t,c,2);if(r===null)continue;let s=c4Heuristic(t);const reply=c4Immediate(t,1);if(reply!==null)s-=1000;const center=3-Math.abs(3-c);s+=center*3;if(s>bs){bs=s;best=c;}}return best;}
function connect4Game(){newMiniSession();window.c4=c4New();window.c4Busy=false;window.c4Last=null;renderConnect4();}
function renderConnect4(msg='À vous.'){
  const b=window.c4;const cells=b.flatMap((row,r)=>row.map((v,c)=>`<button class="c4-cell ${window.c4Last&&window.c4Last.r===r&&window.c4Last.c===c?'last-move':''}" onclick="c4Move(${c})" ${v||window.c4Busy?'disabled':''}><span class="c4-disc ${v===1?'player':v===2?'ai':''}">${v?'':''}</span></button>`)).join('');
  const cols=[0,1,2,3,4,5,6].map(c=>`<button class="c4-drop" onclick="c4Move(${c})" ${b[0][c]||window.c4Busy?'disabled':''}>▼</button>`).join('');
  modal('MINI-JEU · 2/3','Puissance 4 — Le dossier',`<div class="mini-layout"><div class="mini-play c4-play"><div class="c4-wrap"><div class="c4-controls">${cols}</div><div class="c4-board">${cells}</div></div><p class="mini-msg">${msg}</p></div><aside class="mini-instructions"><div class="mini-instructions-label">COMMENT JOUER</div><h4>Puissance 4</h4><p>Alignez <b>4 jetons</b> avant l’ordinateur.</p><ul><li>Vous jouez <b>jaune</b>.</li><li>L’ordinateur joue <b>rouge</b>.</li><li>Cliquez sur une flèche pour choisir une colonne.</li><li>Les jetons tombent automatiquement.</li><li>Le premier à aligner 4 jetons gagne.</li></ul><div class="mini-tip"><b>Stratégie</b><br>L’ordinateur bloque les menaces et cherche ses propres alignements, avec une préférence pour le centre.</div><div class="mini-no-penalty">Aucune pénalité en cas de défaite.</div></aside></div>`,`<button class="secondary" onclick="closeModal()">QUITTER</button>`);
}
window.c4Move=col=>{
  const b=window.c4;if(!b||window.c4Busy||!Number.isInteger(col)||col<0||col>=7||b[0][col])return;
  const r=c4Drop(b,col,1);if(r===null)return;window.c4Last={r,c:col};renderConnect4('L’ordinateur réfléchit…');
  if(c4Win(b,r,col,1)){winMini(2,'Le dossier du bureau révèle la seconde piste : le dernier appel mène à la cave.');return;}
  if(!c4Moves(b).length){modal('MINI-JEU','Match nul','Aucune pénalité. Recommencez si vous souhaitez retenter.',`<button class="primary" onclick="connect4Game()">REJOUER</button>`);return;}
  window.c4Busy=true;const token=miniSession;miniTimer=setTimeout(()=>{miniTimer=null;if(token!==miniSession||!window.c4||!window.c4Busy)return;const move=c4AI();if(move===null){window.c4Busy=false;renderConnect4('À vous.');return;}const ar=c4Drop(window.c4,move,2);if(ar===null){window.c4Busy=false;renderConnect4('À vous.');return;}window.c4Last={r:ar,c:move};window.c4Busy=false;if(c4Win(window.c4,ar,move,2)){modal('MINI-JEU PERDU','Le dossier reste fermé','L’ordinateur a trouvé une combinaison gagnante. Aucun malus : recommencez.',`<button class="primary" onclick="connect4Game()">REJOUER</button>`);return;}if(!c4Moves(window.c4).length){modal('MINI-JEU','Match nul','Aucune pénalité. Recommencez si vous souhaitez retenter.',`<button class="primary" onclick="connect4Game()">REJOUER</button>`);return;}renderConnect4('À vous.');},180);
};

const WHO_API = 'https://maison-enigmes-api.teddysegura-ts.workers.dev';

const whoSuspects = [
  {id:'alexandre',name:'Alexandre',img:'alexandre.jpg'},
  {id:'sophie',name:'Sophie',img:'sophie.jpg'},
  {id:'thomas',name:'Thomas',img:'thomas.jpg'},
  {id:'julie',name:'Julie',img:'julie.jpg'},
  {id:'marc',name:'Marc',img:'marc.jpg'},
  {id:'claire',name:'Claire',img:'claire.jpg'},
  {id:'julien',name:'Julien',img:'julien.jpg'},
  {id:'antoine',name:'Antoine',img:'antoine.jpg'},
  {id:'elise',name:'Élise',img:'elise.jpg'},
  {id:'lucas',name:'Lucas',img:'lucas.jpg'}
];

let whoQuestions = [];

function shuffleWhoSuspects(){
  const a=[...whoSuspects];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

async function loadWhoQuestions(){
  const r=await fetch(`${WHO_API}/questions`,{cache:'no-store'});
  if(!r.ok) throw new Error('questions');
  const data=await r.json();
  if(!Array.isArray(data.questions)||!data.questions.length) throw new Error('questions');
  whoQuestions=data.questions;
}

async function whoIsItGame(){
  newMiniSession();
  modal('MINI-JEU · 3/3','Qui est-ce ?','<p>Chargement des indices…</p>');
  try{
    await loadWhoQuestions();
    window.who={round:0,eliminated:new Set(),history:[],finished:false,order:shuffleWhoSuspects()};
    renderWhoIsIt();
  }catch(e){
    modal('CONNEXION','Impossible de charger les indices','<p>Le service de validation est momentanément indisponible. Réessayez dans quelques instants.</p>',`<button class="primary" onclick="whoIsItGame()">RÉESSAYER</button>`);
  }
}

function renderWhoIsIt(message=''){
  const g=window.who, qi=g.round, total=whoQuestions.length, q=whoQuestions[qi];
  const order=g.order||whoSuspects;
  const cards=order.map((s,i)=>{
    const dead=g.eliminated.has(s.id);
    return `<button class="who-card ${dead?'eliminated':''}" onclick="whoToggle('${s.id}')" aria-label="Éliminer ${s.name}" ${dead?'disabled':''}><img src="${s.img}" alt="Portrait du suspect" draggable="false"><span class="who-num">${String(i+1).padStart(2,'0')}</span><span class="who-name">${s.name}</span>${dead?'<span class="who-cross">✕</span>':''}</button>`;
  }).join('');
  const remaining=whoSuspects.filter(s=>!g.eliminated.has(s.id)).length;
  modal('MINI-JEU · 3/3','Qui est-ce ?',`<div class="who-head"><div><strong>Indice ${qi+1} / ${total}</strong><span>${remaining} suspects encore debout</span></div></div><div class="who-question"><div class="who-question-label">QUESTION</div><div class="who-question-text">${q.q}</div><div class="who-answer">RÉPONSE : <b>${q.answer}</b></div></div><div class="mini-layout who-layout"><div class="mini-play who-play"><div class="who-grid">${cards}</div><p class="mini-msg">${message||'Cliquez sur les portraits à éliminer.'}</p></div></div>`,`<button class="secondary" onclick="closeModal()">QUITTER</button>${qi<total-1?`<button class="primary" onclick="whoNext()">QUESTION SUIVANTE</button>`:`<button class="primary" onclick="whoFinish()">TERMINER L'ENQUÊTE</button>`}`);
}

window.whoToggle=id=>{
  const g=window.who;if(!g||g.finished||g.eliminated.has(id))return;
  g.eliminated.add(id);renderWhoIsIt();
};
window.whoNext=()=>{
  const g=window.who;if(!g||g.round>=whoQuestions.length-1)return;
  g.history[g.round]=new Set(g.eliminated);g.round++;renderWhoIsIt();
};
window.whoFinish=async()=>{
  const g=window.who;if(!g)return;
  const remaining=whoSuspects.filter(s=>!g.eliminated.has(s.id));
  if(remaining.length!==1){
    modal('ENQUÊTE INCOMPLÈTE','Choisissez une personne','Pour terminer, un seul portrait doit rester.',`<button class="primary" onclick="renderWhoIsIt()">RETOURNER AUX INDICES</button>`);return;
  }
  const chosen=remaining[0];
  modal('VÉRIFICATION','Vérification en cours','<p>Votre accusation est en cours de vérification…</p>');
  try{
    const r=await fetch(`${WHO_API}/verify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({suspect:chosen.id})});
    if(!r.ok) throw new Error('verify');
    const data=await r.json();
    if(data.correct){g.finished=true;window.verifiedCulprit=chosen;finishInvestigation();}
    else modal('ENQUÊTE ÉCHOUÉE','Mauvaise personne','Ce suspect n’est pas le bon. Aucun malus : recommencez le Qui est-ce ?.',`<button class="primary" onclick="whoIsItGame()">RECOMMENCER</button>`);
  }catch(e){
    modal('CONNEXION','Vérification impossible','<p>Impossible de joindre le service de validation. Réessayez.</p>',`<button class="primary" onclick="whoFinish()">RÉESSAYER</button>`);
  }
};

function winMini(n,text){cancelMiniAsync();state.miniSolved[n]=true;clue(text);$('modal').classList.add('hidden');const next=n<3?`<button class="primary" onclick="goRoom(${n+1})">OUVRIR LA PIÈCE SUIVANTE</button>`:`<button class="primary" onclick="showConclusion()">VOIR LA CONCLUSION</button>`;modal('MINI-JEU RÉUSSI',rooms[n].miniTitle,`<p>L’indice est obtenu immédiatement :</p><p class="note">${text}</p>`,next);}

function showConclusion(){
  const culprit=window.verifiedCulprit||null;
  closeModal();
  $('game').classList.add('hidden');
  $('end-screen').classList.remove('hidden');
  $('end-label').textContent='AFFAIRE RÉSOLUE';
  $('end-title').textContent='LE TUEUR EST DÉMASQUÉ';
  if(culprit){
    const art=$('end-art');
    if(art){art.src=culprit.img;art.alt='Portrait du coupable démasqué';}
    $('end-text').textContent=`${culprit.name} est le coupable. Vous avez résolu l’enquête.`;
  }else $('end-text').textContent='Vous avez résolu l’enquête.';
}
function finishInvestigation(){
  state.miniSolved[3]=true;
  const culprit=window.verifiedCulprit||null;
  if(culprit) clue(`Votre accusation contre ${culprit.name} est confirmée.`);
  showConclusion();
}
function finalAccusation(){if(!state.miniSolved[3]){requireAll(3);return;}showConclusion();}
window.accuse=()=>{};
function startGame(){$('start-screen').classList.add('hidden');$('game').classList.remove('hidden');log('La maison est silencieuse. Explorez chaque objet à votre rythme.');renderRoom(1);}
$('start-btn').onclick=startGame;
$('hint-btn').onclick=()=>{const tips=['Cliquez directement sur les objets visibles. Leur nom apparaît seulement dans la fiche après le clic.','Après l’examen complet, l’élément prévu dans la scène devient le point d’accès au mini-jeu.','Les indices de cire, de comptes et de textile finissent par se rejoindre.'];modal('INDICE DE SECOURS',`Indice ${Math.min(state.hints+1,3)}/3`,tips[Math.min(state.hints,2)]);state.hints=Math.min(state.hints+1,3);};
updateHUD();
