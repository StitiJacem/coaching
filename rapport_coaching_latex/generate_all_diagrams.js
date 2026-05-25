/**
 * Génère tous les diagrammes draw.io (global + 6 sprints) alignés sur web_project_sprint_analysis.md
 * Usage: node generate_all_diagrams.js
 */
const fs = require('fs');

let gid = 10;
const uid = () => `n${gid++}`;
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function wrap(body, title, width = 1654, height = 1200) {
  return `<mxfile host="app.diagrams.net" version="21.6.8"><diagram id="d1" name="${esc(title)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" page="1" pageWidth="${width}" pageHeight="${height}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>
${body}</root></mxGraphModel></diagram></mxfile>`;
}

function v(id, val, style, x, y, w, h, par = '1') {
  return `<mxCell id="${id}" value="${esc(val)}" style="${style}" vertex="1" parent="${par}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;
}
function ed(src, tgt, label = '', style = 'endArrow=none;html=1;strokeColor=#444;') {
  return `<mxCell id="${uid()}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}
function msg(label, y, x1, x2, ret = false) {
  const s = ret
    ? 'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=9;'
    : 'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=9;';
  return `<mxCell id="${uid()}" value="${esc(label)}" style="${s}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y}" as="sourcePoint"/><mxPoint x="${x2}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>\n`;
}
function cls(id, name, attrs, x, y, w = 200, color = '#dae8fc', stroke = '#6c8ebf') {
  const LH = 20;
  const H = 28 + attrs.length * LH + 4;
  const HDR = `swimlane;startSize=28;fillColor=${color};strokeColor=${stroke};fontStyle=1;fontSize=10;`;
  const ATR =
    'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=9;';
  let b = v(id, name, HDR, x, y, w, H);
  attrs.forEach((a, i) => {
    b += v(uid(), a, ATR, 0, 28 + i * LH, w, LH, id);
  });
  return b;
}

const ACT_U =
  'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#f5f5f5;strokeColor=#666666;';
const ACT_A =
  'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#dae8fc;strokeColor=#6c8ebf;';
const ACT_C =
  'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#e1d5e7;strokeColor=#9673a6;';
const ACT_N =
  'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#d5e8d4;strokeColor=#82b366;';
const ACT_ADM =
  'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#f8cecc;strokeColor=#b85450;';
const UCS = 'ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BND =
  'rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;verticalAlign=top;fontSize=12;fontStyle=1;';
const TIER =
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=11;';
const SVC =
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;';
const DB =
  'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=12;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;fontStyle=1;';
const SL_OBJ = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=10;';
const SL_LINE = 'line;html=1;dashed=1;strokeColor=#999;endArrow=none;';
const INH = 'endArrow=block;endFill=0;endSize=10;html=1;strokeColor=#23445D;strokeWidth=2;';
const CMP = 'endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASC = 'endArrow=none;html=1;edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#444;';
const ASC2 = 'endArrow=open;endFill=0;html=1;edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#666;';
const INC = 'endArrow=open;endFill=0;dashed=1;html=1;edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#666;';

const attUser = ['+ id : number', '+ email : string', '+ passwordHash : string', '+ role : enum', '+ is_verified : boolean', '+ oauth_provider : string'];
const attCoach = ['+ id : uuid', '+ bio : string', '+ experience_years : int', '+ rating : decimal', '+ monthlyPrice : decimal'];
const attAthlete = ['+ id : number', '+ height : decimal', '+ weight : decimal', '+ goals : string', '+ fitnessLevel : string'];
const attNut = ['+ id : uuid', '+ bio : string', '+ specializations : string[]', '+ verified : boolean'];
const attCReq = ['+ id : uuid', '+ status : pending|accepted|rejected', '+ message : string', '+ created_at : date'];
const attProg = ['+ id : number', '+ name : string', '+ description : string', '+ status : string', '+ is_template : boolean'];
const attPDay = ['+ id : uuid', '+ dayName : string', '+ dayOrder : int', '+ isRestDay : boolean'];
const attPEx = ['+ id : uuid', '+ sets : int', '+ reps : int', '+ restTimeSec : float'];
const attExercise = ['+ id : uuid', '+ name : string', '+ targetMuscle : string', '+ category : string'];
const attWLog = ['+ id : uuid', '+ completedAt : date', '+ actualWeight : float', '+ actualReps : int'];
const attDietPlan = ['+ id : uuid', '+ name : string', '+ goal : enum', '+ isTemplate : boolean'];
const attDietDay = ['+ id : uuid', '+ dayNumber : int', '+ totalCalories : float'];
const attMeal = ['+ id : uuid', '+ name : string', '+ calories : float', '+ protein : float', '+ carbs : float', '+ fats : float'];
const attMLog = ['+ id : uuid', '+ date : date', '+ mealName : string', '+ calories : float'];
const attGoal = ['+ id : uuid', '+ title : string', '+ targetValue : float', '+ deadline : date'];
const attMsg = ['+ id : uuid', '+ content : string', '+ sentAt : date', '+ isRead : boolean'];
const attConv = ['+ id : uuid', '+ lastMessageAt : date'];
const attSession = ['+ id : uuid', '+ scheduledAt : date', '+ status : enum', '+ meetingLink : string'];
const attSub = ['+ id : uuid', '+ stripeCustomerId : string', '+ status : enum', '+ planType : string'];

function ucDiagram(boundary, actors, useCases, links, extendsRel = []) {
  gid = 100;
  let b = v('bnd', boundary, BND, 200, 10, 800, 700);
  actors.forEach(([id, label, x, y, style]) => {
    b += v(id, label, style || ACT_U, x, y, 50, 80);
  });
  useCases.forEach(([id, label, x, y, w = 180, h = 55]) => {
    b += v(id, label, UCS, x, y, w, h);
  });
  links.forEach(([s, t]) => {
    b += ed(s, t, '', ASC);
  });
  extendsRel.forEach(([s, t, rel]) => {
    b += ed(s, t, rel || '<<include>>', INC);
  });
  return b;
}

function seqDiagram(labels, messages, note = null) {
  gid = 500;
  const LY = 20;
  const OH = 40;
  const OW = 140;
  const span = Math.floor(900 / labels.length);
  const MX = labels.map((_, i) => 40 + i * span);
  let b = '';
  labels.forEach((l, i) => {
    b += v(`o${i}`, l, SL_OBJ, MX[i], LY, OW, OH);
    b += v(`l${i}`, '', SL_LINE, MX[i] + OW / 2, LY + OH, 2, 620);
  });
  messages.forEach(([s, t, label, y, ret]) => {
    b += msg(label, y + LY + OH, MX[s] + OW / 2, MX[t] + OW / 2, ret);
  });
  if (note) {
    b += v(uid(), note, 'shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=9;', 40, 680, 320, 50);
  }
  return b;
}

function buildGlobalUC() {
  gid = 200;
  let b = v('bnd', 'Système GOSPORT (Web)', BND, 220, 15, 1200, 950);
  b += v('adm', 'Administrateur', ACT_ADM, 40, 80, 50, 80);
  b += v('coa', 'Coach', ACT_C, 40, 280, 50, 80);
  b += v('nut', 'Nutritionniste', ACT_N, 40, 520, 50, 80);
  b += v('ath', 'Athlète', ACT_A, 1340, 380, 50, 80);

  const ucs = [
    ['u1', "S'authentifier", 320, 40],
    ['u2', 'Compléter profil / Onboarding', 560, 40],
    ['u3', 'Découvrir coachs / nutritionnistes', 800, 40],
    ['u4', 'Envoyer / gérer demandes coaching', 1040, 40],
    ['c1', 'Créer programme entraînement', 320, 180],
    ['c2', 'Assigner programme', 560, 180],
    ['c3', 'Gérer catalogue exercices', 800, 180],
    ['a1', 'Jouer séance (Workout Player)', 1040, 180],
    ['a2', 'Consulter historique séances', 320, 300],
    ['n1', 'Créer plan nutritionnel', 560, 420],
    ['n2', 'Suivre macros / logger repas', 800, 420],
    ['n3', 'Définir objectifs santé', 1040, 420],
    ['m1', 'Messagerie instantanée', 320, 540],
    ['m2', 'Consulter copilote IA', 560, 540],
    ['m3', 'Réserver session / agenda', 800, 540],
    ['ad1', 'Dashboard admin KPIs', 560, 680],
    ['ad2', 'Gérer utilisateurs', 800, 680],
  ];
  ucs.forEach(([i, l, x, y]) => b += v(i, l, UCS, x, y, 200, 55));

  [
    ['adm', 'u1'], ['adm', 'ad1'], ['adm', 'ad2'],
    ['coa', 'u1'], ['coa', 'u2'], ['coa', 'u3'], ['coa', 'u4'], ['coa', 'c1'], ['coa', 'c2'], ['coa', 'm1'], ['coa', 'm2'], ['coa', 'm3'],
    ['nut', 'u1'], ['nut', 'u2'], ['nut', 'u3'], ['nut', 'n1'], ['nut', 'n2'], ['nut', 'm1'],
    ['ath', 'u1'], ['ath', 'u2'], ['ath', 'u3'], ['ath', 'u4'], ['ath', 'a1'], ['ath', 'a2'], ['ath', 'n2'], ['ath', 'n3'], ['ath', 'm1'], ['ath', 'm2'], ['ath', 'm3'],
  ].forEach(([s, t]) => b += ed(s, t));
  b += ed('a1', 'a2', '<<extend>>', INC);

  fs.writeFileSync('Global_Cas_Utilisation.drawio', wrap(b, 'Global - Cas utilisation', 1654, 1100));
}

function buildGlobalClass() {
  gid = 300;
  let b = '';
  b += cls('User', 'User', attUser, 480, 20, 220, '#f5f5f5', '#666');
  b += cls('Coach', 'Coach', attCoach, 80, 300, 220, '#e1d5e7', '#9673a6');
  b += cls('Athlete', 'Athlete', attAthlete, 480, 300, 220, '#dae8fc', '#6c8ebf');
  b += cls('NutritionistProfile', 'NutritionistProfile', attNut, 880, 300, 240, '#d5e8d4', '#82b366');
  b += cls('CoachingRequest', 'CoachingRequest', attCReq, 80, 560, 220);
  b += cls('Program', 'Program', attProg, 320, 560, 220, '#e1d5e7', '#9673a6');
  b += cls('ProgramDay', 'ProgramDay', attPDay, 80, 780, 220, '#e1d5e7', '#9673a6');
  b += cls('ProgramExercise', 'ProgramExercise', attPEx, 320, 780, 240, '#e1d5e7', '#9673a6');
  b += cls('Exercise', 'Exercise', attExercise, 600, 780, 200, '#f8cecc', '#b85450');
  b += cls('DietPlan', 'DietPlan', attDietPlan, 880, 560, 220, '#d5e8d4', '#82b366');
  b += cls('DietDay', 'DietDay', attDietDay, 880, 780, 220, '#d5e8d4', '#82b366');
  b += cls('Meal', 'Meal', attMeal, 1120, 780, 200, '#d5e8d4', '#82b366');
  b += cls('WorkoutLog', 'WorkoutLog', attWLog, 600, 560, 200, '#dae8fc', '#6c8ebf');
  b += cls('MealLog', 'MealLog', attMLog, 1120, 560, 200, '#dae8fc', '#6c8ebf');
  b += cls('Conversation', 'Conversation', attConv, 480, 1000, 220);
  b += cls('Message', 'Message', attMsg, 80, 1000, 200);
  b += cls('Session', 'Session', attSession, 720, 1000, 220);
  b += cls('Subscription', 'Subscription', attSub, 1000, 1000, 220, '#f8cecc', '#b85450');

  b += ed('Coach', 'User', '', INH);
  b += ed('Athlete', 'User', '', INH);
  b += ed('NutritionistProfile', 'User', '', INH);
  b += ed('Athlete', 'CoachingRequest', '', ASC2);
  b += ed('Coach', 'CoachingRequest', '', ASC2);
  b += ed('Program', 'ProgramDay', '', CMP);
  b += ed('ProgramDay', 'ProgramExercise', '', CMP);
  b += ed('ProgramExercise', 'Exercise', '', ASC2);
  b += ed('DietPlan', 'DietDay', '', CMP);
  b += ed('DietDay', 'Meal', '', CMP);
  b += ed('Athlete', 'WorkoutLog', '', ASC2);
  b += ed('Athlete', 'MealLog', '', ASC2);
  b += ed('Conversation', 'Message', '', CMP);
  b += ed('Coach', 'Program', '', ASC2);
  b += ed('NutritionistProfile', 'DietPlan', '', ASC2);

  fs.writeFileSync('Global_Classes.drawio', wrap(b, 'Global - Classes', 1654, 1300));
}

function buildArchitecture3Tiers() {
  gid = 400;
  let b = '';
  b += v('t1', 'Tiers Présentation', TIER, 80, 40, 1100, 120);
  b += v('ang', 'Angular SPA (Frontend)\nTailwind CSS · Reactive Forms · Guards JWT', TIER, 120, 75, 420, 70);
  b += v('sock_c', 'Socket.io Client (chat temps réel)', SVC, 580, 75, 280, 70);

  b += v('t2', 'Tiers Applicatif', TIER, 80, 200, 1100, 200);
  b += v('exp', 'Node.js + Express (TypeScript)\nControllers · Services · Middleware JWT', TIER, 120, 235, 360, 70);
  b += v('sock_s', 'Socket.io Server', SVC, 520, 235, 160, 70);
  b += v('ai', 'AIService → Google Gemini API', SVC, 720, 235, 200, 70);

  b += v('t3', 'Tiers Données & Services externes', TIER, 80, 440, 1100, 160);
  b += v('pg', 'PostgreSQL\n(TypeORM Entities)', DB, 200, 480, 200, 90);
  b += v('gem', 'Google Gemini', SVC, 480, 490, 160, 60);
  b += v('jit', 'Jitsi (visioconférence)', SVC, 920, 490, 180, 60);

  b += msg('HTTPS REST (JSON)', 180, 620, 300, false);
  b += msg('WebSocket', 220, 720, 600, false);
  b += msg('SQL via TypeORM', 320, 300, 300, false);

  fs.writeFileSync('Architecture_3_Tiers.drawio', wrap(b, 'Architecture 3-Tiers', 1280, 700));
}

function buildSprint1() {
  const uc = ucDiagram(
    'Sprint 1 — Socle, Authentification et Onboarding',
    [['u', 'Utilisateur', 50, 280, ACT_U], ['c', 'Coach', 1020, 120, ACT_C], ['a', 'Athlète', 1020, 320, ACT_A], ['n', 'Nutritionniste', 1020, 520, ACT_N]],
    [['uc1', 'Créer un compte', 280, 50], ['uc2', "S'authentifier", 520, 50], ['uc3', 'OAuth Google', 760, 50], ['uc4', 'Vérifier e-mail', 280, 160], ['uc5', 'Réinitialiser mot de passe', 520, 160], ['uc6', 'Compléter profil (onboarding)', 760, 160], ['uc7', 'Modifier profil', 280, 300]],
    [['u', 'uc1'], ['u', 'uc2'], ['u', 'uc3'], ['u', 'uc4'], ['u', 'uc5'], ['u', 'uc6'], ['u', 'uc7'], ['c', 'uc2'], ['c', 'uc6'], ['c', 'uc7'], ['a', 'uc2'], ['a', 'uc6'], ['a', 'uc7'], ['n', 'uc2'], ['n', 'uc6'], ['n', 'uc7']],
    [['uc2', 'uc4', '<<extend>>'], ['uc2', 'uc5', '<<extend>>']]
  );
  fs.writeFileSync('Sprint1_Cas_Utilisation.drawio', wrap(uc, 'Sprint 1 - CU'));

  gid = 600;
  let cl = cls('User', 'User', attUser, 400, 20) + cls('Coach', 'Coach', attCoach, 80, 280, 220, '#e1d5e7', '#9673a6') + cls('Athlete', 'Athlete', attAthlete, 400, 280, 220, '#dae8fc', '#6c8ebf') + cls('NutritionistProfile', 'NutritionistProfile', attNut, 720, 280, 240, '#d5e8d4', '#82b366');
  cl += ed('Coach', 'User', '', INH) + ed('Athlete', 'User', '', INH) + ed('NutritionistProfile', 'User', '', INH);
  fs.writeFileSync('Sprint1_Classes.drawio', wrap(cl, 'Sprint 1 - Classes'));

  const seq = seqDiagram(['Utilisateur', 'Angular\n(Frontend)', 'Node.js\n(Backend)', 'PostgreSQL'], [
    [0, 1, 'Saisir email + mot de passe', 80, false], [1, 2, 'POST /api/auth/login', 130, false], [2, 3, 'SELECT user WHERE email=?', 180, false], [3, 2, 'Données utilisateur', 220, true],
    [2, 2, 'bcrypt.compare(password)', 260, false], [2, 2, 'jwt.sign({id, role})', 300, false], [2, 1, '200 OK {token, user}', 340, true], [1, 0, 'authGuard → Dashboard', 380, true],
  ]);
  fs.writeFileSync('Sprint1_Sequence_Auth.drawio', wrap(seq, 'Sprint 1 - Séquence Auth', 1169, 827));
}

function buildSprint2() {
  const uc = ucDiagram(
    'Sprint 2 — Découverte et Mise en relation',
    [['a', 'Athlète', 50, 280, ACT_A], ['c', 'Coach', 1020, 150, ACT_C], ['n', 'Nutritionniste', 1020, 450, ACT_N]],
    [['uc1', 'Découvrir coachs / filtrer', 280, 60], ['uc2', 'Consulter profil public', 520, 60], ['uc3', 'Envoyer demande coaching', 280, 200], ['uc4', 'Accepter / refuser demande', 520, 200], ['uc5', 'Envoyer demande nutrition', 280, 340], ['uc6', 'Répondre demande nutrition', 520, 340], ['uc7', 'Déconnecter athlète', 280, 480]],
    [['a', 'uc1'], ['a', 'uc2'], ['a', 'uc3'], ['a', 'uc5'], ['c', 'uc1'], ['c', 'uc2'], ['c', 'uc4'], ['c', 'uc7'], ['n', 'uc2'], ['n', 'uc6']],
    [['uc3', 'uc2', '<<include>>']]
  );
  fs.writeFileSync('Sprint2_Cas_Utilisation.drawio', wrap(uc, 'Sprint 2 - CU'));

  gid = 700;
  let cl = cls('User', 'User', ['+ id', '+ email', '+ role'], 400, 20, 180) + cls('Coach', 'Coach', attCoach, 80, 200, 220, '#e1d5e7', '#9673a6') + cls('Athlete', 'Athlete', attAthlete, 400, 200, 220, '#dae8fc', '#6c8ebf');
  cl += cls('CoachingRequest', 'CoachingRequest', attCReq, 80, 450, 240) + cls('NutritionConnection', 'NutritionConnection', ['+ id : uuid', '+ status : enum', '+ message : string'], 480, 450, 260) + cls('UserInvitation', 'UserInvitation', ['+ id : uuid', '+ token : string', '+ expiresAt : date'], 800, 450, 240);
  cl += ed('Coach', 'User', '', INH) + ed('Athlete', 'User', '', INH) + ed('Athlete', 'CoachingRequest', '', ASC2) + ed('Coach', 'CoachingRequest', '', ASC2) + ed('Athlete', 'NutritionConnection', '', ASC2);
  fs.writeFileSync('Sprint2_Classes.drawio', wrap(cl, 'Sprint 2 - Classes'));

  const seq = seqDiagram(['Athlète', 'Angular', 'Backend', 'PostgreSQL', 'Coach'], [
    [0, 1, 'Sélectionner coach + message', 80, false], [1, 2, 'POST /api/coaching-requests', 130, false], [2, 3, 'INSERT coaching_requests (pending)', 180, false], [3, 2, 'requestId', 220, true],
    [2, 4, 'Notification nouvelle demande', 260, false], [4, 1, 'Consulter demandes en attente', 300, false], [4, 2, 'PATCH /api/coaching-requests/:id', 340, false], [2, 3, 'UPDATE status = accepted', 380, false], [2, 1, '200 OK', 420, true], [1, 0, 'Coach lié à l\'athlète', 460, true],
  ]);
  fs.writeFileSync('Sprint2_Sequence_CoachingRequest.drawio', wrap(seq, 'Sprint 2 - Séquence', 1200, 827));
}

function buildSprint3() {
  const uc = ucDiagram(
    'Sprint 3 — Exercices, Programmes et Workout Player',
    [['c', 'Coach', 50, 200, ACT_C], ['a', 'Athlète', 1020, 200, ACT_A]],
    [['uc1', 'Consulter catalogue exercices', 280, 50], ['uc2', 'Créer programme (Workout Builder)', 520, 50], ['uc3', 'Assigner programme à athlète', 280, 180], ['uc4', 'Jouer séance (Workout Player)', 520, 180], ['uc5', 'Enregistrer WorkoutLog', 280, 310], ['uc6', 'Consulter historique séances', 520, 310]],
    [['c', 'uc1'], ['c', 'uc2'], ['c', 'uc3'], ['a', 'uc4'], ['a', 'uc5'], ['a', 'uc6']],
    [['uc2', 'uc1', '<<include>>'], ['uc4', 'uc5', '<<extend>>']]
  );
  fs.writeFileSync('Sprint3_Cas_Utilisation.drawio', wrap(uc, 'Sprint 3 - CU'));

  gid = 800;
  let cl = cls('Program', 'Program', attProg, 80, 20, 220, '#e1d5e7', '#9673a6') + cls('ProgramDay', 'ProgramDay', attPDay, 80, 220, 220, '#e1d5e7', '#9673a6') + cls('ProgramExercise', 'ProgramExercise', attPEx, 80, 420, 240, '#e1d5e7', '#9673a6');
  cl += cls('Exercise', 'Exercise', attExercise, 400, 420, 220, '#f8cecc', '#b85450') + cls('WorkoutLog', 'WorkoutLog', attWLog, 700, 220, 220, '#dae8fc', '#6c8ebf') + cls('ExerciseLog', 'ExerciseLog', ['+ id : uuid', '+ setNumber : int', '+ weight : float'], 700, 420, 220, '#dae8fc', '#6c8ebf');
  cl += ed('Program', 'ProgramDay', '', CMP) + ed('ProgramDay', 'ProgramExercise', '', CMP) + ed('ProgramExercise', 'Exercise', '', ASC2) + ed('ProgramExercise', 'WorkoutLog', '', ASC2) + ed('WorkoutLog', 'ExerciseLog', '', CMP);
  fs.writeFileSync('Sprint3_Classes.drawio', wrap(cl, 'Sprint 3 - Classes'));

  const seq = seqDiagram(['Coach', 'Angular', 'Backend\n(QueryRunner)', 'PostgreSQL'], [
    [0, 1, 'Workout Builder: jours + exercices', 80, false], [1, 2, 'POST /api/programs', 130, false], [2, 2, 'BEGIN TRANSACTION', 170, false], [2, 3, 'INSERT programs + days + exercises', 210, false], [2, 2, 'COMMIT', 290, false], [2, 1, '201 Created {programId}', 330, true], [1, 0, 'Confirmation', 370, true],
  ]);
  fs.writeFileSync('Sprint3_Sequence_SaveProgram.drawio', wrap(seq, 'Sprint 3 - Séquence', 1100, 827));
}

function buildSprint4() {
  const uc = ucDiagram(
    'Sprint 4 — Nutrition et Objectifs',
    [['c', 'Coach / Nutritionniste', 50, 250, ACT_N], ['a', 'Athlète', 1020, 250, ACT_A]],
    [['uc1', 'Créer plan alimentaire (Diet Builder)', 280, 50], ['uc2', 'Assigner plan à athlète(s)', 520, 50], ['uc3', 'Suivre macros quotidiens', 280, 180], ['uc4', 'Enregistrer repas (MealLog)', 520, 180], ['uc5', 'Consulter compliance nutrition', 280, 310], ['uc6', 'Définir / suivre objectifs (Goals)', 520, 310]],
    [['c', 'uc1'], ['c', 'uc2'], ['c', 'uc5'], ['a', 'uc3'], ['a', 'uc4'], ['a', 'uc6']],
    [['uc1', 'uc2', '<<include>>']]
  );
  fs.writeFileSync('Sprint4_Cas_Utilisation.drawio', wrap(uc, 'Sprint 4 - CU'));

  gid = 900;
  let cl = cls('DietPlan', 'DietPlan', attDietPlan, 80, 20, 220, '#d5e8d4', '#82b366') + cls('DietDay', 'DietDay', attDietDay, 80, 220, 220, '#d5e8d4', '#82b366') + cls('Meal', 'Meal', attMeal, 80, 420, 220, '#d5e8d4', '#82b366');
  cl += cls('MealLog', 'MealLog', attMLog, 400, 220, 220, '#dae8fc', '#6c8ebf') + cls('DietaryProfile', 'DietaryProfile', ['+ targetCalories : float', '+ targetProtein : float'], 400, 420, 240) + cls('Goal', 'Goal', attGoal, 700, 220, 200);
  cl += ed('DietPlan', 'DietDay', '', CMP) + ed('DietDay', 'Meal', '', CMP);
  fs.writeFileSync('Sprint4_Classes.drawio', wrap(cl, 'Sprint 4 - Classes'));

  const seq = seqDiagram(['Athlète', 'Angular\n(nutrition)', 'Backend', 'PostgreSQL'], [
    [0, 1, 'Saisir repas + macros', 80, false], [1, 2, 'POST /api/nutrition/athletes/:id/log', 130, false], [2, 3, 'INSERT meal_logs', 180, false], [3, 2, 'logId', 220, true], [2, 2, 'Calcul totaux journaliers', 260, false], [2, 1, '200 OK {logs, totals}', 300, true], [1, 0, 'Graphiques macros mis à jour', 340, true],
  ]);
  fs.writeFileSync('Sprint4_Sequence_LogMeal.drawio', wrap(seq, 'Sprint 4 - Séquence', 1000, 827));
}

function buildSprint5() {
  const uc = ucDiagram(
    'Sprint 5 — Messagerie, IA et Agendas',
    [['u', 'Utilisateur', 50, 280, ACT_U], ['c', 'Coach', 1020, 150, ACT_C], ['a', 'Athlète', 1020, 400, ACT_A]],
    [['uc1', 'Envoyer message (chat)', 280, 50], ['uc2', 'Recevoir message temps réel', 520, 50], ['uc3', 'Consulter copilote IA (Gemini)', 280, 180], ['uc4', 'Créer session / rendez-vous', 520, 180], ['uc5', 'Consulter calendrier', 280, 310], ['uc6', 'Rejoindre visio Jitsi', 520, 310]],
    [['u', 'uc1'], ['u', 'uc2'], ['u', 'uc3'], ['c', 'uc4'], ['c', 'uc5'], ['c', 'uc6'], ['a', 'uc4'], ['a', 'uc5'], ['a', 'uc6']],
    [['uc4', 'uc6', '<<include>>']]
  );
  fs.writeFileSync('Sprint5_Cas_Utilisation.drawio', wrap(uc, 'Sprint 5 - CU'));

  gid = 1000;
  let cl = cls('Conversation', 'Conversation', attConv, 80, 20, 220) + cls('Message', 'Message', attMsg, 380, 20, 200) + cls('Notification', 'Notification', ['+ id : uuid', '+ type : string', '+ isRead : boolean'], 620, 20, 220) + cls('Session', 'Session', attSession, 80, 280, 240) + cls('ActivityEvent', 'ActivityEvent', ['+ id : uuid', '+ title : string', '+ startAt : date'], 380, 280, 240);
  cl += ed('Conversation', 'Message', '', CMP);
  fs.writeFileSync('Sprint5_Classes.drawio', wrap(cl, 'Sprint 5 - Classes'));

  const seq = seqDiagram(['Expéditeur', 'Angular', 'Backend\nSocket.io', 'PostgreSQL', 'Destinataire'], [
    [0, 1, 'Saisir message + Envoyer', 80, false], [1, 2, 'socket.emit("send_message")', 130, false], [2, 3, 'INSERT messages', 180, false], [3, 2, 'messageId', 220, true], [2, 4, 'emit("new_message") si en ligne', 270, false], [4, 1, 'Affichage temps réel', 310, true],
  ], '[Hors ligne] Notification push');
  fs.writeFileSync('Sprint5_Sequence_Message.drawio', wrap(seq, 'Sprint 5 - Séquence Message', 1200, 827));
}

process.chdir(__dirname);
buildGlobalUC();
buildGlobalClass();
buildArchitecture3Tiers();
buildSprint1();
buildSprint2();
buildSprint3();
buildSprint4();
buildSprint5();
console.log('Generated draw.io files.');
