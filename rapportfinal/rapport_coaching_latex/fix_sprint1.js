const fs=require('fs');
let gid=300;
const uid=()=>`n${gid++}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function wrap(body,title){return `<mxfile version="21.6.8"><diagram id="d1" name="${esc(title)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" page="1" pageWidth="1169" pageHeight="827"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${body}</root></mxGraphModel></diagram></mxfile>`;}
function v(id,val,style,x,y,w,h,par='1'){return `<mxCell id="${id}" value="${esc(val)}" style="${style}" vertex="1" parent="${par}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;}
function ed(src,tgt,label='',style='endArrow=open;endFill=0;html=1;strokeColor=#666;'){return `<mxCell id="${uid()}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;}
function arrow(val,y,x1,x2,ret=false){const s=ret?'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=9;':'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=9;';return `<mxCell id="${uid()}" value="${esc(val)}" style="${s}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y}" as="sourcePoint"/><mxPoint x="${x2}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>\n`;}
function cls(id,name,attrs,x,y,w=190){const LH=20,H=28+attrs.length*LH+4;const HDR='swimlane;startSize=28;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=10;';const ATR='text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=9;';let b=v(id,name,HDR,x,y,w,H);attrs.forEach((a,i)=>{b+=v(uid(),a,ATR,0,28+i*LH,w,LH,id);});return b;}
const ACT='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#d5e8d4;strokeColor=#82b366;';
const UCS='ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BND='rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;verticalAlign=top;fontSize=11;fontStyle=1;';
const OBJ='rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=10;';
const LFL='line;html=1;dashed=1;strokeColor=#999;endArrow=none;';
const INH='endArrow=block;endFill=0;endSize=10;html=1;strokeColor=#23445D;strokeWidth=2;';
const CMP='endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASC='endArrow=open;endFill=0;html=1;strokeColor=#666;';
const INC='endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#666;';

// SPRINT 1 USE CASE
(function(){gid=300;let b='';
b+=v('bnd','Sprint 1 — Accès et Gestion des Profils',BND,200,10,720,660);
b+=v('a1','Utilisateur',ACT,50,290,50,80);
b+=v('a2','Coach',ACT,1010,200,50,80);
b+=v('a3','Athlète',ACT,1010,430,50,80);
const ucs=[['u1',"Créer un Compte",280,40],['u2',"S'authentifier",530,40],['u3','Réinitialiser MDP\n(OTP Email)',780,40],['u4','Compléter\nson Profil',280,200],['u5','Modifier\nson Profil',530,200],['u6','Chercher un Coach',280,380],['u7','Envoyer Demande\nde Coaching',530,380],['u8','Accepter/Refuser\nune Demande',280,540],['u9','Consulter\nses Athlètes',530,540]];
ucs.forEach(([id,lbl,x,y])=>b+=v(id,lbl,UCS,x,y,180,60));
[['a1','u1'],['a1','u2'],['a1','u3'],['a1','u4'],['a1','u5']].forEach(([s,t])=>b+=ed(s,t));
[['a2','u2'],['a2','u8'],['a2','u9']].forEach(([s,t])=>b+=ed(s,t));
[['a3','u2'],['a3','u6'],['a3','u7']].forEach(([s,t])=>b+=ed(s,t));
b+=ed('u2','u3','<<extend>>',INC);b+=ed('u7','u6','<<include>>',INC);
fs.writeFileSync('Sprint1_Cas_Utilisation.drawio',wrap(b,'Sprint1 UC'));
console.log('OK Sprint1_Cas_Utilisation.drawio');})();

// SPRINT 1 CLASS
(function(){gid=400;let b='';
b+=cls('User','User',['+ id : UUID','+ email : String','+ passwordHash : String','+ firstName : String','+ lastName : String','+ role : Enum (COACH | ATHLETE)','+ avatarUrl : String','+ isProfileComplete : Boolean','+ createdAt : Date'],420,20);
b+=cls('CoachProfile','CoachProfile',['+ id : UUID','+ specialty : String','+ bio : String','+ certifications : String','+ experience : Int'],100,270);
b+=cls('AthleteProfile','AthleteProfile',['+ id : UUID','+ weight : Float','+ height : Float','+ age : Int','+ fitnessGoal : String','+ activityLevel : String'],700,270);
b+=cls('CoachingRequest','CoachingRequest',['+ id : UUID','+ status : Enum (PENDING|ACCEPTED|REJECTED)','+ message : String','+ createdAt : Date'],100,510);
b+=ed('CoachProfile','User','',INH);b+=ed('AthleteProfile','User','',INH);
b+=ed('AthleteProfile','CoachingRequest','envoie 0..*',ASC);b+=ed('CoachProfile','CoachingRequest','reçoit 0..*',ASC);
fs.writeFileSync('Sprint1_Classes.drawio',wrap(b,'Sprint1 Classes'));
console.log('OK Sprint1_Classes.drawio');})();

// SPRINT 1 SEQUENCE AUTH
(function(){gid=500;let b='';
const Y0=20,OH=36,OW=140;
const MX=[40,220,430,660];
const labs=['Utilisateur','Flutter\n(Mobile App)','Node.js\n(Backend)','PostgreSQL'];
labs.forEach((l,i)=>{b+=v(`o${i}`,l,OBJ,MX[i],Y0,OW,OH);b+=v(`l${i}`,'',LFL,MX[i]+OW/2,Y0+OH,2,600);});
const base=Y0+OH;
b+=arrow("1. Saisir Email + Mot de passe",base+40,MX[0]+OW/2,MX[1]+OW/2);
b+=arrow("2. POST /api/auth/login {email,password}",base+90,MX[1]+OW/2,MX[2]+OW/2);
b+=arrow("3. SELECT user WHERE email=?",base+140,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("4. Retourner données utilisateur",base+190,MX[3]+OW/2,MX[2]+OW/2,true);
b+=v('alt1','[MDP invalide ou utilisateur inconnu]','swimlane;startSize=20;fillColor=#f8cecc;strokeColor=#b85450;fontSize=9;',MX[1],base+220,MX[2]-MX[1]+OW+10,70);
b+=arrow("5a. Retourner 401 Unauthorized",base+245,MX[2]+OW/2,MX[1]+OW/2,true);
b+=arrow("5b. Afficher message d'erreur",base+275,MX[1]+OW/2,MX[0]+OW/2,true);
b+=v('alt2','[Authentification réussie]','swimlane;startSize=20;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=9;',MX[1],base+310,MX[2]-MX[1]+OW+10,130);
b+=arrow("6. Vérifier hash (Bcrypt)",base+340,MX[2]+OW/2,MX[2]+OW+30);
b+=arrow("7. Générer JWT Token",base+370,MX[2]+OW/2,MX[2]+OW+30);
b+=arrow("8. 200 OK + {token, user}",base+400,MX[2]+OW/2,MX[1]+OW/2,true);
b+=arrow("9. Redirection vers Dashboard",base+430,MX[1]+OW/2,MX[0]+OW/2,true);
fs.writeFileSync('Sprint1_Sequence_Auth.drawio',wrap(b,'Sprint1 Seq Auth'));
console.log('OK Sprint1_Sequence_Auth.drawio');})();

console.log('--- Sprint 1 done ---');
