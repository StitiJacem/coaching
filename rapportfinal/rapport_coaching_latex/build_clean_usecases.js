const fs = require('fs');
const path = require('path');

const BASE = __dirname;

function makeRef(value) {
  return { "$ref": value };
}

class MdjBuilder {
  constructor(title) {
    this.counter = 0;
    this.project_id = this.newId("project");
    this.model_id = this.newId("model");
    this.diagram_id = this.newId("useCaseDiagram");
    this.subject_id = this.newId("subject");
    this.title = title;
    this.elements = [];
    this.views = [];
    this.actor_ids = {};
    this.usecase_ids = {};
    this.actor_view_ids = {};
    this.usecase_view_ids = {};
  }

  newId(prefix) {
    this.counter += 1;
    return `${prefix}_${this.counter}`;
  }

  addActor(name, x, y) {
    const actor_id = this.newId("actor");
    const view_id = this.newId("actorView");
    const label_id = this.newId("label");
    const name_id = this.newId("nameComp");
    this.actor_ids[name] = actor_id;
    this.actor_view_ids[name] = view_id;
    this.elements.push({
      "_type": "UMLActor",
      "_id": actor_id,
      "_parent": makeRef(this.model_id),
      "name": name,
      "ownedElements": [],
    });
    this.views.push({
      "_type": "UMLActorView",
      "_id": view_id,
      "_parent": makeRef(this.diagram_id),
      "model": makeRef(actor_id),
      "subViews": [{
        "_type": "UMLNameCompartmentView",
        "_id": name_id,
        "_parent": makeRef(view_id),
        "model": makeRef(actor_id),
        "subViews": [{
          "_type": "LabelView",
          "_id": label_id,
          "_parent": makeRef(name_id),
          "font": "Arial;13;0",
          "left": x - 10,
          "top": y + 72,
          "width": 90,
          "height": 16,
          "text": name,
        }],
        "font": "Arial;13;0",
        "left": x - 10,
        "top": y + 68,
        "width": 90,
        "height": 28,
        "nameLabel": makeRef(label_id),
      }],
      "font": "Arial;13;0",
      "left": x,
      "top": y,
      "width": 70,
      "height": 96,
      "nameCompartment": makeRef(name_id),
      "lineColor": "#000000",
    });
  }

  addUsecase(name, x, y, w = 190, h = 48) {
    const uc_id = this.newId("usecase");
    const view_id = this.newId("useCaseView");
    const label_id = this.newId("label");
    this.usecase_ids[name] = uc_id;
    this.usecase_view_ids[name] = view_id;
    this.elements.push({
      "_type": "UMLUseCase",
      "_id": uc_id,
      "_parent": makeRef(this.model_id),
      "name": name,
    });
    this.views.push({
      "_type": "UMLUseCaseView",
      "_id": view_id,
      "_parent": makeRef(this.diagram_id),
      "model": makeRef(uc_id),
      "subViews": [{
        "_type": "LabelView",
        "_id": label_id,
        "_parent": makeRef(view_id),
        "font": "Arial;13;0",
        "left": x + 12,
        "top": y + h / 2 - 8,
        "width": w - 24,
        "height": 16,
        "text": name,
      }],
      "font": "Arial;13;0",
      "left": x,
      "top": y,
      "width": w,
      "height": h,
      "fillColor": "#FFFFFF",
      "lineColor": "#000000",
    });
  }

  addSubject(x, y, w, h) {
    this.views.unshift({
      "_type": "UMLUseCaseSubjectView",
      "_id": this.newId("subjectView"),
      "_parent": makeRef(this.diagram_id),
      "model": makeRef(this.subject_id),
      "left": x,
      "top": y,
      "width": w,
      "height": h,
      "font": "Arial;13;0",
      "lineColor": "#000000",
    });
  }

  addAssoc(actor, usecase) {
    if (!this.actor_ids[actor] || !this.usecase_ids[usecase]) return;
    const assoc_id = this.newId("assoc");
    this.elements.push({
      "_type": "UMLAssociation",
      "_id": assoc_id,
      "_parent": makeRef(this.model_id),
      "name": "",
      "end1": { "_type": "UMLAssociationEnd", "_id": this.newId("end"), "_parent": makeRef(assoc_id), "reference": makeRef(this.actor_ids[actor]), "navigable": false },
      "end2": { "_type": "UMLAssociationEnd", "_id": this.newId("end"), "_parent": makeRef(assoc_id), "reference": makeRef(this.usecase_ids[usecase]), "navigable": true },
    });
    this.views.push({
      "_type": "UMLAssociationView",
      "_id": this.newId("assocView"),
      "_parent": makeRef(this.diagram_id),
      "model": makeRef(assoc_id),
      "tail": makeRef(this.actor_view_ids[actor]),
      "head": makeRef(this.usecase_view_ids[usecase]),
      "lineColor": "#000000",
    });
  }

  addGeneralization(child, parent) {
    if (!this.actor_ids[child] || !this.actor_ids[parent]) return;
    const gen_id = this.newId("generalization");
    this.elements.push({
      "_type": "UMLGeneralization",
      "_id": gen_id,
      "_parent": makeRef(this.model_id),
      "source": makeRef(this.actor_ids[child]),
      "target": makeRef(this.actor_ids[parent]),
    });
    this.views.push({
      "_type": "UMLGeneralizationView",
      "_id": this.newId("generalizationView"),
      "_parent": makeRef(this.diagram_id),
      "model": makeRef(gen_id),
      "tail": makeRef(this.actor_view_ids[child]),
      "head": makeRef(this.actor_view_ids[parent]),
      "lineColor": "#000000",
    });
  }

  addRelation(source, target, rel_type) {
    if (!this.usecase_ids[source] || !this.usecase_ids[target]) return;
    const rel_id = this.newId(rel_type);
    const uml_type = rel_type === "include" ? "UMLInclude" : "UMLExtend";
    const view_type = rel_type === "include" ? "UMLIncludeView" : "UMLExtendView";
    this.elements.push({
      "_type": uml_type,
      "_id": rel_id,
      "_parent": makeRef(this.model_id),
      "source": makeRef(this.usecase_ids[source]),
      "target": makeRef(this.usecase_ids[target]),
    });
    this.views.push({
      "_type": view_type,
      "_id": this.newId(`${rel_type}View`),
      "_parent": makeRef(this.diagram_id),
      "model": makeRef(rel_id),
      "tail": makeRef(this.usecase_view_ids[source]),
      "head": makeRef(this.usecase_view_ids[target]),
      "lineColor": "#000000",
      "lineStyle": 1,
    });
  }

  project() {
    return {
      "_type": "Project",
      "_id": this.project_id,
      "name": this.title,
      "ownedElements": [{
        "_type": "UMLModel",
        "_id": this.model_id,
        "_parent": makeRef(this.project_id),
        "name": "GOSPORT - Cas d'utilisation",
        "ownedElements": [{
          "_type": "UMLUseCaseDiagram",
          "_id": this.diagram_id,
          "_parent": makeRef(this.model_id),
          "name": this.title,
          "defaultDiagram": true,
          "ownedViews": this.views,
        }, {
          "_type": "UMLUseCaseSubject",
          "_id": this.subject_id,
          "_parent": makeRef(this.model_id),
          "name": "Plateforme GOSPORT",
        }, ...this.elements],
      }],
    };
  }
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function drawioId(prefix, name) {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '_');
  return `${prefix}_${cleaned}`.replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function drawioCell(cell_id, value, style, x, y, w, h, vertex = true, parent = "1") {
  const vertexAttr = vertex ? ' vertex="1"' : "";
  return `<mxCell id="${xmlEscape(cell_id)}" value="${xmlEscape(value)}" style="${xmlEscape(style)}"${vertexAttr} parent="${xmlEscape(parent)}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>\n`;
}

function drawioEdge(edge_id, source, target, label = "", style = null) {
  if (style === null) {
    style = "endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;";
  }
  return `<mxCell id="${xmlEscape(edge_id)}" value="${xmlEscape(label)}" style="${xmlEscape(style)}" edge="1" parent="1" source="${xmlEscape(source)}" target="${xmlEscape(target)}"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
}

function writeDrawio(spec, filename, title) {
  const [width, height] = spec.size || [1280, 900];
  const actor_style = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;";
  const usecase_style = "ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;fontSize=12;";
  const subject_style = "whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;fontColor=#000000;verticalAlign=top;fontSize=13;";
  
  // Rendu strict et moderne sans edgeStyle orthogonal pour éviter la fusion et le chevauchement des flèches en une seule ligne verticale
  const assoc_style = "endArrow=open;endFill=0;html=1;rounded=0;strokeColor=#000000;fontColor=#000000;";
  const include_style = "endArrow=open;endFill=0;dashed=1;html=1;rounded=0;strokeColor=#000000;fontColor=#000000;fontSize=10;labelBackgroundColor=#FFFFFF;";
  const extend_style = include_style;
  const gen_style = "endArrow=block;endFill=0;endSize=14;html=1;rounded=0;strokeColor=#000000;fontColor=#000000;";

  const cells = ['<mxCell id="0"/>\n<mxCell id="1" parent="0"/>\n'];
  const [sx, sy, sw, sh] = spec.subject;
  cells.push(drawioCell("system", "Plateforme GOSPORT", subject_style, sx, sy, sw, sh));

  const actor_ids = {};
  for (const [name, [x, y]] of Object.entries(spec.actors)) {
    const cell_id = drawioId("actor", name);
    actor_ids[name] = cell_id;
    cells.push(drawioCell(cell_id, name, actor_style, x, y, 70, 90));
  }

  const uc_ids = {};
  for (const [name, [x, y, w, h]] of Object.entries(spec.usecases)) {
    const cell_id = drawioId("uc", name);
    uc_ids[name] = cell_id;
    cells.push(drawioCell(cell_id, name, usecase_style, x, y, w, h));
  }

  let edge_no = 1;
  for (const [child, parent] of spec.generalizations || []) {
    if (actor_ids[child] && actor_ids[parent]) {
      cells.push(drawioEdge(`edge_gen_${edge_no}`, actor_ids[child], actor_ids[parent], "", gen_style));
      edge_no += 1;
    }
  }

  for (const [actor, usecase] of spec.associations || []) {
    if (actor_ids[actor] && uc_ids[usecase]) {
      cells.push(drawioEdge(`edge_assoc_${edge_no}`, actor_ids[actor], uc_ids[usecase], "", assoc_style));
      edge_no += 1;
    }
  }

  for (const [source, target] of spec.includes || []) {
    if (uc_ids[source] && uc_ids[target]) {
      cells.push(drawioEdge(`edge_include_${edge_no}`, uc_ids[source], uc_ids[target], "<<include>>", include_style));
      edge_no += 1;
    }
  }

  for (const [source, target] of spec.extends || []) {
    if (uc_ids[source] && uc_ids[target]) {
      cells.push(drawioEdge(`edge_extend_${edge_no}`, uc_ids[source], uc_ids[target], "<<extend>>", extend_style));
      edge_no += 1;
    }
  }

  const graph = `<mxfile host="app.diagrams.net" version="21.6.8"><diagram id="d1" name="${xmlEscape(title)}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0"><root>${cells.join("")}</root></mxGraphModel></diagram></mxfile>`;
  fs.writeFileSync(path.join(BASE, filename), graph, 'utf8');
}

function writeMdj(spec, filename, title) {
  const builder = new MdjBuilder(title);
  const [sx, sy, sw, sh] = spec.subject;
  builder.addSubject(sx, sy, sw, sh);
  for (const [name, [x, y]] of Object.entries(spec.actors)) {
    builder.addActor(name, x, y);
  }
  for (const [name, [x, y, w, h]] of Object.entries(spec.usecases)) {
    builder.addUsecase(name, x, y, w, h);
  }
  for (const [child, parent] of spec.generalizations || []) {
    builder.addGeneralization(child, parent);
  }
  for (const [actor, usecase] of spec.associations || []) {
    builder.addAssoc(actor, usecase);
  }
  for (const [source, target] of spec.includes || []) {
    builder.addRelation(source, target, "include");
  }
  for (const [source, target] of spec.extends || []) {
    builder.addRelation(source, target, "extend");
  }
  fs.writeFileSync(path.join(BASE, filename), JSON.stringify(builder.project(), null, "\t") + "\n", 'utf8');
}

const AUTH_USECASE = "S'authentifier";
const AUTH_SUBCASES = new Set([
  "Verifier identifiants",
  "Verifier mot de passe",
  "Generer token JWT",
  "Generer JWT",
]);

function withAuthenticationIncludes(spec) {
  if (!spec.usecases[AUTH_USECASE]) {
    return spec;
  }
  const secured = JSON.parse(JSON.stringify(spec));
  const includes = [...(secured.includes || [])];
  const include_set = new Set(includes.map(([s, t]) => `${s}::${t}`));

  for (const usecase of Object.keys(secured.usecases)) {
    if (usecase === AUTH_USECASE || AUTH_SUBCASES.has(usecase)) {
      continue;
    }
    const relation = [usecase, AUTH_USECASE];
    const key = `${usecase}::${AUTH_USECASE}`;
    if (!include_set.has(key)) {
      includes.push(relation);
      include_set.add(key);
    }
  }
  secured.includes = includes;
  secured.extends = (secured.extends || []).filter(([s, t]) => !(s === "Completer profil" && t === AUTH_USECASE));
  return secured;
}

// ----------------------------------------------------
// SPÉCIFICATIONS DES DIAGRAMMES AVEC LAYOUT OPTIMISÉ
// ----------------------------------------------------

const GLOBAL = {
  size: [1280, 900],
  subject: [250, 40, 870, 820],
  actors: {
    "Utilisateur": [40, 380],
    "Athlete": [140, 160],
    "Nutritionniste": [140, 380],
    "Coach": [140, 600],
    "Administrateur": [1170, 150],
    "Service IA": [1170, 500],
  },
  usecases: {
    // Ligne 1 (y = 60) - Authentification et vérifications de base
    "Generer token JWT": [320, 60, 175, 38],
    "S'authentifier": [590, 60, 190, 45],
    "Verifier identifiants": [880, 60, 180, 38],
    
    // Ligne 2 (y = 160) - Profil et administration
    "Decouvrir specialistes": [320, 160, 205, 38],
    "Completer profil": [590, 160, 165, 38],
    "Administrer utilisateurs": [880, 160, 210, 38],
    
    // Ligne 3 (y = 260) - Nutrition et journalisation Athlete
    "Journaliser performance": [320, 260, 220, 38],
    "Filtrer specialistes": [590, 260, 185, 38],
    "Gerer nutrition": [880, 260, 155, 38],
    
    // Ligne 4 (y = 360) - Séance et sessions
    "Executer seance": [320, 360, 170, 38],
    "Gerer agenda sessions": [590, 360, 210, 38],
    "Consulter tableaux de bord": [880, 360, 245, 38],
    
    // Ligne 5 (y = 480) - IA et demandes de relation
    "Analyser repas par IA": [320, 480, 220, 38],
    "Gerer demandes de relation": [590, 480, 250, 38],
    "Notifier statut demande": [880, 480, 220, 38],
    
    // Ligne 6 (y = 600) - Messagerie et programmes
    "Gerer messagerie": [320, 600, 185, 38],
    "Gerer programmes entrainement": [590, 600, 270, 38],
  },
  generalizations: [
    ["Athlete", "Utilisateur"],
    ["Nutritionniste", "Utilisateur"],
    ["Coach", "Utilisateur"],
    ["Administrateur", "Utilisateur"],
  ],
  associations: [
    ["Utilisateur", "S'authentifier"],
    ["Athlete", "Decouvrir specialistes"],
    ["Athlete", "Gerer nutrition"],
    ["Athlete", "Executer seance"],
    ["Athlete", "Journaliser performance"],
    ["Athlete", "Gerer agenda sessions"],
    ["Athlete", "Gerer messagerie"],
    ["Nutritionniste", "Gerer nutrition"],
    ["Nutritionniste", "Consulter tableaux de bord"],
    ["Nutritionniste", "Gerer messagerie"],
    ["Coach", "Gerer demandes de relation"],
    ["Coach", "Gerer programmes entrainement"],
    ["Coach", "Consulter tableaux de bord"],
    ["Coach", "Gerer agenda sessions"],
    ["Coach", "Gerer messagerie"],
    ["Administrateur", "Administrer utilisateurs"],
    ["Administrateur", "Consulter tableaux de bord"],
    ["Service IA", "Analyser repas par IA"],
  ],
  includes: [
    ["S'authentifier", "Verifier identifiants"],
    ["S'authentifier", "Generer token JWT"],
    ["Decouvrir specialistes", "Filtrer specialistes"],
    ["Gerer demandes de relation", "Notifier statut demande"],
    ["Executer seance", "Journaliser performance"],
  ],
  extends: [
    ["Completer profil", "S'authentifier"],
    ["Analyser repas par IA", "Gerer nutrition"],
  ],
};

const SPRINT1 = {
  size: [1120, 760],
  subject: [230, 40, 710, 650],
  actors: {
    "Utilisateur": [40, 300],
    "Athlete": [130, 120],
    "Coach": [130, 300],
    "Nutritionniste": [130, 480],
    "Provider OAuth": [980, 185],
    "Service Email": [980, 400],
  },
  usecases: {
    "S'inscrire": [300, 90, 155, 38],
    "Valider formulaire": [610, 90, 190, 38],
    "Envoyer code verification": [610, 170, 230, 38],
    "Verifier email": [325, 210, 170, 38],
    "S'authentifier": [330, 310, 170, 38],
    "Verifier mot de passe": [610, 300, 220, 38],
    "Generer JWT": [610, 380, 150, 38],
    "Connexion OAuth": [610, 455, 180, 38],
    "Reinitialiser mot de passe": [305, 480, 240, 38],
    "Completer onboarding": [420, 575, 225, 38],
    "Acceder espace protege": [675, 575, 220, 38],
  },
  generalizations: [["Athlete", "Utilisateur"], ["Coach", "Utilisateur"], ["Nutritionniste", "Utilisateur"]],
  associations: [
    ["Utilisateur", "S'inscrire"],
    ["Utilisateur", "Verifier email"],
    ["Utilisateur", "S'authentifier"],
    ["Utilisateur", "Reinitialiser mot de passe"],
    ["Utilisateur", "Acceder espace protege"],
    ["Provider OAuth", "Connexion OAuth"],
    ["Service Email", "Envoyer code verification"],
    ["Service Email", "Reinitialiser mot de passe"],
  ],
  includes: [
    ["S'inscrire", "Valider formulaire"],
    ["S'inscrire", "Envoyer code verification"],
    ["Verifier email", "Valider formulaire"],
    ["S'authentifier", "Verifier mot de passe"],
    ["S'authentifier", "Generer JWT"],
    ["Completer onboarding", "S'authentifier"],
    ["Acceder espace protege", "S'authentifier"],
    ["Reinitialiser mot de passe", "Envoyer code verification"],
  ],
  extends: [
    ["Connexion OAuth", "S'authentifier"],
    ["Completer onboarding", "Verifier email"],
    ["Reinitialiser mot de passe", "S'authentifier"],
  ],
};

const SPRINT2 = {
  size: [1120, 760],
  subject: [220, 40, 740, 650],
  actors: {
    "Utilisateur": [35, 300],
    "Athlete": [120, 120],
    "Coach": [120, 300],
    "Nutritionniste": [120, 480],
    "Service Notification": [990, 390],
  },
  usecases: {
    "S'authentifier": [300, 80, 180, 38],
    "Consulter marketplace": [300, 170, 220, 38],
    "Filtrer par specialite": [655, 170, 205, 38],
    "Envoyer demande coaching": [300, 285, 250, 38],
    "Envoyer demande nutrition": [610, 285, 250, 38],
    "Traiter demande": [320, 410, 190, 38],
    "Accepter demande": [600, 385, 190, 38],
    "Refuser demande": [600, 450, 180, 38],
    "Gerer clients": [320, 545, 170, 38],
    "Rompre relation": [610, 545, 180, 38],
    "Notifier utilisateur": [735, 625, 205, 38],
  },
  generalizations: [["Athlete", "Utilisateur"], ["Coach", "Utilisateur"], ["Nutritionniste", "Utilisateur"]],
  associations: [
    ["Utilisateur", "S'authentifier"],
    ["Athlete", "Consulter marketplace"],
    ["Athlete", "Envoyer demande coaching"],
    ["Athlete", "Envoyer demande nutrition"],
    ["Athlete", "Rompre relation"],
    ["Coach", "Traiter demande"],
    ["Coach", "Gerer clients"],
    ["Coach", "Rompre relation"],
    ["Nutritionniste", "Traiter demande"],
    ["Nutritionniste", "Gerer clients"],
    ["Nutritionniste", "Rompre relation"],
    ["Service Notification", "Notifier utilisateur"],
  ],
  includes: [
    ["Consulter marketplace", "S'authentifier"],
    ["Envoyer demande coaching", "S'authentifier"],
    ["Envoyer demande nutrition", "S'authentifier"],
    ["Traiter demande", "S'authentifier"],
    ["Gerer clients", "S'authentifier"],
    ["Rompre relation", "S'authentifier"],
    ["Consulter marketplace", "Filtrer par specialite"],
    ["Envoyer demande coaching", "Notifier utilisateur"],
    ["Envoyer demande nutrition", "Notifier utilisateur"],
    ["Traiter demande", "Notifier utilisateur"],
    ["Rompre relation", "Notifier utilisateur"],
  ],
  extends: [
    ["Accepter demande", "Traiter demande"],
    ["Refuser demande", "Traiter demande"],
  ],
};

const SPRINT3 = {
  size: [1120, 800],
  subject: [220, 40, 750, 690],
  actors: {
    "Utilisateur": [35, 300],
    "Coach": [120, 150],
    "Athlete": [120, 450],
    "Catalogue Exercices": [990, 150],
    "Service Suivi": [990, 390],
    "Service Notification": [990, 590],
  },
  usecases: {
    "S'authentifier": [300, 80, 180, 38],
    "Consulter catalogue exercices": [300, 165, 265, 38],
    "Rechercher exercice": [660, 165, 205, 38],
    "Creer programme": [300, 285, 190, 38],
    "Composer jour entrainement": [590, 285, 255, 38],
    "Ajouter exercice au programme": [520, 365, 290, 38],
    "Assigner programme": [300, 470, 205, 38],
    "Notifier utilisateur": [680, 470, 205, 38],
    "Accepter programme": [300, 560, 210, 38],
    "Consulter seance du jour": [585, 560, 245, 38],
    "Demarrer workout player": [300, 645, 235, 38],
    "Journaliser series": [640, 645, 200, 38],
  },
  generalizations: [["Coach", "Utilisateur"], ["Athlete", "Utilisateur"]],
  associations: [
    ["Utilisateur", "S'authentifier"],
    ["Coach", "Consulter catalogue exercices"],
    ["Coach", "Creer programme"],
    ["Coach", "Assigner programme"],
    ["Athlete", "Consulter catalogue exercices"],
    ["Athlete", "Accepter programme"],
    ["Athlete", "Consulter seance du jour"],
    ["Athlete", "Demarrer workout player"],
    ["Athlete", "Journaliser series"],
    ["Catalogue Exercices", "Consulter catalogue exercices"],
    ["Service Suivi", "Journaliser series"],
    ["Service Notification", "Notifier utilisateur"],
  ],
  includes: [
    ["Consulter catalogue exercices", "S'authentifier"],
    ["Creer programme", "S'authentifier"],
    ["Assigner programme", "S'authentifier"],
    ["Accepter programme", "S'authentifier"],
    ["Consulter seance du jour", "S'authentifier"],
    ["Demarrer workout player", "S'authentifier"],
    ["Journaliser series", "S'authentifier"],
    ["Consulter catalogue exercices", "Rechercher exercice"],
    ["Creer programme", "Composer jour entrainement"],
    ["Composer jour entrainement", "Ajouter exercice au programme"],
    ["Assigner programme", "Notifier utilisateur"],
    ["Demarrer workout player", "Journaliser series"],
  ],
  extends: [
    ["Assigner programme", "Creer programme"],
    ["Accepter programme", "Assigner programme"],
    ["Demarrer workout player", "Consulter seance du jour"],
  ],
};

const SPRINT4 = {
  size: [1120, 780],
  subject: [220, 40, 750, 675],
  actors: {
    "Utilisateur": [35, 300],
    "Athlete": [120, 150],
    "Nutritionniste": [120, 450],
    "Service IA": [990, 240],
    "Service Analyse": [990, 500],
  },
  usecases: {
    "S'authentifier": [300, 80, 180, 38],
    "Configurer profil alimentaire": [310, 165, 255, 38],
    "Calculer besoins nutritionnels": [650, 165, 270, 38],
    "Creer plan dietetique": [310, 285, 220, 38],
    "Composer jour alimentaire": [650, 285, 250, 38],
    "Ajouter repas": [700, 365, 170, 38],
    "Assigner plan": [335, 450, 165, 38],
    "Consulter plan actif": [640, 450, 220, 38],
    "Journaliser repas": [315, 560, 195, 38],
    "Scanner repas par IA": [620, 560, 220, 38],
    "Calculer conformite": [690, 645, 215, 38],
    "Suivre objectifs sante": [315, 645, 220, 38],
  },
  generalizations: [["Athlete", "Utilisateur"], ["Nutritionniste", "Utilisateur"]],
  associations: [
    ["Utilisateur", "S'authentifier"],
    ["Athlete", "Configurer profil alimentaire"],
    ["Athlete", "Consulter plan actif"],
    ["Athlete", "Journaliser repas"],
    ["Athlete", "Scanner repas par IA"],
    ["Athlete", "Suivre objectifs sante"],
    ["Nutritionniste", "Configurer profil alimentaire"],
    ["Nutritionniste", "Creer plan dietetique"],
    ["Nutritionniste", "Assigner plan"],
    ["Nutritionniste", "Suivre objectifs sante"],
    ["Service IA", "Scanner repas par IA"],
    ["Service Analyse", "Calculer conformite"],
  ],
  includes: [
    ["Configurer profil alimentaire", "S'authentifier"],
    ["Creer plan dietetique", "S'authentifier"],
    ["Assigner plan", "S'authentifier"],
    ["Consulter plan actif", "S'authentifier"],
    ["Journaliser repas", "S'authentifier"],
    ["Scanner repas par IA", "S'authentifier"],
    ["Suivre objectifs sante", "S'authentifier"],
    ["Configurer profil alimentaire", "Calculer besoins nutritionnels"],
    ["Creer plan dietetique", "Composer jour alimentaire"],
    ["Composer jour alimentaire", "Ajouter repas"],
    ["Assigner plan", "Consulter plan actif"],
    ["Journaliser repas", "Calculer conformite"],
    ["Suivre objectifs sante", "Calculer conformite"],
  ],
  extends: [
    ["Scanner repas par IA", "Journaliser repas"],
    ["Assigner plan", "Creer plan dietetique"],
  ],
};

const JOBS = [
  [GLOBAL, "global use case .mdj", "Global_Cas_Utilisation.drawio", "Diagramme de cas d'utilisation global - GOSPORT"],
  [SPRINT1, "sprint 1 use case .mdj", "Sprint1_Cas_Utilisation.drawio", "Diagramme de cas d'utilisation - Sprint 1"],
  [SPRINT2, "sprint 2 use case .mdj", "Sprint2_Cas_Utilisation.drawio", "Diagramme de cas d'utilisation - Sprint 2"],
  [SPRINT3, "sprint 3 use case .mdj", "Sprint3_Cas_Utilisation.drawio", "Diagramme de cas d'utilisation - Sprint 3"],
  [SPRINT4, "sprint 4 use case .mdj", "Sprint4_Cas_Utilisation.drawio", "Diagramme de cas d'utilisation - Sprint 4"],
];

for (const [spec, mdj, drawio, title] of JOBS) {
  const securedSpec = withAuthenticationIncludes(spec);
  writeMdj(securedSpec, mdj, title);
  writeDrawio(securedSpec, drawio, title);
  console.log(`Generated: ${mdj} and ${drawio}`);
}

console.log("All clean usecase diagrams regenerated successfully with 100% accurate auth includes!");
