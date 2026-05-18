const fs = require('fs');
let gid = 100;
const newId = () => `c${gid++}`;

function wrap(content, title) {
  return `<mxfile version="21.6.8"><diagram id="d1" name="${title}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${content}</root></mxGraphModel></diagram></mxfile>`;
}

const ACTOR = 'shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
const UC = 'ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=0;fontSize=10;';
const BOX = 'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;fontStyle=1;fontSize=11;verticalAlign=top;';
const CLS = 'swimlane;startSize=28;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=11;';
const ATTR = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=10;';
const INH = 'endArrow=block;endFill=0;endSize=12;html=1;strokeColor=#23445D;strokeWidth=2;';
const ASS = 'endArrow=none;html=1;strokeColor=#555;';
const INC = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;';
const COMP = 'endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const SL_OBJ = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=10;';
const SL_LINE = 'line;html=1;strokeColor=#23445D;dashed=1;endArrow=none;';
const SL_MSG = 'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=10;';
const SL_RET = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=10;';
const SL_ALT = 'swimlane;startSize=20;fillColor=#f8cecc;strokeColor=#b85450;fontStyle=2;fontSize=10;';
const SL_ALT_IN = 'swimlane;startSize=20;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=2;fontSize=10;';

function v(id, val, style, x, y, w, h, parent='1') {
  return `<mxCell id="${id}" value="${val}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;
}
function e(id, val, style, src, tgt, parent='1') {
  return `<mxCell id="${id}" value="${val}" style="${style}" edge="1" parent="${parent}" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}
function cls(id, name, attrs, x, y, w=180) {
  const LH=22, H=30+attrs.length*LH;
  let c = v(id, name, CLS, x, y, w, H);
  attrs.forEach((a,i) => c += v(newId(), a, ATTR, x, y+30+i*LH, w, LH, id));
  return { c, id, x, y, w, h:H };
}

// =============================================
// SPRINT 1 - USE CASE
// =============================================
function sprint1UC() {
  gid=100; let c='';
  c += v('b1','Sprint 1 — Accès &amp; Profils',BOX,200,20,700,660);
  c += v('a1','Utilisateur',ACTOR,60,280,50,80);
  c += v('a2','Coach',ACTOR,1010,150,50,80);
  c += v('a3','Athlète',ACTOR,1010,400,50,80);

  const ucs = [
    ['uc1',"Créer un Compte",280,50],
    ['uc2',"S'authentifier",520,50],
    ['uc3',"Réinitialiser\nMot de Passe",760,50],
    ['uc4',"Compléter son\nProfil",280,200],
    ['uc5',"Modifier son\nProfil",520,200],
    ['uc6',"Consulter les\nAthlètes",280,370],
    ['uc7',"Envoyer Demande\nde Coaching",520,370],
    ['uc8',"Accepter/Refuser\nDemande",280,500],
    ['uc9',"Consulter ses\nCoachs",520,500],
  ];
  ucs.forEach(([id,label,x,y]) => c += v(id, label, UC, x, y, 160, 60));

  [['a1','uc1'],['a1','uc2'],['a1','uc3'],['a1','uc4'],['a1','uc5']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a2','uc2'],['a2','uc6'],['a2','uc8']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a3','uc2'],['a3','uc7'],['a3','uc9']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  c += e(newId(),'&lt;&lt;extend&gt;&gt;',INC,'uc2','uc3');
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc7','uc9');

  fs.writeFileSync('Sprint1_Cas_Utilisation.drawio', wrap(c,"Sprint 1 - Cas d'Utilisation"));
  console.log('✅ Sprint1_Cas_Utilisation.drawio');
}

// =============================================
// SPRINT 1 - CLASS DIAGRAM
// =============================================
function sprint1Class() {
  gid=200; let c='';
  const {c:c1,id:id1} = cls('User','User',['+ id: UUID','+ email: String','+ passwordHash: String','+ firstName: String','+ lastName: String','+ avatarUrl: String','+ role: Enum (COACH|ATHLETE)','+ isVerified: Boolean','+ createdAt: Date'],420,20);
  const {c:c2,id:id2} = cls('CoachProfile','CoachProfile',['+ id: UUID','+ bio: String','+ speciality: String','+ experience: Int','+ certification: String'],100,280);
  const {c:c3,id:id3} = cls('AthleteProfile','AthleteProfile',['+ id: UUID','+ weight: Float','+ height: Float','+ age: Int','+ fitnessGoal: String','+ activityLevel: String'],700,280);
  const {c:c4,id:id4} = cls('CoachingRequest','CoachingRequest',['+ id: UUID','+ status: Enum (PENDING|ACCEPTED|REJECTED)','+ message: String','+ createdAt: Date'],100,520);
  c += c1+c2+c3+c4;
  c += e(newId(),'',INH,id2,id1);
  c += e(newId(),'',INH,id3,id1);
  c += e(newId(),'envoie 0..*',ASS,id3,id4);
  c += e(newId(),'reçoit 0..*',ASS,id2,id4);

  fs.writeFileSync('Sprint1_Classes.drawio', wrap(c,'Sprint 1 - Diagramme de Classes'));
  console.log('✅ Sprint1_Classes.drawio');
}

// =============================================
// SPRINT 1 - SEQUENCE: Authentification
// =============================================
function sprint1Seq() {
  gid=300; let c='';
  const LY=20, LH=580, OW=140, OH=40, MX=[80,280,480,700];
  const labels = ["Utilisateur","Application\nMobile (Flutter)","Backend\n(Node.js)","PostgreSQL"];

  labels.forEach((l,i) => {
    const id=`obj${i}`;
    c += v(id, l, SL_OBJ, MX[i], LY, OW, OH);
    c += v(`line${i}`, '', SL_LINE, MX[i]+OW/2, LY+OH, 2, LH, '1');
  });

  const msgs = [
    [0,1,"Saisir Email + Mot de passe",150, SL_MSG],
    [1,2,"POST /api/auth/login\n{email, password}",200, SL_MSG],
    [2,3,"SELECT user WHERE email=?",250, SL_MSG],
    [3,2,"User data (ou null)",300, SL_RET],
    [2,1,"401 Unauthorized",380, SL_RET],
    [1,0,"Afficher 'Identifiants invalides'",430, SL_RET],
    [2,2,"Vérifier bcrypt hash",350, 'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=10;entryX=1;entryY=0.5;entryDx=0;entryDy=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;'],
    [2,2,"Générer JWT Token",390, 'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=10;entryX=1;entryY=0.5;entryDx=0;entryDy=0;exitX=1;exitY=0.5;exitDx=0;exitDy=0;'],
    [2,1,"200 OK + {token, user}",460, SL_MSG],
    [1,0,"Redirection Dashboard",510, SL_MSG],
  ];

  // ALT box
  c += v(newId(),'[Utilisateur introuvable / MDP invalide]',SL_ALT,260,360,500,100);
  c += v(newId(),'[Authentification réussie]',SL_ALT_IN,260,440,500,130);

  const validMsgs = [
    [0,1,"Saisir Email + Mot de passe",150, SL_MSG],
    [1,2,"POST /api/auth/login",200, SL_MSG],
    [2,3,"SELECT user WHERE email=?",250, SL_MSG],
    [3,2,"User data",300, SL_RET],
  ];
  validMsgs.forEach(([s,t,label,y,style]) => {
    const sx = MX[s]+OW/2, tx = MX[t]+OW/2;
    c += `<mxCell id="${newId()}" value="${label}" style="${style}" edge="1" parent="1"><mxGeometry x="${sx}" y="${y+LY+OH}" width="50" height="14" as="geometry"><mxPoint x="${sx}" y="${y+LY+OH}" as="sourcePoint"/><mxPoint x="${tx}" y="${y+LY+OH}" as="targetPoint"/></mxGeometry></mxCell>\n`;
  });

  fs.writeFileSync('Sprint1_Sequence_Auth.drawio', wrap(c,'Sprint 1 - Séquence: S\'authentifier'));
  console.log('✅ Sprint1_Sequence_Auth.drawio');
}

sprint1UC();
sprint1Class();
sprint1Seq();
console.log('\n--- Sprint 1 terminé ---');
