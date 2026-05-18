const fs=require('fs');
let gid=600;
const uid=()=>`n${gid++}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function wrap(body,title){return `<mxfile version="21.6.8"><diagram id="d1" name="${esc(title)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" page="1" pageWidth="1654" pageHeight="1169"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${body}</root></mxGraphModel></diagram></mxfile>`;}
function v(id,val,style,x,y,w,h,par='1'){return `<mxCell id="${id}" value="${esc(val)}" style="${style}" vertex="1" parent="${par}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;}
function ed(src,tgt,label='',style='endArrow=open;endFill=0;html=1;strokeColor=#666;'){return `<mxCell id="${uid()}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;}
function arrow(val,y,x1,x2,ret=false){const s=ret?'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=9;':'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=9;';return `<mxCell id="${uid()}" value="${esc(val)}" style="${s}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y}" as="sourcePoint"/><mxPoint x="${x2}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>\n`;}
function cls(id,name,attrs,x,y,w=190){const LH=20,H=28+attrs.length*LH+4;const HDR='swimlane;startSize=28;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=10;';const ATR='text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=9;';let b=v(id,name,HDR,x,y,w,H);attrs.forEach((a,i)=>{b+=v(uid(),a,ATR,0,28+i*LH,w,LH,id);});return b;}
const ACT='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;';
const ACT_C='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;';
const UCS='ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BND='rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;verticalAlign=top;fontSize=11;fontStyle=1;';
const OBJ='rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=10;';
const LFL='line;html=1;dashed=1;strokeColor=#999;endArrow=none;';
const INH='endArrow=block;endFill=0;endSize=10;html=1;strokeColor=#23445D;strokeWidth=2;';
const CMP='endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASC='endArrow=open;endFill=0;html=1;strokeColor=#666;';
const INC='endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#666;';

// SPRINT 2 USE CASE
(function(){gid=600;let b='';
b+=v('bnd','Sprint 2 — Programmes d\'Entraînement et Nutrition',BND,200,10,850,700);
b+=v('a1','Coach',ACT_C,50,280,50,80);
b+=v('a_nut','Nutritionniste',ACT_C,50,550,50,80);
b+=v('a2','Athlète',ACT,1100,400,50,80);
const ucs=[
['u1',"Créer Programme d'Entraînement",280,50],
['u2','Ajouter Jours et Exercices\n(Séries, Reps, Repos)',570,50],
['u3','Assigner Programme\nà un Athlète',280,180],
['u4','Créer Plan Nutritionnel\n(DietPlan)',280,480],
['u5','Consulter Progression\nde l\'Athlète (Entraînement)',280,310],
['u6','Accepter Programme\nAssigné',820,310],
['u7','Jouer Séance\n(Workout Player)',570,310],
['u8','Enregistrer Poids\nSoulevé (WorkoutLog)',820,440],
['u9','Consigner ses Repas\n(MealLog/DietLog)',820,580],
['u10','Consulter Progression\nNutritionnelle',570,580],
['u11','Assigner Régime\nà un Athlète',280,620],
];
ucs.forEach(([id,lbl,x,y])=>b+=v(id,lbl,UCS,x,y,200,60));
[['a1','u1'],['a1','u3'],['a1','u5']].forEach(([s,t])=>b+=ed(s,t,'','endArrow=none;html=1;strokeColor=#444;'));
[['a_nut','u4'],['a_nut','u10'],['a_nut','u11']].forEach(([s,t])=>b+=ed(s,t,'','endArrow=none;html=1;strokeColor=#444;'));
[['a2','u6'],['a2','u7'],['a2','u8'],['a2','u9']].forEach(([s,t])=>b+=ed(s,t,'','endArrow=none;html=1;strokeColor=#444;'));
b+=ed('u1','u2','<<include>>',INC);
b+=ed('u7','u8','<<extend>>',INC);
fs.writeFileSync('Sprint2_Cas_Utilisation.drawio',wrap(b,'Sprint2 UC'));
console.log('OK Sprint2_Cas_Utilisation.drawio');})();

// SPRINT 2 CLASS
(function(){gid=700;let b='';
b+=cls('Program','Program',['+ id : Int','+ name : String','+ description : String','+ startDate : Date','+ endDate : Date','+ status : String'],280,20);
b+=cls('ProgramDay','ProgramDay',['+ id : UUID','+ dayName : String','+ dayOrder : Int','+ isRestDay : Boolean'],60,260);
b+=cls('ProgramExercise','ProgramExercise',['+ id : UUID','+ sets : Int','+ reps : Int','+ restTimeSec : Float','+ exerciseOrder : Int'],280,260);
b+=cls('Exercise','Exercise',['+ id : UUID','+ name : String','+ targetMuscle : String','+ videoUrl : String','+ category : String'],560,260);
b+=cls('WorkoutLog','WorkoutLog',['+ id : UUID','+ completedAt : Date','+ actualWeight : Float','+ actualReps : Int','+ notes : String'],280,500);

b+=cls('DietPlan','DietPlan',['+ id : UUID','+ name : String','+ description : String','+ goal : Enum','+ startDate : Date','+ isTemplate : Boolean'],840,20);
b+=cls('DietDay','DietDay',['+ id : UUID','+ dayNumber : Int','+ totalCalories : Float'],840,260);
b+=cls('Meal','Meal',['+ id : UUID','+ name : String','+ calories : Float','+ protein : Float','+ carbs : Float','+ fats : Float'],1120,260);
b+=cls('DietLog','DietLog (MealLog)',['+ id : UUID','+ date : Date','+ calories : Float','+ proteins : Float','+ carbs : Float','+ fats : Float'],840,500);

b+=ed('Program','ProgramDay','contient 1..*',CMP);
b+=ed('ProgramDay','ProgramExercise','inclut 1..*',CMP);
b+=ed('Exercise','ProgramExercise','référence',ASC);
b+=ed('ProgramExercise','WorkoutLog','génère 0..*',ASC);

b+=ed('DietPlan','DietDay','contient 1..*',CMP);
b+=ed('DietDay','Meal','comprend 1..*',CMP);
b+=ed('DietPlan','DietLog','enregistre 0..*',ASC);

fs.writeFileSync('Sprint2_Classes.drawio',wrap(b,'Sprint2 Classes'));
console.log('OK Sprint2_Classes.drawio');})();

// SPRINT 2 SEQUENCE: Créer et Assigner Programme
(function(){gid=800;let b='';
const Y0=20,OH=36,OW=140;
const MX=[20,190,380,570,780];
const labs=['Coach','Angular\n(Frontend)','Node.js\n(Backend)','PostgreSQL','Athlète\n(Mobile)'];
labs.forEach((l,i)=>{b+=v(`o${i}`,l,OBJ,MX[i],Y0,OW,OH);b+=v(`l${i}`,'',LFL,MX[i]+OW/2,Y0+OH,2,660);});
const base=Y0+OH;
b+=arrow("1. Cliquer 'Créer Programme'",base+30,MX[0]+OW/2,MX[1]+OW/2);
b+=arrow("2. Afficher formulaire de création",base+70,MX[1]+OW/2,MX[0]+OW/2,true);
b+=arrow("3. Saisir Titre, Dates, Athlète cible",base+110,MX[0]+OW/2,MX[1]+OW/2);
b+=arrow("4. Ajouter Jours + Exercices (sets, reps, repos)",base+150,MX[0]+OW/2,MX[1]+OW/2);
b+=arrow("5. POST /api/programs {name, athleteId, days, exercises}",base+190,MX[1]+OW/2,MX[2]+OW/2);
b+=arrow("6. Valider et créer (INSERT INTO programs)",base+230,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("7. INSERT INTO program_days (xN jours)",base+270,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("8. INSERT INTO program_exercises (xM exercices)",base+310,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("9. Retourner les IDs créés",base+350,MX[3]+OW/2,MX[2]+OW/2,true);
b+=arrow("10. 201 Created {programId}",base+390,MX[2]+OW/2,MX[1]+OW/2,true);
b+=arrow("11. Afficher confirmation 'Programme créé'",base+430,MX[1]+OW/2,MX[0]+OW/2,true);
b+=arrow("12. Notification Push: Nouveau Programme disponible",base+490,MX[2]+OW/2,MX[4]+OW/2);
b+=arrow("13. Accusé de réception",base+530,MX[4]+OW/2,MX[2]+OW/2,true);
fs.writeFileSync('Sprint2_Sequence_Programme.drawio',wrap(b,'Sprint2 Seq Programme'));
console.log('OK Sprint2_Sequence_Programme.drawio');})();

console.log('--- Sprint 2 done ---');
