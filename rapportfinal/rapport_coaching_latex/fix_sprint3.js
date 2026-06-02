const fs=require('fs');
let gid=900;
const uid=()=>`n${gid++}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function wrap(body,title){return `<mxfile version="21.6.8"><diagram id="d1" name="${esc(title)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" page="1" pageWidth="1169" pageHeight="827"><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${body}</root></mxGraphModel></diagram></mxfile>`;}
function v(id,val,style,x,y,w,h,par='1'){return `<mxCell id="${id}" value="${esc(val)}" style="${style}" vertex="1" parent="${par}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;}
function ed(src,tgt,label='',style='endArrow=open;endFill=0;html=1;strokeColor=#666;'){return `<mxCell id="${uid()}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;}
function arrow(val,y,x1,x2,ret=false){const s=ret?'endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#555;fontSize=9;':'endArrow=block;endFill=1;html=1;strokeColor=#23445D;fontSize=9;';return `<mxCell id="${uid()}" value="${esc(val)}" style="${s}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y}" as="sourcePoint"/><mxPoint x="${x2}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>\n`;}
function cls(id,name,attrs,x,y,w=190){const LH=20,H=28+attrs.length*LH+4;const HDR='swimlane;startSize=28;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=10;';const ATR='text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=6;overflow=hidden;rotatable=0;fontSize=9;';let b=v(id,name,HDR,x,y,w,H);attrs.forEach((a,i)=>{b+=v(uid(),a,ATR,0,28+i*LH,w,LH,id);});return b;}
const ACT='shape=mxgraph.uml.actor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;';
const UCS='ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;';
const BND='rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#23445D;strokeWidth=2;verticalAlign=top;fontSize=11;fontStyle=1;';
const OBJ='rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=10;';
const LFL='line;html=1;dashed=1;strokeColor=#999;endArrow=none;';
const CMP='endArrow=ERmanyToOne;startArrow=ERmandOne;html=1;strokeColor=#23445D;';
const ASC='endArrow=open;endFill=0;html=1;strokeColor=#666;';
const INC='endArrow=open;endFill=0;dashed=1;html=1;strokeColor=#666;';

// SPRINT 3 USE CASE
(function(){gid=900;let b='';
b+=v('bnd','Sprint 3 — Messagerie, Administration et Intelligence Artificielle',BND,200,10,750,680);
b+=v('a1','Administrateur',ACT,50,100,50,80);
b+=v('a2','Coach',ACT,50,400,50,80);
b+=v('a3','Athlète',ACT,1020,400,50,80);
const ucs=[
['u1','Visualiser Dashboard\nGlobal (Statistiques)',280,50],
['u2','Gérer Catalogue\ndes Exercices',550,50],
['u3','Gérer les Comptes\nUtilisateurs',780,50],
['u4','Envoyer un Message\n(Chat en Temps Réel)',280,220],
['u5','Recevoir et Lire\nun Message',550,220],
['u6','Consulter Historique\nde Conversation',780,220],
['u7','Consulter Progrès\nde ses Athlètes',280,400],
['u8','Générer Conseil\navec IA (Gemini)',550,400],
['u9','Générer Programme\nIA automatique',780,400],
['u10','Exporter Rapport\nde Progression',280,570],
['u11','Recevoir Notification\nPush',550,570],
];
ucs.forEach(([id,lbl,x,y])=>b+=v(id,lbl,UCS,x,y,200,60));
[['a1','u1'],['a1','u2'],['a1','u3']].forEach(([s,t])=>b+=ed(s,t));
[['a2','u4'],['a2','u6'],['a2','u7'],['a2','u8'],['a2','u9'],['a2','u10']].forEach(([s,t])=>b+=ed(s,t));
[['a3','u4'],['a3','u5'],['a3','u6'],['a3','u8'],['a3','u11']].forEach(([s,t])=>b+=ed(s,t));
b+=ed('u4','u5','<<include>>',INC);
b+=ed('u8','u9','<<extend>>',INC);
b+=ed('u4','u11','<<extend>>',INC);
fs.writeFileSync('Sprint3_Cas_Utilisation.drawio',wrap(b,'Sprint3 UC'));
console.log('OK Sprint3_Cas_Utilisation.drawio');})();

// SPRINT 3 CLASS
(function(){gid=1000;let b='';
b+=cls('User','User (ref)',['+ id : UUID','+ firstName : String','+ lastName : String','+ role : Enum'],440,20,170);
b+=cls('Message','Message',['+ id : UUID','+ content : String','+ sentAt : Date','+ isRead : Boolean','+ mediaUrl : String (opt.)'],60,230);
b+=cls('Conversation','Conversation',['+ id : UUID','+ createdAt : Date','+ lastMessageAt : Date'],430,230);
b+=cls('AILog','AILog',['+ id : UUID','+ prompt : String','+ response : String','+ model : String','+ tokensUsed : Int','+ requestedAt : Date'],760,230);
b+=cls('Notification','Notification',['+ id : UUID','+ title : String','+ body : String','+ isRead : Boolean','+ createdAt : Date'],60,490);
b+=cls('DashboardStats','DashboardStats',['+ totalUsers : Int','+ totalCoaches : Int','+ totalAthletes : Int','+ activePrograms : Int','+ messagesCount : Int','+ generatedAt : Date'],430,490);
b+=cls('ExerciseCatalogue','ExerciseCatalogue (Admin)',['+ id : UUID','+ name : String','+ targetMuscle : String','+ videoUrl : String','+ category : String','+ difficulty : Enum','+ approvedAt : Date'],760,490);
b+=ed('User','Message','envoie/reçoit',ASC);
b+=ed('Conversation','Message','contient 1..*',CMP);
b+=ed('User','Conversation','participe 0..*',ASC);
b+=ed('User','AILog','génère 0..*',ASC);
b+=ed('User','Notification','reçoit 0..*',ASC);
fs.writeFileSync('Sprint3_Classes.drawio',wrap(b,'Sprint3 Classes'));
console.log('OK Sprint3_Classes.drawio');})();

// SPRINT 3 SEQUENCE: Envoyer un Message
(function(){gid=1100;let b='';
const Y0=20,OH=36,OW=140;
const MX=[20,190,380,570,780];
const labs=['Expéditeur\n(Coach/Athlète)','Flutter\n(Mobile App)','Node.js\n(Backend)','PostgreSQL','Destinataire\n(Mobile)'];
labs.forEach((l,i)=>{b+=v(`o${i}`,l,OBJ,MX[i],Y0,OW,OH);b+=v(`l${i}`,'',LFL,MX[i]+OW/2,Y0+OH,2,660);});
const base=Y0+OH;
b+=arrow("1. Taper message + cliquer Envoyer",base+30,MX[0]+OW/2,MX[1]+OW/2);
b+=arrow("2. POST /api/messages {receiverId, content}",base+80,MX[1]+OW/2,MX[2]+OW/2);
b+=arrow("3. Valider token JWT de l'expéditeur",base+120,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("4. Confirmation d'autorisation",base+160,MX[3]+OW/2,MX[2]+OW/2,true);
b+=arrow("5. INSERT INTO messages (senderId, receiverId, content)",base+200,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("6. Retourner messageId + timestamp",base+240,MX[3]+OW/2,MX[2]+OW/2,true);
b+=arrow("7. 201 Created {message}",base+280,MX[2]+OW/2,MX[1]+OW/2,true);
b+=arrow("8. Afficher message (statut: Envoyé)",base+320,MX[1]+OW/2,MX[0]+OW/2,true);
b+=v('note1','[Destinataire en ligne]\nNotification temps réel','shape=note;whiteSpace=wrap;html=1;size=12;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=9;',MX[4]-10,base+330,170,45);
b+=arrow("9. Livraison en temps réel du message",base+380,MX[2]+OW/2,MX[4]+OW/2);
b+=arrow("10. ACK — Message reçu",base+420,MX[4]+OW/2,MX[2]+OW/2,true);
b+=arrow("11. UPDATE SET isRead=true",base+460,MX[2]+OW/2,MX[3]+OW/2);
b+=arrow("12. Statut: Lu (double coche)",base+500,MX[2]+OW/2,MX[1]+OW/2,true);
b+=v('note2','[Destinataire Hors Ligne]\nNotification Push FCM/APNS','shape=note;whiteSpace=wrap;html=1;size=12;fillColor=#f8cecc;strokeColor=#b85450;fontSize=9;',MX[4]-10,base+520,170,45);
fs.writeFileSync('Sprint3_Sequence_Message.drawio',wrap(b,'Sprint3 Seq Message'));
console.log('OK Sprint3_Sequence_Message.drawio');})();

console.log('--- Sprint 3 done ---');
