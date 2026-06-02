const fs = require('fs');
let gid = 400;
const newId = () => `c${gid++}`;

function wrap(content, title) {
  return `<mxfile version="21.6.8"><diagram id="d1" name="${title}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${content}</root></mxGraphModel></diagram></mxfile>`;
}

const ACTOR = 'shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;';
const UC = 'ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BOX = 'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;fontStyle=1;fontSize=11;verticalAlign=top;';
const CLS = 'swimlane;startSize=28;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=11;';
const ATTR = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=10;';
const INH = 'endArrow=block;endFill=0;endSize=12;html=1;strokeColor=#23445D;strokeWidth=2;';
const ASS = 'endArrow=none;html=1;strokeColor=#555;';
const INC = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;';
const COMP = 'endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const SL_OBJ = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=10;';
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
// SPRINT 2 - USE CASE
// =============================================
function sprint2UC() {
  gid=400; let c='';
  c += v('b1','Sprint 2 — Programmes d\'Entraînement &amp; Nutrition',BOX,200,20,720,660);
  c += v('a1','Coach',ACTOR,60,200,50,80);
  c += v('a2','Athlète',ACTOR,1010,350,50,80);

  const ucs = [
    ['uc1',"Créer Programme\nd'Entraînement",260,50],
    ['uc2',"Ajouter Jours\net Exercices",500,50],
    ['uc3',"Assigner Programme\nà un Athlète",740,50],
    ['uc4',"Fixer Objectifs\nNutritionnels",260,200],
    ['uc5',"Consulter\nProgression Athlète",500,200],
    ['uc6',"Accepter Programme\nAssigné",260,370],
    ['uc7',"Jouer Séance\n(Workout Player)",500,370],
    ['uc8',"Logger Poids\nSoulevé",740,370],
    ['uc9',"Logger ses\nRepas",260,520],
    ['uc10',"Consulter\nDashboard Nutrition",500,520],
  ];
  ucs.forEach(([id,label,x,y]) => c += v(id, label, UC, x, y, 180, 60));

  [['a1','uc1'],['a1','uc2'],['a1','uc3'],['a1','uc4'],['a1','uc5']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  [['a2','uc6'],['a2','uc7'],['a2','uc8'],['a2','uc9'],['a2','uc10']].forEach(([s,t]) => c += e(newId(),'',ASS,s,t));
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc1','uc2');
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc1','uc3');
  c += e(newId(),'&lt;&lt;extend&gt;&gt;',INC,'uc7','uc8');
  c += e(newId(),'&lt;&lt;include&gt;&gt;',INC,'uc9','uc10');

  fs.writeFileSync('Sprint2_Cas_Utilisation.drawio', wrap(c,"Sprint 2 - Cas d'Utilisation"));
  console.log('✅ Sprint2_Cas_Utilisation.drawio');
}

// =============================================
// SPRINT 2 - CLASS DIAGRAM
// =============================================
function sprint2Class() {
  gid=500; let c='';
  const {c:c1,id:id1} = cls('Program','Program',['+ id: UUID','+ title: String','+ description: String','+ startDate: Date','+ endDate: Date','+ isActive: Boolean'],400,20);
  const {c:c2,id:id2} = cls('ProgramDay','ProgramDay',['+ id: UUID','+ dayName: String','+ dayOrder: Int','+ isRestDay: Boolean'],60,230);
  const {c:c3,id:id3} = cls('ProgramExercise','ProgramExercise',['+ id: UUID','+ sets: Int','+ reps: Int','+ restTimeSec: Float','+ exerciseOrder: Int'],260,450);
  const {c:c4,id:id4} = cls('Exercise','Exercise',['+ id: UUID','+ name: String','+ targetMuscle: String','+ videoUrl: String','+ category: String','+ difficulty: String'],60,450);
  const {c:c5,id:id5} = cls('WorkoutLog','WorkoutLog',['+ id: UUID','+ completedAt: Date','+ actualWeight: Float','+ actualReps: Int','+ notes: String'],600,450);
  const {c:c6,id:id6} = cls('NutritionLog','NutritionLog',['+ id: UUID','+ date: Date','+ mealName: String','+ calories: Float','+ proteins: Float','+ carbs: Float','+ fats: Float'],700,20);
  c += c1+c2+c3+c4+c5+c6;
  c += e(newId(),'contient 1..*',COMP,id1,id2);
  c += e(newId(),'inclut 1..*',COMP,id2,id3);
  c += e(newId(),'référence 1',ASS,id4,id3);
  c += e(newId(),'génère 0..*',ASS,id3,id5);

  fs.writeFileSync('Sprint2_Classes.drawio', wrap(c,'Sprint 2 - Diagramme de Classes'));
  console.log('✅ Sprint2_Classes.drawio');
}

// =============================================
// SPRINT 2 - SEQUENCE: Créer et Assigner Programme
// =============================================
function sprint2Seq() {
  gid=600; let c='';
  const LY=20, OH=40, OW=150;
  const MX=[40,230,430,650,850];
  const labels=["Coach","Angular\n(Frontend)","Backend\n(Node.js)","PostgreSQL","Athlète\n(Mobile)"];

  labels.forEach((l,i) => {
    c += v(`obj${i}`, l, SL_OBJ, MX[i], LY, OW, OH);
    c += v(`line${i}`, '', SL_LINE, MX[i]+OW/2, LY+OH, 2, 700, '1');
  });

  const messages = [
    [0,1,"Cliquer 'Créer Programme'",80,SL_MSG],
    [1,0,"Afficher formulaire",120,SL_RET],
    [0,1,"Saisir Titre, Dates, Athlète cible",160,SL_MSG],
    [0,1,"Ajouter Jours + Exercices (Séries/Reps)",210,SL_MSG],
    [1,2,"POST /api/programs {data}",260,SL_MSG],
    [2,3,"INSERT INTO programs",310,SL_MSG],
    [3,2,"programId",340,SL_RET],
    [2,3,"INSERT INTO program_days (x N)",370,SL_MSG],
    [2,3,"INSERT INTO program_exercises (x M)",400,SL_MSG],
    [3,2,"Succès",430,SL_RET],
    [2,1,"201 Created {programId}",460,SL_MSG],
    [1,0,"Confirmation affichée",490,SL_RET],
    [2,4,"Notification: Nouveau Programme",540,SL_MSG],
    [4,2,"Accusé de réception",580,SL_RET],
  ];

  messages.forEach(([s,t,label,y,style]) => {
    c += msg(label, y+LY+OH, MX[s]+OW/2, MX[t]+OW/2, style);
  });

  fs.writeFileSync('Sprint2_Sequence_Programme.drawio', wrap(c,"Sprint 2 - Séquence: Créer &amp; Assigner Programme"));
  console.log('✅ Sprint2_Sequence_Programme.drawio');
}

sprint2UC();
sprint2Class();
sprint2Seq();
console.log('\n--- Sprint 2 terminé ---');
