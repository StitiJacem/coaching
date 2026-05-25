const fs=require('fs');

let gid=10;
const uid=()=>`n${gid++}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function wrap(body,title, width=1654, height=1800){
  return `<mxfile version="21.6.8"><diagram id="d1" name="${esc(title)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" page="1" pageWidth="${width}" pageHeight="${height}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${body}</root></mxGraphModel></diagram></mxfile>`;
}

function v(id,val,style,x,y,w,h,par='1'){
  return `<mxCell id="${id}" value="${esc(val)}" style="${style}" vertex="1" parent="${par}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;
}
function ed(src,tgt,label='',style='endArrow=open;endFill=0;html=1;strokeColor=#444;'){
  return `<mxCell id="${uid()}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}
function arrow(val,y,x1,x2,ret=false){
  const s=ret?'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=9;':'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=9;';
  return `<mxCell id="${uid()}" value="${esc(val)}" style="${s}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y}" as="sourcePoint"/><mxPoint x="${x2}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>\n`;
}
function cls(id,name,attrs,x,y,w=190, color='#dae8fc', stroke='#6c8ebf'){
  const LH=20,H=28+attrs.length*LH+4;
  const HDR=`swimlane;startSize=28;fillColor=${color};strokeColor=${stroke};fontStyle=1;fontSize=10;`;
  const ATR='text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=9;';
  let b=v(id,name,HDR,x,y,w,H);
  attrs.forEach((a,i)=>{b+=v(uid(),a,ATR,0,28+i*LH,w,LH,id);});
  return b;
}

const ACT_U='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f5f5f5;strokeColor=#666666;';
const ACT_A='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
const ACT_C='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;';
const ACT_N='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;';
const ACT_ADM='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f8cecc;strokeColor=#b85450;';

const UCS='ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BND='rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;verticalAlign=top;fontSize=12;fontStyle=1;';
const OBJ='rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666;fontStyle=1;fontSize=10;';
const LFL='line;html=1;dashed=1;strokeColor=#999;endArrow=none;';
const INH='endArrow=block;endFill=0;endSize=10;html=1;strokeColor=#23445D;strokeWidth=2;';
const CMP='endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASC='endArrow=none;html=1;strokeColor=#444;';
const ASC2='endArrow=open;endFill=0;html=1;strokeColor=#666;';
const INC='endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#666;';

// =========================================================================
// ATTRIBUTES DEFINITIONS
// =========================================================================
const attUser = ['+ id : Int','+ email : String','+ passwordHash : String','+ first_name : String','+ last_name : String','+ username : String','+ role : Enum','+ photo_url : String','+ phone : String','+ gender : String','+ age : Int','+ is_verified : Boolean','+ created_at : Date'];
const attCoach = ['+ id : UUID','+ bio : String','+ experience_years : Int','+ rating : Decimal','+ total_clients : Int','+ monthlyPrice : Decimal','+ stripeAccountId : String','+ verified : Boolean'];
const attAthlete = ['+ id : Int','+ height : Decimal','+ weight : Decimal','+ age : Int','+ sport : String','+ goals : String','+ primaryObjective : String','+ fitnessLevel : String','+ experienceLevel : String','+ injuries : String','+ weightGoal : Decimal','+ joinedDate : Date'];
const attNut = ['+ id : UUID','+ bio : String','+ experience_years : Int','+ rating : Decimal','+ total_clients : Int','+ specializations : String[]','+ offerTypes : String[]','+ verified : Boolean'];

const attCReq = ['+ id : UUID','+ status : Enum (pending|accepted|rejected)','+ message : String','+ created_at : Date'];
const attNConn = ['+ id : UUID','+ status : Enum (pending|accepted|rejected)','+ initiator : Enum','+ message : String','+ created_at : Date'];

const attProg = ['+ id : Int','+ name : String','+ description : String','+ status : String','+ startDate : Date','+ endDate : Date','+ is_template : Boolean','+ specialization : String','+ type : String'];
const attPDay = ['+ id : UUID','+ dayName : String','+ dayOrder : Int','+ isRestDay : Boolean'];
const attPEx = ['+ id : UUID','+ sets : Int','+ reps : Int','+ restTimeSec : Float','+ exerciseOrder : Int'];
const attExercise = ['+ id : UUID','+ name : String','+ targetMuscle : String','+ videoUrl : String','+ category : String','+ difficulty : Enum'];

const attDietPlan = ['+ id : UUID','+ name : String','+ description : String','+ goal : Enum','+ startDate : Date','+ isTemplate : Boolean'];
const attDietDay = ['+ id : UUID','+ dayNumber : Int','+ totalCalories : Float'];
const attMeal = ['+ id : UUID','+ name : String','+ calories : Float','+ protein : Float','+ carbs : Float','+ fats : Float','+ timeOfDay : String'];

const attWLog = ['+ id : UUID','+ completedAt : Date','+ actualWeight : Float','+ actualReps : Int','+ notes : String'];
const attMLog = ['+ id : UUID','+ date : Date','+ mealName : String','+ calories : Float','+ proteins : Float','+ carbs : Float','+ fats : Float'];

const attMsg = ['+ id : UUID','+ content : String','+ sentAt : Date','+ isRead : Boolean'];
const attConv = ['+ id : UUID','+ createdAt : Date','+ lastMessageAt : Date'];
const attAILog = ['+ id : UUID','+ prompt : String','+ response : String','+ model : String','+ tokensUsed : Int','+ requestedAt : Date'];
const attStats = ['+ totalUsers : Int','+ totalCoaches : Int','+ totalAthletes : Int','+ activePrograms : Int','+ messagesCount : Int','+ generatedAt : Date'];

// =========================================================================
// 1. GLOBAL
// =========================================================================
function buildGlobalUC(){
  gid=100; let b='';
  b+=v('bnd','Système GOSPORT',BND,250,20,1150,900);
  b+=v('adm','Administrateur',ACT_ADM,60,100,50,80);
  b+=v('coa','Coach',ACT_C,60,350,50,80);
  b+=v('nut','Nutritionniste',ACT_N,60,650,50,80);
  b+=v('ath','Athlète',ACT_A,1480,450,50,80);

  const ucs=[
    ['u1',"S'authentifier",370,40],['u2','Gérer Profil',600,40],['u3','Notifications',850,40],['u4','Messagerie',1080,40],
    ['c1','Créer Programme',370,200],['c2','Assigner Programme',600,200],['c3','Gérer Demandes Coach',850,200],['c4','Suivre Progression Athlète',1080,200],
    ['n1','Créer DietPlan',370,500],['n2','Assigner DietPlan',600,500],['n3','Gérer Demandes Nutrition',850,500],['n4','Suivre Logs Repas',1080,500],
    ['a1','Jouer Séance',370,700],['a2','Enregistrer WorkoutLog',600,700],['a3','Enregistrer MealLog',850,700],['a4','Demander Coaching/Nutrition',1080,700],
    ['ad1','Dashboard Stats',600,820],['ad2','Gérer Utilisateurs',850,820],['ad3','Gérer Catalogue Ex.',1080,820]
  ];
  ucs.forEach(([i,l,x,y])=>b+=v(i,l,UCS,x,y,170,55));

  [['adm','u1'],['adm','ad1'],['adm','ad2'],['adm','ad3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['coa','u1'],['coa','u2'],['coa','u4'],['coa','c1'],['coa','c2'],['coa','c3'],['coa','c4']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['nut','u1'],['nut','u2'],['nut','u4'],['nut','n1'],['nut','n2'],['nut','n3'],['nut','n4']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['ath','u1'],['ath','u2'],['ath','u3'],['ath','u4'],['ath','a1'],['ath','a2'],['ath','a3'],['ath','a4']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  b+=ed('a1','a2','<<extend>>',INC);

  fs.writeFileSync('Global_Cas_Utilisation.drawio',wrap(b,'Global Use Case'));
}

function buildGlobalClass(){
  gid=200; let b='';
  b+=cls('User','User',attUser,500,20,240,'#f5f5f5','#666');
  
  b+=cls('CoachProfile','CoachProfile',attCoach,100,380,240,'#e1d5e7','#9673a6');
  b+=cls('Athlete','Athlete',attAthlete,500,380,240,'#dae8fc','#6c8ebf');
  b+=cls('NutritionistProfile','NutritionistProfile',attNut,900,380,240,'#d5e8d4','#82b366');
  
  b+=cls('CoachingRequest','CoachingRequest',attCReq,100,680,240,'#f5f5f5','#666');
  b+=cls('NutritionConnection','NutritionConnection',attNConn,900,680,240,'#f5f5f5','#666');
  b+=cls('Message','Message',attMsg,500,680,240,'#f5f5f5','#666');
  
  b+=cls('Program','Program',attProg,100,880,240,'#e1d5e7','#9673a6');
  b+=cls('DietPlan','DietPlan',attDietPlan,900,880,240,'#d5e8d4','#82b366');
  b+=cls('WorkoutLog','WorkoutLog',attWLog,400,880,210,'#dae8fc','#6c8ebf');
  b+=cls('MealLog','MealLog/DietLog',attMLog,640,880,210,'#dae8fc','#6c8ebf');
  
  b+=cls('ProgramDay','ProgramDay',attPDay,100,1150,240,'#e1d5e7','#9673a6');
  b+=cls('DietDay','DietDay',attDietDay,900,1150,240,'#d5e8d4','#82b366');
  
  b+=cls('ProgramExercise','ProgramExercise',attPEx,100,1350,240,'#e1d5e7','#9673a6');
  b+=cls('Meal','Meal',attMeal,900,1350,240,'#d5e8d4','#82b366');

  b+=ed('CoachProfile','User','',INH);b+=ed('Athlete','User','',INH);b+=ed('NutritionistProfile','User','',INH);
  b+=ed('Athlete','CoachingRequest','',ASC2);b+=ed('CoachProfile','CoachingRequest','',ASC2);
  b+=ed('Athlete','NutritionConnection','',ASC2);b+=ed('NutritionistProfile','NutritionConnection','',ASC2);
  
  b+=ed('Program','ProgramDay','',CMP);b+=ed('ProgramDay','ProgramExercise','',CMP);
  b+=ed('DietPlan','DietDay','',CMP);b+=ed('DietDay','Meal','',CMP);
  
  b+=ed('CoachProfile','Program','',ASC2);b+=ed('NutritionistProfile','DietPlan','',ASC2);
  b+=ed('Athlete','Program','',ASC2);b+=ed('Athlete','DietPlan','',ASC2);
  b+=ed('Athlete','WorkoutLog','',ASC2);b+=ed('Athlete','MealLog','',ASC2);
  b+=ed('User','Message','',ASC2);
  
  fs.writeFileSync('Global_Classes.drawio',wrap(b,'Global Classes', 1654, 1800));
}

// =========================================================================
// 2. SPRINT 1
// =========================================================================
function buildSprint1UC(){
  gid=300; let b='';
  b+=v('bnd','Sprint 1 — Authentification et Profils',BND,200,10,740,600);
  b+=v('a1','Utilisateur',ACT_U,50,260,50,80);
  b+=v('a_c','Coach',ACT_C,1020,100,50,80);
  b+=v('a_a','Athlète',ACT_A,1020,300,50,80);
  b+=v('a_n','Nutritionniste',ACT_N,1020,500,50,80);
  const ucs=[
    ['u1',"Créer un Compte",280,50],['u2',"S'authentifier",560,50],['u3',"Compléter Profil",280,180],
    ['u4',"Gérer Demandes Coach",560,180],['u5',"Envoyer Demande Coach",280,310],
    ['u6',"Envoyer Demande Nutrition",560,310],['u7',"Gérer Demandes Nut.",280,460]
  ];
  ucs.forEach(([i,l,x,y])=>b+=v(i,l,UCS,x,y,180,60));
  [['a1','u1'],['a1','u2'],['a1','u3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['a_c','u4']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['a_a','u5'],['a_a','u6']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['a_n','u7']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  fs.writeFileSync('Sprint1_Cas_Utilisation.drawio',wrap(b,'Sprint 1 UC'));
}

function buildSprint1Class(){
  gid=400; let b='';
  b+=cls('User','User',attUser,420,20,240,'#f5f5f5','#666');
  b+=cls('CoachProfile','CoachProfile',attCoach,100,380,240,'#e1d5e7','#9673a6');
  b+=cls('Athlete','Athlete',attAthlete,420,380,240,'#dae8fc','#6c8ebf');
  b+=cls('NutritionistProfile','NutritionistProfile',attNut,760,380,240,'#d5e8d4','#82b366');
  
  b+=cls('CoachingRequest','CoachingRequest',attCReq,100,680,240,'#f5f5f5','#666');
  b+=cls('NutritionConnection','NutritionConnection',attNConn,760,680,240,'#f5f5f5','#666');
  
  b+=ed('CoachProfile','User','',INH);b+=ed('Athlete','User','',INH);b+=ed('NutritionistProfile','User','',INH);
  b+=ed('Athlete','CoachingRequest','',ASC2);b+=ed('CoachProfile','CoachingRequest','',ASC2);
  b+=ed('Athlete','NutritionConnection','',ASC2);b+=ed('NutritionistProfile','NutritionConnection','',ASC2);
  fs.writeFileSync('Sprint1_Classes.drawio',wrap(b,'Sprint 1 Classes', 1654, 1200));
}

// =========================================================================
// 3. SPRINT 2
// =========================================================================
function buildSprint2UC(){
  gid=500; let b='';
  b+=v('bnd','Sprint 2 — Entraînement et Nutrition',BND,200,10,740,750);
  b+=v('c','Coach',ACT_C,50,150,50,80);
  b+=v('n','Nutritionniste',ACT_N,50,550,50,80);
  b+=v('a','Athlète',ACT_A,1020,350,50,80);
  const ucs=[
    ['c1',"Créer Programme",280,50],['c2',"Ajouter Exercices",560,50],['c3',"Assigner Programme",280,180],
    ['a1',"Jouer Séance",560,250],['a2',"Enregistrer WorkoutLog",280,350],['a3',"Enregistrer MealLog",560,420],
    ['n1',"Créer DietPlan",280,520],['n2',"Ajouter Meals",560,520],['n3',"Assigner DietPlan",280,650]
  ];
  ucs.forEach(([i,l,x,y])=>b+=v(i,l,UCS,x,y,180,60));
  [['c','c1'],['c','c3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['n','n1'],['n','n3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['a','a1'],['a','a2'],['a','a3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  b+=ed('c1','c2','<<include>>',INC);
  b+=ed('n1','n2','<<include>>',INC);
  fs.writeFileSync('Sprint2_Cas_Utilisation.drawio',wrap(b,'Sprint 2 UC'));
}

function buildSprint2Class(){
  gid=600; let b='';
  b+=cls('Program','Program',attProg,100,20,240,'#e1d5e7','#9673a6');
  b+=cls('ProgramDay','ProgramDay',attPDay,100,320,240,'#e1d5e7','#9673a6');
  b+=cls('ProgramExercise','ProgramExercise',attPEx,100,520,240,'#e1d5e7','#9673a6');
  b+=cls('Exercise','Exercise (Catalogue)',attExercise,100,720,240,'#f8cecc','#b85450');
  
  b+=cls('DietPlan','DietPlan',attDietPlan,740,20,240,'#d5e8d4','#82b366');
  b+=cls('DietDay','DietDay',attDietDay,740,320,240,'#d5e8d4','#82b366');
  b+=cls('Meal','Meal',attMeal,740,520,240,'#d5e8d4','#82b366');

  b+=cls('WorkoutLog','WorkoutLog',attWLog,420,320,240,'#dae8fc','#6c8ebf');
  b+=cls('MealLog','MealLog',attMLog,420,520,240,'#dae8fc','#6c8ebf');

  b+=ed('Program','ProgramDay','',CMP);b+=ed('ProgramDay','ProgramExercise','',CMP);
  b+=ed('ProgramExercise','Exercise','',ASC2);
  b+=ed('ProgramExercise','WorkoutLog','',ASC2);
  b+=ed('DietPlan','DietDay','',CMP);b+=ed('DietDay','Meal','',CMP);
  b+=ed('Meal','MealLog','',ASC2);
  fs.writeFileSync('Sprint2_Classes.drawio',wrap(b,'Sprint 2 Classes', 1654, 1200));
}

// =========================================================================
// 4. SPRINT 3
// =========================================================================
function buildSprint3UC(){
  gid=700; let b='';
  b+=v('bnd','Sprint 3 — Messagerie, IA et Dashboard',BND,200,10,740,650);
  b+=v('adm','Admin',ACT_ADM,50,100,50,80);
  b+=v('u','Utilisateur\n(Coach, Athlète, Nut.)',ACT_U,1020,350,60,80);
  const ucs=[
    ['ad1',"Dashboard Global",280,50],['ad2',"Gérer Exercices",560,50],['ad3',"Gérer Utilisateurs",280,180],
    ['u1',"Envoyer Message",560,250],['u2',"Recevoir Notification",280,350],['u3',"Générer Conseil IA",560,450],['u4',"Exporter Rapports",280,550]
  ];
  ucs.forEach(([i,l,x,y])=>b+=v(i,l,UCS,x,y,180,60));
  [['adm','ad1'],['adm','ad2'],['adm','ad3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  [['u','u1'],['u','u2'],['u','u3'],['u','u4']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
  fs.writeFileSync('Sprint3_Cas_Utilisation.drawio',wrap(b,'Sprint 3 UC'));
}

function buildSprint3Class(){
  gid=800; let b='';
  b+=cls('User','User (ref)',attUser,420,20,240,'#f5f5f5','#666');
  b+=cls('Message','Message',attMsg,100,380,240,'#f5f5f5','#666');
  b+=cls('Conversation','Conversation',attConv,420,380,240,'#f5f5f5','#666');
  b+=cls('AILog','AILog',attAILog,740,380,240,'#dae8fc','#6c8ebf');
  b+=cls('DashboardStats','DashboardStats',attStats,100,600,240,'#f8cecc','#b85450');

  b+=ed('User','Message','',ASC2);b+=ed('User','Conversation','',ASC2);b+=ed('Conversation','Message','',CMP);
  b+=ed('User','AILog','',ASC2);
  fs.writeFileSync('Sprint3_Classes.drawio',wrap(b,'Sprint 3 Classes', 1654, 1000));
}

// Generate all
buildGlobalUC();
buildGlobalClass();
buildSprint1UC();
buildSprint1Class();
buildSprint2UC();
buildSprint2Class();
buildSprint3UC();
buildSprint3Class();
console.log("ALL 8 MAIN DIAGRAMS GENERATED PERFECTLY WITH FULL ATTRIBUTES.");
