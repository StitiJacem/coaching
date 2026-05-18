const fs = require('fs');
let gid = 700;
const newId = () => `c${gid++}`;

function wrap(content, title) {
  return `<mxfile version="21.6.8"><diagram id="d1" name="${title}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${content}</root></mxGraphModel></diagram></mxfile>`;
}

const ACTOR = 'shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;';
const UC = 'ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BOX = 'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;fontStyle=1;fontSize=11;verticalAlign=top;';
const CLS = 'swimlane;startSize=28;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=11;';
const ATTR = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=10;';
const ASS = 'endArrow=none;html=1;strokeColor=#555;';
const INC = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;';
const SL_OBJ = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=10;';
const SL_LINE = 'line;html=1;strokeColor=#23445D;dashed=1;endArrow=none;';
const SL_MSG = 'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=10;';
const SL_RET = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=10;';

function v(id, val, style, x, y, w, h, parent='1') {
  return `<mxCell id="${id}" value="${val}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;
}
function e(id, val, style, src, tgt) {
  return `<mxCell id="${id}" value="${val}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}
function msg(label, sy, sx, tx, style) {
  return `<mxCell id="${newId()}" value="${label}" style="${style}" edge="1" parent="1"><mxGeometry x="${sx}" y="${sy}" width="50" height="14" as="geometry"><mxPoint x="${sx}" y="${sy}" as="sourcePoint"/><mxPoint x="${tx}" y="${sy}" as="targetPoint"/></mxGeometry></mxCell>\n`;
}
function cls(id, name, attrs, x, y, w=190) {
  const LH=22, H=30+attrs.length*LH;
  let c = v(id, name, CLS, x, y, w, H);
  attrs.forEach((a,i) => c += v(newId(), a, ATTR, x, y+30+i*LH, w, LH, id));
  return { c, id, x, y, w, h:H };
}

// =============================================
// SPRINT 3 - USE CASE
// =============================================
function sprint3UC() {
  gid=700; let c='';
  c += v('b1','Sprint 3 — Messagerie, Administration &amp; IA',BOX,200,20,720,640);
  c += v('a1','Administrateur',ACTOR,60,100,50,80);
  c += v('a2','Coach',ACTOR,60,350,50,80);
  c += v('a3','Athlète',ACTOR,1010,350,50,80);

  const ucs = [
    ['uc1',"Visualiser Dashboard\nGlobal (Statistiques)",260,50],
    ['uc2',"Gérer Catalogue\ndes Exercices",500,50],
    ['uc3',"Gérer Comptes\nUtilisateurs",740,50],
    ['uc4',"Envoyer un Message\n(Chat)",260,220],
    ['uc5',"Recevoir un Message",500,220],
    ['uc6',"Consulter Historique\ndu Chat",740,220],
    ['uc7',"Générer Conseil\navec l'IA",260,390],
    ['uc8',"Générer Programme\nvia l'IA",500,390],
    ['uc9',"Consulter Progrès\nAthlètes",260,540],
    ['uc10',"Exporter Rapport\nde Progression",500,540],
  ];
  ucs.forEach(([id,label,x,y]) => c += v(id, label, UC, x, y, 190, 60));

  [['a1','uc1'],['a1','uc2'],['a1','uc3']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a2','uc4'],['a2','uc6'],['a2','uc7'],['a2','uc8'],['a2','uc9'],['a2','uc10']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a3','uc4'],['a3','uc5'],['a3','uc6'],['a3','uc7']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc4','uc5');
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc7','uc8');
  c += e(newId(),'&lt;&lt;extend&gt;&gt;',INC,'uc9','uc10');

  fs.writeFileSync('Sprint3_Cas_Utilisation.drawio', wrap(c,"Sprint 3 - Cas d'Utilisation"));
  console.log('✅ Sprint3_Cas_Utilisation.drawio');
}

// =============================================
// SPRINT 3 - CLASS DIAGRAM
// =============================================
function sprint3Class() {
  gid=800; let c='';
  const {c:c1,id:id1} = cls('User','User',['+ id: UUID','+ firstName: String','+ lastName: String','+ role: Enum'],440,20);
  const {c:c2,id:id2} = cls('Message','Message',['+ id: UUID','+ content: String','+ sentAt: Date','+ isRead: Boolean'],60,240);
  const {c:c3,id:id3} = cls('Conversation','Conversation',['+ id: UUID','+ createdAt: Date','+ lastMessage: String'],420,240);
  const {c:c4,id:id4} = cls('AILog','AILog',['+ id: UUID','+ prompt: String','+ response: String','+ model: String','+ requestedAt: Date'],800,240);
  const {c:c5,id:id5} = cls('DashboardStats','DashboardStats',['+ totalUsers: Int','+ totalCoaches: Int','+ totalAthletes: Int','+ totalPrograms: Int','+ messagesExchanged: Int','+ generatedAt: Date'],60,490);
  const {c:c6,id:id6} = cls('Exercise','Exercise (Catalogue)',['+ id: UUID','+ name: String','+ targetMuscle: String','+ videoUrl: String','+ category: String'],800,490);

  c += c1+c2+c3+c4+c5+c6;
  c += e(newId(),'envoie 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id2);
  c += e(newId(),'reçoit 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id2);
  c += e(newId(),'participe à 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id3);
  c += e(newId(),'contient 1..*','endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;',id3,id2);
  c += e(newId(),'génère 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id4);
  c += e(newId(),'administre','endArrow=none;html=1;strokeColor=#555;',id1,id6);

  fs.writeFileSync('Sprint3_Classes.drawio', wrap(c,'Sprint 3 - Diagramme de Classes'));
  console.log('✅ Sprint3_Classes.drawio');
}

// =============================================
// SPRINT 3 - SEQUENCE: Envoyer un message
// =============================================
function sprint3Seq() {
  gid=900; let c='';
  const LY=20, OH=40, OW=150;
  const MX=[30,210,410,610,810];
  const labels=["Expéditeur","Application\n(Flutter)","Backend\n(Node.js)","PostgreSQL","Destinataire\n(Mobile)"];

  labels.forEach((l,i) => {
    c += v(`obj${i}`, l, SL_OBJ, MX[i], LY, OW, OH);
    c += v(`line${i}`, '', SL_LINE, MX[i]+OW/2, LY+OH, 2, 680, '1');
  });

  const messages = [
    [0,1,"Saisir message et cliquer Envoyer",80,SL_MSG],
    [1,2,"POST /api/messages {receiverId, content}",130,SL_MSG],
    [2,3,"INSERT INTO messages",180,SL_MSG],
    [3,2,"messageId + timestamp",220,SL_RET],
    [2,1,"201 Created {message}",270,SL_MSG],
    [1,0,"Message affiché (statut: Envoyé ✓)",310,SL_RET],
    [2,4,"Notify: Nouveau message",380,SL_MSG],
    [4,2,"ACK (destinataire en ligne)",420,SL_RET],
    [2,3,"UPDATE messages SET isRead=true",460,SL_MSG],
    [3,2,"Succès",500,SL_RET],
    [2,1,"Message lu ✓✓ (double coche)",540,SL_MSG],
    [1,0,"Icône double coche verte",580,SL_RET],
  ];

  messages.forEach(([s,t,label,y,style]) => {
    c += msg(label, y+LY+OH, MX[s]+OW/2, MX[t]+OW/2, style);
  });

  // note boxes
  c += v(newId(),'[Destinataire Hors Ligne]\nNotification Push FCM/APNS envoyée', 'shape=note;whiteSpace=wrap;html=1;size=12;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=9;', 820, 380, 200, 55);

  fs.writeFileSync('Sprint3_Sequence_Message.drawio', wrap(c,"Sprint 3 - Séquence: Envoyer un Message"));
  console.log('✅ Sprint3_Sequence_Message.drawio');
}

sprint3UC();
sprint3Class();
sprint3Seq();
console.log('\n--- Sprint 3 terminé ---');
