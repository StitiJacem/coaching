const fs=require('fs');
let gid=10;
const uid=()=>`n${gid++}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function wrap(body,title){return `<mxfile version="21.6.8"><diagram id="d1" name="${esc(title)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" page="1" pageWidth="1654" pageHeight="1169"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${body}</root></mxGraphModel></diagram></mxfile>`;}
function v(id,val,style,x,y,w,h,par='1'){return `<mxCell id="${id}" value="${esc(val)}" style="${style}" vertex="1" parent="${par}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;}
function ed(src,tgt,label,style){return `<mxCell id="${uid()}" value="${esc(label||'')}" style="${style||'endArrow=open;endFill=0;html=1;strokeColor=#555;'}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;}
function cls(id,name,attrs,x,y,w=190){const LH=20,H=28+attrs.length*LH+4;const HDR='swimlane;startSize=28;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=10;';const ATR='text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=9;';let b=v(id,name,HDR,x,y,w,H);attrs.forEach((a,i)=>{b+=v(uid(),a,ATR,0,28+i*LH,w,LH,id);});return b;}

const ACT='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
const ACT_N='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;';
const ACT_C='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;';
const ACT_ADM='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#f8cecc;strokeColor=#b85450;';
const UCS='ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BND='rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;verticalAlign=top;fontSize=12;fontStyle=1;';
const INC='endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#666;';
const ASC='endArrow=none;html=1;strokeColor=#444;';

// =====================================================
// GLOBAL USE CASE (avec Nutritionniste)
// =====================================================
(function(){
gid=10;let b='';
b+=v('bnd','Système CoachingApp',BND,250,20,1150,1000);

// ACTORS
b+=v('adm','Administrateur',ACT_ADM,60,100,50,80);
b+=v('coa','Coach',ACT_C,60,400,50,80);
b+=v('nut','Nutritionniste',ACT_N,60,700,50,80);
b+=v('ath','Athlète',ACT,1480,500,50,80);

// -- USE CASES: Auth (partagés)
b+=v('u_auth',"S'authentifier",UCS,370,40,170,55);
b+=v('u_profile','Compléter/Modifier\nson Profil',UCS,600,40,170,55);
b+=v('u_notif','Recevoir\nNotifications',UCS,850,40,170,55);
b+=v('u_msg','Messagerie\nen Temps Réel',UCS,1080,40,170,55);

// -- USE CASES: Coach
b+=v('u_c1','Créer Programme\nd\'Entraînement',UCS,370,160,170,55);
b+=v('u_c2','Assigner Programme\nà un Athlète',UCS,600,160,170,55);
b+=v('u_c3','Gérer Demandes\nde Coaching',UCS,850,160,170,55);
b+=v('u_c4','Consulter Progrès\nde ses Athlètes',UCS,1080,160,170,55);
b+=v('u_c5','Configurer les\nExercices du Programme',UCS,370,270,170,55);
b+=v('u_c6','Fixer Objectifs\nNutritionnels (Macros)',UCS,600,270,170,55);

// -- USE CASES: Nutritionniste
b+=v('u_n1','Créer Plan\nNutritionnel (DietPlan)',UCS,370,420,170,55);
b+=v('u_n2','Assigner Régime\nà un Athlète',UCS,600,420,170,55);
b+=v('u_n3','Gérer Demandes\nde Nutrition',UCS,850,420,170,55);
b+=v('u_n4','Créer et Gérer\nles Repas (Meals)',UCS,1080,420,170,55);
b+=v('u_n5','Consulter Profil\nNutritionnel Athlète',UCS,370,520,170,55);
b+=v('u_n6','Suivre Log Nutritionnel\nde ses Athlètes',UCS,600,520,170,55);

// -- USE CASES: Athlète
b+=v('u_a1','Jouer Séance\n(Workout Player)',UCS,370,680,170,55);
b+=v('u_a2','Enregistrer\nExercice Log',UCS,600,680,170,55);
b+=v('u_a3','Consulter son\nProgramme',UCS,850,680,170,55);
b+=v('u_a4','Logger ses\nRepas (DietLog)',UCS,1080,680,170,55);
b+=v('u_a5','Envoyer Demande\nde Coaching',UCS,370,790,170,55);
b+=v('u_a6','Envoyer Demande\nde Nutrition',UCS,600,790,170,55);
b+=v('u_a7','Consulter ses\nMétriques Corporelles',UCS,850,790,170,55);
b+=v('u_a8','Générer Conseils\nIA (Gemini)',UCS,1080,790,170,55);

// -- USE CASES: Admin
b+=v('u_ad1','Dashboard Global\n(Statistiques)',UCS,600,930,170,55);
b+=v('u_ad2','Gérer Comptes\nUtilisateurs',UCS,850,930,170,55);
b+=v('u_ad3','Gérer Catalogue\nExercices',UCS,1080,930,170,55);

// ACTOR -> USE CASE edges
// Admin
[['adm','u_auth'],['adm','u_ad1'],['adm','u_ad2'],['adm','u_ad3']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
// Coach
[['coa','u_auth'],['coa','u_profile'],['coa','u_msg'],['coa','u_c1'],['coa','u_c2'],['coa','u_c3'],['coa','u_c4'],['coa','u_c5'],['coa','u_c6']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
// Nutritionniste
[['nut','u_auth'],['nut','u_profile'],['nut','u_msg'],['nut','u_n1'],['nut','u_n2'],['nut','u_n3'],['nut','u_n4'],['nut','u_n5'],['nut','u_n6']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
// Athlète
[['ath','u_auth'],['ath','u_profile'],['ath','u_msg'],['ath','u_notif'],['ath','u_a1'],['ath','u_a2'],['ath','u_a3'],['ath','u_a4'],['ath','u_a5'],['ath','u_a6'],['ath','u_a7'],['ath','u_a8']].forEach(([s,t])=>b+=ed(s,t,'',ASC));
// include/extend
b+=ed('u_c1','u_c5','<<include>>',INC);
b+=ed('u_a1','u_a2','<<extend>>',INC);
b+=ed('u_n1','u_n4','<<include>>',INC);

fs.writeFileSync('Global_Cas_Utilisation.drawio',wrap(b,'Global Use Case - CoachingApp'));
console.log('OK Global_Cas_Utilisation.drawio');
})();

// =====================================================
// GLOBAL CLASS DIAGRAM (avec Nutritionniste)
// =====================================================
(function(){
gid=200;let b='';
const INH='endArrow=block;endFill=0;endSize=10;html=1;strokeColor=#23445D;strokeWidth=2;';
const CMP='endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASC2='endArrow=open;endFill=0;html=1;strokeColor=#666;';

b+=cls('User','User',['+ id : Int','+ email : String','+ password : String (hash)','+ first_name : String','+ last_name : String','+ role : Enum (coach|athlete|nutritionist|admin)','+ photo_url : String','+ phone : String','+ fcmToken : String','+ is_verified : Boolean','+ oauth_provider : String'],500,20,210);

b+=cls('CoachProfile','CoachProfile',['+ id : UUID','+ bio : String','+ experience_years : Int','+ rating : Decimal','+ total_clients : Int','+ monthlyPrice : Decimal','+ stripeAccountId : String','+ verified : Boolean'],60,260,200);

b+=cls('Athlete','Athlete',['+ id : Int','+ height : Decimal','+ weight : Decimal','+ age : Int','+ sport : String','+ goals : String','+ experienceLevel : String','+ fitnessLevel : String','+ injuries : String','+ weightGoal : Decimal'],500,260,200);

b+=cls('NutritionistProfile','NutritionistProfile',['+ id : UUID','+ bio : String','+ experience_years : Int','+ rating : Decimal','+ total_clients : Int','+ specializations : String[]','+ offerTypes : String[]','+ verified : Boolean'],900,260,210);

b+=cls('CoachingRequest','CoachingRequest',['+ id : UUID','+ status : Enum (pending|accepted|rejected)','+ message : String'],60,530,200);

b+=cls('NutritionConnection','NutritionConnection',['+ id : UUID','+ status : Enum (pending|accepted|rejected)','+ initiator : Enum (athlete|nutritionist)','+ message : String'],900,530,210);

b+=cls('Program','Program',['+ id : Int','+ name : String','+ description : String','+ status : String','+ startDate : Date','+ endDate : Date','+ is_template : Boolean','+ specialization : String'],60,760,200);

b+=cls('ProgramDay','ProgramDay',['+ id : UUID','+ dayName : String','+ dayOrder : Int'],60,1000,200);

b+=cls('ProgramExercise','ProgramExercise',['+ id : UUID','+ sets : Int','+ reps : Int','+ restTimeSec : Float'],280,1000,200);

b+=cls('Exercise','Exercise',['+ id : UUID','+ name : String','+ targetMuscle : String','+ videoUrl : String','+ category : String'],500,1000,200);

b+=cls('DietPlan','DietPlan',['+ id : UUID','+ name : String','+ description : String','+ goal : Enum (bulking|cutting|maintenance...)','+ isTemplate : Boolean','+ startDate : Date'],900,760,210);

b+=cls('DietDay','DietDay',['+ id : UUID','+ dayNumber : Int','+ totalCalories : Float'],900,1000,200);

b+=cls('Meal','Meal',['+ id : UUID','+ name : String','+ calories : Float','+ protein : Float','+ carbs : Float','+ fats : Float'],1140,1000,190);

b+=cls('WorkoutLog','WorkoutLog',['+ id : UUID','+ completedAt : Date','+ actualWeight : Float','+ actualReps : Int','+ notes : String'],500,760,200);

b+=cls('Message','Message',['+ id : UUID','+ content : String','+ sentAt : Date','+ isRead : Boolean'],280,760,190);

// Inheritance
b+=ed('CoachProfile','User','',INH);b+=ed('Athlete','User','',INH);b+=ed('NutritionistProfile','User','',INH);
// Associations
b+=ed('Athlete','CoachingRequest','envoie 0..*',ASC2);b+=ed('CoachProfile','CoachingRequest','reçoit 0..*',ASC2);
b+=ed('Athlete','NutritionConnection','sollicite 0..*',ASC2);b+=ed('NutritionistProfile','NutritionConnection','gère 0..*',ASC2);
b+=ed('CoachProfile','Program','crée 0..*',ASC2);b+=ed('Athlete','Program','reçoit 0..*',ASC2);
b+=ed('Program','ProgramDay','contient 1..*',CMP);b+=ed('ProgramDay','ProgramExercise','inclut 1..*',CMP);
b+=ed('Exercise','ProgramExercise','référence',ASC2);
b+=ed('NutritionistProfile','DietPlan','crée 0..*',ASC2);b+=ed('Athlete','DietPlan','reçoit 0..*',ASC2);
b+=ed('DietPlan','DietDay','contient 1..*',CMP);b+=ed('DietDay','Meal','comprend 1..*',CMP);
b+=ed('Athlete','WorkoutLog','enregistre 0..*',ASC2);
b+=ed('User','Message','envoie/reçoit',ASC2);

fs.writeFileSync('Global_Classes.drawio',wrap(b,'Global Classes - CoachingApp'));
console.log('OK Global_Classes.drawio');
})();

console.log('--- Global diagrams (with Nutritionist) done ---');
