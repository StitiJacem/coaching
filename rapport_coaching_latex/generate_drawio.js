const fs = require('fs');

// =============================================
// HELPERS
// =============================================
let gid = 2;
const newId = () => `cell${gid++}`;

function wrap(content, title) {
  return `<mxfile version="21.6.8">
  <diagram id="d1" name="${title}">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${content}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

const ACTOR_STYLE = 'shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
const UC_STYLE = 'ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;fontSize=10;';
const SYS_STYLE = 'points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];shape=mxgraph.flowchart.start_2;html=1;fillColor=none;strokeColor=#23445D;fontSize=13;fontStyle=1;strokeWidth=2;';
const ASSOC_STYLE = 'endArrow=none;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;strokeColor=#444;';
const INCLUDE_STYLE = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#444;';
const CLASS_HEADER_STYLE = 'swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=11;';
const CLASS_ATTR_STYLE = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=10;';
const INH_STYLE = 'endArrow=block;endFill=0;endSize=12;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;strokeColor=#23445D;strokeWidth=2;';
const COMP_STYLE = 'endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASSOC_CLASS_STYLE = 'endArrow=open;endFill=0;html=1;strokeColor=#555;';
const NOTE_STYLE = 'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;size=15;fillColor=#f5f5f5;strokeColor=#666;fontColor=#333;fontSize=10;';
const LIFELINE_STYLE = 'line;html=1;strokeColor=#23445D;dashed=1;';
const ACT_BOX_STYLE = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;';
const MSG_STYLE = 'endArrow=block;endFill=1;html=1;strokeColor=#23445D;';
const RET_STYLE = 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;';

function cell(id, value, style, x, y, w, h, parent='1', vertex='1') {
  return `        <mxCell id="${id}" value="${value}" style="${style}" vertex="${vertex}" parent="${parent}">
          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/>
        </mxCell>\n`;
}

function edge(id, value, style, src, tgt, parent='1') {
  return `        <mxCell id="${id}" value="${value}" style="${style}" edge="1" parent="${parent}" source="${src}" target="${tgt}">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>\n`;
}

function boundary(id, label, x, y, w, h) {
  return `        <mxCell id="${id}" value="${label}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;fontStyle=1;fontSize=12;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/>
        </mxCell>\n`;
}

// =============================================
// 1. GLOBAL USE CASE DIAGRAM
// =============================================
function makeGlobalUseCase() {
  gid = 2;
  let c = '';
  // System boundary
  c += boundary('sys', 'Système CoachingApp', 220, 20, 700, 760);

  // Actors
  c += cell('adm', 'Administrateur', ACTOR_STYLE, 30, 80, 50, 80);
  c += cell('coa', 'Coach', ACTOR_STYLE, 30, 300, 50, 80);
  c += cell('ath', 'Athlète', ACTOR_STYLE, 1010, 300, 50, 80);

  // Use Cases
  const ucs = [
    ['uc1', "S'authentifier", 340, 50],
    ['uc2', 'Gérer son Profil', 580, 50],
    ['uc3', 'Envoyer Demande\nde Coaching', 580, 170],
    ['uc4', 'Accepter/Refuser\nDemande', 340, 170],
    ['uc5', 'Créer Programme\nd\'Entraînement', 340, 310],
    ['uc6', 'Assigner Programme\nà un Athlète', 580, 310],
    ['uc7', 'Jouer Workout\n(Workout Player)', 580, 430],
    ['uc8', 'Suivi Nutritionnel', 340, 430],
    ['uc9', 'Messagerie\nen Temps Réel', 460, 560],
    ['uc10', 'Dashboard &\nStatistiques', 340, 680],
    ['uc11', 'Gérer Catalogue\nExercices', 580, 680],
  ];
  ucs.forEach(([id, label, x, y]) => {
    c += cell(id, label, UC_STYLE, x, y, 160, 60);
  });

  // Edges Admin
  [['adm','uc1'],['adm','uc4'],['adm','uc10'],['adm','uc11']].forEach(([s,t]) => {
    c += edge(newId(), '', ASSOC_STYLE, s, t);
  });
  // Edges Coach
  [['coa','uc1'],['coa','uc2'],['coa','uc4'],['coa','uc5'],['coa','uc6'],['coa','uc8'],['coa','uc9']].forEach(([s,t]) => {
    c += edge(newId(), '', ASSOC_STYLE, s, t);
  });
  // Edges Athlete
  [['ath','uc1'],['ath','uc2'],['ath','uc3'],['ath','uc7'],['ath','uc8'],['ath','uc9']].forEach(([s,t]) => {
    c += edge(newId(), '', ASSOC_STYLE, s, t);
  });
  // Include
  c += edge(newId(), '<<include>>', INCLUDE_STYLE, 'uc5', 'uc6');

  fs.writeFileSync('Global_Cas_Utilisation.drawio', wrap(c, 'Diagramme de Cas d\'Utilisation Global'));
  console.log('✅ Global_Cas_Utilisation.drawio');
}

// =============================================
// 2. GLOBAL CLASS DIAGRAM
// =============================================
function makeGlobalClass() {
  gid = 2;
  let c = '';

  function cls(id, name, attrs, x, y, w) {
    const lineH = 22, headerH = 30;
    const totalH = headerH + attrs.length * lineH + 4;
    c += cell(id, name, CLASS_HEADER_STYLE, x, y, w, totalH);
    attrs.forEach((a, i) => {
      c += cell(newId(), a, CLASS_ATTR_STYLE, x, y + headerH + i * lineH, w, lineH, id);
    });
    return { id, x, y, w, h: totalH };
  }

  // Classes
  cls('User', 'User', ['+ id: UUID','+ email: String','+ password: String','+ role: Enum','+ createdAt: Date','+ login(): void','+ logout(): void'], 460, 20, 200);
  cls('Coach', 'Coach', ['+ specialty: String','+ bio: String','+ experience: Int','+ acceptRequest(): void','+ createProgram(): void'], 200, 200, 200);
  cls('Athlete', 'Athlete', ['+ weight: Float','+ height: Float','+ fitnessGoal: String','+ sendRequest(): void','+ logWorkout(): void'], 700, 200, 200);
  cls('CoachingRequest', 'CoachingRequest', ['+ id: UUID','+ status: Enum','+ message: String','+ createdAt: Date'], 200, 440, 200);
  cls('Program', 'Program', ['+ id: UUID','+ title: String','+ description: String','+ startDate: Date','+ endDate: Date'], 460, 440, 200);
  cls('ProgramDay', 'ProgramDay', ['+ id: UUID','+ dayName: String','+ dayOrder: Int','+ isRestDay: Boolean'], 200, 660, 200);
  cls('Exercise', 'Exercise', ['+ id: UUID','+ name: String','+ targetMuscle: String','+ videoUrl: String','+ category: String'], 700, 660, 200);
  cls('ProgramExercise', 'ProgramExercise', ['+ id: UUID','+ sets: Int','+ reps: Int','+ restTime: Float'], 460, 660, 200);
  cls('NutritionLog', 'NutritionLog', ['+ id: UUID','+ date: Date','+ calories: Float','+ proteins: Float','+ carbs: Float','+ fats: Float'], 700, 440, 200);
  cls('Message', 'Message', ['+ id: UUID','+ content: String','+ sentAt: Date','+ isRead: Boolean'], 20, 660, 200);

  // Inheritance
  c += edge(newId(),'', INH_STYLE, 'Coach', 'User');
  c += edge(newId(),'', INH_STYLE, 'Athlete', 'User');
  // Associations
  c += edge(newId(),'envoie\n0..*', ASSOC_CLASS_STYLE, 'Athlete', 'CoachingRequest');
  c += edge(newId(),'reçoit\n0..*', ASSOC_CLASS_STYLE, 'Coach', 'CoachingRequest');
  c += edge(newId(),'crée\n0..*', ASSOC_CLASS_STYLE, 'Coach', 'Program');
  c += edge(newId(),'assigné à\n0..1', ASSOC_CLASS_STYLE, 'Athlete', 'Program');
  c += edge(newId(),'contient\n1..*', COMP_STYLE, 'Program', 'ProgramDay');
  c += edge(newId(),'inclut\n0..*', COMP_STYLE, 'ProgramDay', 'ProgramExercise');
  c += edge(newId(),'référence\n1', ASSOC_CLASS_STYLE, 'Exercise', 'ProgramExercise');
  c += edge(newId(),'enregistre\n0..*', ASSOC_CLASS_STYLE, 'Athlete', 'NutritionLog');
  c += edge(newId(),'envoie\n0..*', ASSOC_CLASS_STYLE, 'User', 'Message');

  fs.writeFileSync('Global_Classes.drawio', wrap(c, 'Diagramme de Classes Global'));
  console.log('✅ Global_Classes.drawio');
}

makeGlobalUseCase();
makeGlobalClass();
console.log('\n--- Partie 1 terminée ---');
