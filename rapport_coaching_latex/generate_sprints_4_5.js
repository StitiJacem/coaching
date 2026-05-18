const fs = require('fs');
let gid = 1000;
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

function v(id, val, style, x, y, w, h, parent='1') {
  return `<mxCell id="${id}" value="${val}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;
}
function e(id, val, style, src, tgt) {
  return `<mxCell id="${id}" value="${val}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}
function cls(id, name, attrs, x, y, w=190) {
  const LH=22, H=30+attrs.length*LH;
  let c = v(id, name, CLS, x, y, w, H);
  attrs.forEach((a,i) => c += v(newId(), a, ATTR, x, y+30+i*LH, w, LH, id));
  return { c, id, x, y, w, h:H };
}

// =============================================
// SPRINT 4 - USE CASE
// =============================================
function generateSprint4UC() {
  gid = 1000;
  let c = '';
  c += v('b1','Sprint 4 — Métriques de Santé &amp; Objets Connectés',BOX,200,20,720,540);
  c += v('a1','Athlète',ACTOR,60,200,50,80);
  c += v('a2','Coach',ACTOR,1010,200,50,80);

  const ucs = [
    ['uc1',"Saisir Mensurations\nCorporelles",280,60],
    ['uc2',"Saisir Poids\nQuotidien",520,60],
    ['uc3',"Synchroniser avec\nGoogle Fit / HealthKit",280,200],
    ['uc4',"Consulter Graphique\nd'Évolution (Courbe)",520,200],
    ['uc5',"Définir Objectifs\nBiométriques",520,340],
    ['uc6',"Analyser Courbe\nPhysiologique",280,340],
  ];
  ucs.forEach(([id,label,x,y]) => c += v(id, label, UC, x, y, 190, 60));

  [['a1','uc1'],['a1','uc2'],['a1','uc3'],['a1','uc4']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a2','uc5'],['a2','uc6']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc3','uc2');

  fs.writeFileSync('Sprint4_Cas_Utilisation.drawio', wrap(c,"Sprint 4 - Cas d'Utilisation"));
  console.log('✅ Sprint4_Cas_Utilisation.drawio généré avec succès !');
}

// =============================================
// SPRINT 4 - CLASS DIAGRAM
// =============================================
function generateSprint4Class() {
  gid = 1100;
  let c = '';
  const {c:c1,id:id1} = cls('User','User',['+ id: UUID','+ email: String','+ firstName: String','+ lastName: String'],400,20);
  const {c:c2,id:id2} = cls('BodyMetric','BodyMetric',['+ id: UUID','+ weight: Float','+ fatPercentage: Float','+ muscleMass: Float','+ waistCircumference: Float','+ chestCircumference: Float','+ measuredAt: Date'],80,240,220);
  const {c:c3,id:id3} = cls('HealthLog','HealthLog (IoT Sync)',['+ id: UUID','+ stepsCount: Int','+ caloriesBurned: Float','+ sleepMinutes: Int','+ syncedAt: Date'],700,240,220);

  c += c1+c2+c3;
  c += e(newId(),'possède 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id2);
  c += e(newId(),'synchronise 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id3);

  fs.writeFileSync('Sprint4_Classes.drawio', wrap(c,'Sprint 4 - Diagramme de Classes'));
  console.log('✅ Sprint4_Classes.drawio généré avec succès !');
}

// =============================================
// SPRINT 5 - USE CASE
// =============================================
function generateSprint5UC() {
  gid = 1200;
  let c = '';
  c += v('b1','Sprint 5 — Visioconférence &amp; Agendas',BOX,200,20,720,540);
  c += v('a1','Coach',ACTOR,60,200,50,80);
  c += v('a2','Athlète',ACTOR,1010,200,50,80);

  const ucs = [
    ['uc1',"Définir Disponibilités\n(Plages Horaires)",280,60],
    ['uc2',"Consulter Agenda\ndu Coach",520,60],
    ['uc3',"Réserver Session de\nCoaching (Rendez-vous)",280,200],
    ['uc4',"Accepter/Refuser\nDemande de Session",280,340],
    ['uc5',"Démarrer Appel Vidéo\n(Jitsi WebRTC)",520,340],
  ];
  ucs.forEach(([id,label,x,y]) => c += v(id, label, UC, x, y, 190, 60));

  [['a1','uc1'],['a1','uc4'],['a1','uc5']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a2','uc2'],['a2','uc3'],['a2','uc5']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc3','uc2');

  fs.writeFileSync('Sprint5_Cas_Utilisation.drawio', wrap(c,"Sprint 5 - Cas d'Utilisation"));
  console.log('✅ Sprint5_Cas_Utilisation.drawio généré avec succès !');
}

// =============================================
// SPRINT 5 - CLASS DIAGRAM
// =============================================
function generateSprint5Class() {
  gid = 1300;
  let c = '';
  const {c:c1,id:id1} = cls('CoachProfile','CoachProfile',['+ id: UUID','+ userId: UUID','+ monthlyPrice: Float'],400,20);
  const {c:c2,id:id2} = cls('AvailabilitySlot','AvailabilitySlot',['+ id: UUID','+ dayOfWeek: Int','+ startTime: String','+ endTime: String','+ isBooked: Boolean'],80,240,220);
  const {c:c3,id:id3} = cls('CoachingSession','CoachingSession',['+ id: UUID','+ scheduledAt: Date','+ durationMinutes: Int','+ status: Enum','+ roomName: String','+ createdAt: Date'],700,240,220);

  c += c1+c2+c3;
  c += e(newId(),'définit 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id2);
  c += e(newId(),'anime 0..*','endArrow=none;html=1;strokeColor=#555;',id1,id3);

  fs.writeFileSync('Sprint5_Classes.drawio', wrap(c,'Sprint 5 - Diagramme de Classes'));
  console.log('✅ Sprint5_Classes.drawio généré avec succès !');
}

generateSprint4UC();
generateSprint4Class();
generateSprint5UC();
generateSprint5Class();
console.log('\n--- Tous les diagrammes Sprint 4 & 5 ont été créés ---');
