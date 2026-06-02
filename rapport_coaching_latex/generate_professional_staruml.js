const fs = require("fs");
const path = require("path");

const outDir = __dirname;
let counter = 0;
const id = (prefix = "id") => `${prefix}_${(++counter).toString(36)}_${Date.now().toString(36)}`;
const ref = (x) => ({ $ref: x });

const classDefs = {
  User: {
    attrs: ["id: number", "email: string", "password?: string", "role: string", "is_verified: boolean", "oauth_provider: string", "profile_completed: boolean", "created_at: Date"],
    ops: ["register()", "login()", "verifyEmail()", "resetPassword()", "updateProfile()"],
  },
  Athlete: {
    attrs: ["id: number", "userId: number", "sport?: string", "goals?: string", "experienceLevel?: string", "fitnessLevel?: string", "joinedDate: Date"],
    ops: ["completeProfile()", "updateMetrics()", "consultDashboard()"],
  },
  CoachProfile: {
    attrs: ["id: uuid", "userId: number", "bio?: string", "experience_years: number", "rating: number", "monthlyPrice: decimal", "verified: boolean"],
    ops: ["updateProfile()", "publishProgram()", "manageAthletes()"],
  },
  NutritionistProfile: {
    attrs: ["id: uuid", "userId: number", "bio?: string", "experience_years: number", "rating: number", "specializations?: string[]"],
    ops: ["updateProfile()", "createDietPlan()", "monitorCompliance()"],
  },
  CoachingRequest: {
    attrs: ["id: uuid", "athleteId: number", "coachProfileId: uuid", "initiator: enum", "status: pending|accepted|rejected", "message?: string"],
    ops: ["send()", "accept()", "reject()", "disconnect()"],
  },
  NutritionConnection: {
    attrs: ["id: uuid", "athleteId: number", "nutritionistProfileId: uuid", "initiator: enum", "status: pending|accepted|rejected", "message?: string"],
    ops: ["send()", "respond()", "listClients()"],
  },
  CoachSpecialization: { attrs: ["id: uuid", "coachProfileId: uuid", "specialization: string", "is_primary: boolean"], ops: [] },
  CoachCertification: { attrs: ["id: uuid", "coachProfileId: uuid", "name: string", "issuer?: string", "verified: boolean"], ops: [] },
  Exercise: {
    attrs: ["id: uuid", "name: string", "target_muscle?: string", "difficulty_level: string", "gif_url?: string", "is_custom: boolean"],
    ops: ["search()", "getByBodyPart()", "getGif()"],
  },
  Program: {
    attrs: ["id: number", "name: string", "athleteId?: number", "coachId: number", "status: string", "is_template: boolean", "startDate: Date"],
    ops: ["create()", "assign()", "accept()", "quit()"],
  },
  ProgramDay: { attrs: ["id: number", "programId: number", "day_number: number", "title?: string"], ops: ["addExercise()"] },
  ProgramExercise: { attrs: ["id: number", "programDayId: number", "exercise_id: string", "sets: number", "reps: number", "rpe?: number", "order: number"], ops: [] },
  WorkoutLog: {
    attrs: ["id: number", "athleteId: number", "programId?: number", "sessionId?: number", "scheduledDate: Date", "completedAt?: Date", "status: string"],
    ops: ["start()", "complete()", "quit()", "emitEvent()"],
  },
  ExerciseLog: { attrs: ["id: number", "workoutLogId: number", "exercise_name: string", "setsCompleted: number", "repsPerSet?: number[]", "weightKgPerSet?: number[]"], ops: [] },
  ActivityEvent: { attrs: ["id: number", "athleteId: number", "type: string", "payload?: json", "created_at: Date"], ops: ["record()"] },
  Goal: { attrs: ["id: number", "athleteId: number", "name: string", "targetValue?: number", "currentValue?: number", "status: string"], ops: ["create()", "updateProgress()", "close()"] },
  BodyMetric: { attrs: ["id: number", "athleteId: number", "date: Date", "weight?: decimal", "bodyFat?: decimal", "vo2max?: decimal"], ops: ["addMetric()"] },
  DietaryProfile: { attrs: ["id: uuid", "athleteId: number", "bmr?: number", "tdee?: number", "targetCalories?: number", "allergies?: string[]"], ops: ["calculateTargets()"] },
  DietPlan: { attrs: ["id: uuid", "name: string", "goal: enum", "isTemplate: boolean", "athleteId?: number", "startDate?: string"], ops: ["create()", "build()", "assign()", "delete()"] },
  DietDay: { attrs: ["id: uuid", "dietPlanId: uuid", "day_number: number", "title?: string", "isRestDay: boolean"], ops: [] },
  Meal: { attrs: ["id: uuid", "dietDayId: uuid", "mealType: enum", "timeOfDay: string", "calories: number", "protein: number", "carbs: number", "fats: number"], ops: [] },
  MealLog: { attrs: ["id: uuid", "athleteId: number", "foodName: string", "calories: number", "protein: number", "carbs: number", "fats: number", "loggedAt: Date"], ops: ["logMeal()", "deleteLog()"] },
  DietLog: { attrs: ["id: uuid", "athleteId: number", "dietPlanId?: uuid", "date: string", "isCompleted: boolean", "totalCaloriesConsumed: number"], ops: ["computeCompliance()"] },
  Conversation: { attrs: ["id: uuid", "type: enum", "participant1Id: number", "participant2Id: number", "lastMessageContent?: string", "lastMessageAt?: Date"], ops: ["start()", "listMessages()"] },
  Message: { attrs: ["id: uuid", "conversationId: uuid", "senderId: number", "content: string", "isRead: boolean", "created_at: Date"], ops: ["send()", "markRead()"] },
  Notification: { attrs: ["id: number", "userId: number", "type: string", "title: string", "body?: string", "read: boolean"], ops: ["push()", "markRead()", "delete()"] },
  Session: { attrs: ["id: number", "athleteId?: number", "coachId?: number", "programId?: number", "date?: Date", "time: string", "status: string"], ops: ["create()", "update()", "cancel()"] },
  UserInvitation: { attrs: ["id: uuid", "email: string", "coachId: number", "status: pending|accepted|expired", "token?: string", "expiresAt?: Date"], ops: ["invite()", "accept()"] },
};

const assocDefs = [
  ["User", "Athlete", "1", "0..1", "possède"],
  ["User", "CoachProfile", "1", "0..1", "possède"],
  ["User", "NutritionistProfile", "1", "0..1", "possède"],
  ["Athlete", "CoachingRequest", "1", "0..*", "demande"],
  ["CoachProfile", "CoachingRequest", "1", "0..*", "reçoit"],
  ["CoachProfile", "CoachSpecialization", "1", "0..*", "décrit"],
  ["CoachProfile", "CoachCertification", "1", "0..*", "certifie"],
  ["Athlete", "NutritionConnection", "1", "0..*", "demande"],
  ["NutritionistProfile", "NutritionConnection", "1", "0..*", "suit"],
  ["CoachProfile", "Program", "1", "0..*", "crée"],
  ["Athlete", "Program", "1", "0..*", "reçoit"],
  ["Program", "ProgramDay", "1", "1..*", "compose"],
  ["ProgramDay", "ProgramExercise", "1", "1..*", "contient"],
  ["ProgramExercise", "Exercise", "0..*", "1", "référence"],
  ["Athlete", "WorkoutLog", "1", "0..*", "réalise"],
  ["WorkoutLog", "ExerciseLog", "1", "0..*", "détaille"],
  ["Athlete", "BodyMetric", "1", "0..*", "mesure"],
  ["Athlete", "Goal", "1", "0..*", "poursuit"],
  ["Athlete", "DietaryProfile", "1", "0..1", "configure"],
  ["NutritionistProfile", "DietPlan", "1", "0..*", "élabore"],
  ["Athlete", "DietPlan", "1", "0..*", "suit"],
  ["DietPlan", "DietDay", "1", "1..*", "organise"],
  ["DietDay", "Meal", "1", "1..*", "planifie"],
  ["Athlete", "MealLog", "1", "0..*", "journalise"],
  ["DietPlan", "DietLog", "1", "0..*", "contrôle"],
  ["User", "Conversation", "1", "0..*", "participe"],
  ["Conversation", "Message", "1", "0..*", "contient"],
  ["User", "Message", "1", "0..*", "envoie"],
  ["User", "Notification", "1", "0..*", "reçoit"],
  ["Athlete", "Session", "1", "0..*", "réserve"],
  ["User", "Session", "1", "0..*", "anime"],
  ["ProgramDay", "Session", "1", "0..*", "alimente"],
  ["User", "UserInvitation", "1", "0..*", "envoie"],
  ["Athlete", "ActivityEvent", "1", "0..*", "génère"],
];

const sprintClasses = {
  global: Object.keys(classDefs),
  1: ["User", "Athlete", "CoachProfile", "NutritionistProfile", "UserInvitation", "Notification"],
  2: ["User", "Athlete", "CoachProfile", "NutritionistProfile", "CoachingRequest", "NutritionConnection", "CoachSpecialization", "CoachCertification"],
  3: ["Athlete", "CoachProfile", "Exercise", "Program", "ProgramDay", "ProgramExercise", "WorkoutLog", "ExerciseLog", "ActivityEvent"],
  4: ["Athlete", "NutritionistProfile", "DietaryProfile", "DietPlan", "DietDay", "Meal", "MealLog", "DietLog", "Goal", "BodyMetric"],
  5: ["User", "Athlete", "CoachProfile", "NutritionistProfile", "Conversation", "Message", "Notification", "Session"],
  6: ["User", "Notification", "ActivityEvent", "Session", "WorkoutLog", "DietLog", "BodyMetric"],
};

const useCases = {
  global: {
    actors: ["Visiteur", "Athlète", "Coach", "Nutritionniste", "Administrateur", "Service IA"],
    cases: [
      ["S'inscrire et vérifier email", ["Visiteur"]],
      ["Se connecter / OAuth", ["Visiteur", "Athlète", "Coach", "Nutritionniste", "Administrateur"]],
      ["Compléter onboarding", ["Athlète", "Coach", "Nutritionniste"]],
      ["Découvrir spécialistes", ["Athlète"]],
      ["Gérer demandes de coaching", ["Athlète", "Coach"]],
      ["Créer programmes d'entraînement", ["Coach"]],
      ["Exécuter séance et journaliser", ["Athlète"]],
      ["Suivre objectifs et métriques", ["Athlète", "Coach"]],
      ["Créer plan nutritionnel", ["Nutritionniste"]],
      ["Journaliser repas", ["Athlète", "Service IA"]],
      ["Échanger messages", ["Athlète", "Coach", "Nutritionniste"]],
      ["Planifier sessions", ["Athlète", "Coach"]],
      ["Consulter tableaux de bord", ["Athlète", "Coach", "Nutritionniste", "Administrateur"]],
      ["Administrer utilisateurs", ["Administrateur"]],
    ],
  },
  1: {
    actors: ["Visiteur", "Utilisateur", "Google/Facebook OAuth", "Système Email"],
    cases: [
      ["Créer un compte", ["Visiteur"]],
      ["Valider formulaire", ["Visiteur"]],
      ["Envoyer code de vérification", ["Système Email"]],
      ["Vérifier email", ["Utilisateur", "Système Email"]],
      ["Se connecter avec mot de passe", ["Utilisateur"]],
      ["Se connecter via OAuth", ["Utilisateur", "Google/Facebook OAuth"]],
      ["Réinitialiser mot de passe", ["Utilisateur", "Système Email"]],
      ["Compléter profil initial", ["Utilisateur"]],
      ["Protéger route par JWT", ["Utilisateur"]],
    ],
  },
  2: {
    actors: ["Athlète", "Coach", "Nutritionniste", "Système Notification"],
    cases: [
      ["Explorer coachs publics", ["Athlète"]],
      ["Explorer nutritionnistes", ["Athlète"]],
      ["Filtrer spécialistes", ["Athlète"]],
      ["Envoyer demande de coaching", ["Athlète", "Coach"]],
      ["Accepter / refuser demande", ["Coach", "Nutritionniste"]],
      ["Gérer clients acceptés", ["Coach", "Nutritionniste"]],
      ["Déconnecter relation", ["Athlète", "Coach", "Nutritionniste"]],
      ["Notifier changement de statut", ["Système Notification"]],
    ],
  },
  3: {
    actors: ["Coach", "Athlète", "Catalogue Exercices", "Système Suivi"],
    cases: [
      ["Rechercher exercices", ["Coach", "Athlète", "Catalogue Exercices"]],
      ["Créer programme", ["Coach"]],
      ["Composer jours et exercices", ["Coach"]],
      ["Assigner programme", ["Coach"]],
      ["Accepter programme", ["Athlète"]],
      ["Consulter séance du jour", ["Athlète"]],
      ["Démarrer workout player", ["Athlète"]],
      ["Journaliser séries et charges", ["Athlète", "Système Suivi"]],
      ["Consulter historique", ["Athlète", "Coach"]],
    ],
  },
  4: {
    actors: ["Athlète", "Nutritionniste", "Service IA", "Système Analyse"],
    cases: [
      ["Configurer profil alimentaire", ["Athlète", "Nutritionniste"]],
      ["Créer plan diététique", ["Nutritionniste"]],
      ["Construire journées et repas", ["Nutritionniste"]],
      ["Assigner plan à athlète", ["Nutritionniste"]],
      ["Consulter plan actif", ["Athlète"]],
      ["Scanner repas par IA", ["Athlète", "Service IA"]],
      ["Journaliser repas consommé", ["Athlète"]],
      ["Suivre conformité nutritionnelle", ["Athlète", "Nutritionniste", "Système Analyse"]],
      ["Suivre objectifs et métriques", ["Athlète", "Coach"]],
    ],
  },
  5: {
    actors: ["Athlète", "Coach", "Nutritionniste", "Socket.IO", "Copilote IA"],
    cases: [
      ["Démarrer conversation", ["Athlète", "Coach", "Nutritionniste"]],
      ["Envoyer message instantané", ["Athlète", "Coach", "Nutritionniste", "Socket.IO"]],
      ["Consulter contacts", ["Athlète", "Coach", "Nutritionniste"]],
      ["Recevoir notifications", ["Athlète", "Coach", "Nutritionniste"]],
      ["Créer session agenda", ["Coach", "Athlète"]],
      ["Modifier / annuler session", ["Coach", "Athlète"]],
      ["Demander assistance IA", ["Athlète", "Coach", "Nutritionniste", "Copilote IA"]],
    ],
  },
  6: {
    actors: ["Développeur", "Administrateur", "Docker", "PostgreSQL", "API Backend"],
    cases: [
      ["Configurer environnement", ["Développeur"]],
      ["Construire images Docker", ["Développeur", "Docker"]],
      ["Déployer backend et frontend", ["Développeur", "Docker"]],
      ["Initialiser base de données", ["Développeur", "PostgreSQL"]],
      ["Vérifier sécurité JWT/CORS", ["Administrateur", "API Backend"]],
      ["Surveiller logs applicatifs", ["Administrateur"]],
      ["Valider tests de non-régression", ["Développeur"]],
    ],
  },
};

const sequences = {
  1: {
    title: "Séquence Sprint 1 - Authentification et onboarding",
    lifelines: ["Utilisateur", "Angular AuthService", "AuthController", "UserRepository", "EmailService", "JWT"],
    messages: [
      "saisit inscription", "POST /auth/signup", "create(User)", "sendVerificationCode()", "code envoyé",
      "POST /auth/verify-email", "markVerified()", "POST /auth/login", "validatePassword()", "signToken()", "retour token + profil",
    ],
  },
  2: {
    title: "Séquence Sprint 2 - Demande de mise en relation",
    lifelines: ["Athlète", "Discovery UI", "CoachingRequestController", "CoachRepository", "NotificationService", "Coach"],
    messages: ["recherche spécialiste", "GET /coaches/public", "liste coachs", "POST /coaching-requests", "check existing request", "save pending", "notify coach", "PATCH /requests/:id accepted", "notify athlete"],
  },
  3: {
    title: "Séquence Sprint 3 - Création et exécution programme",
    lifelines: ["Coach", "Program Builder", "ProgramController", "ProgramRepository", "Athlète", "Workout Player", "WorkoutLogController"],
    messages: ["compose programme", "POST /programs", "save Program/Days/Exercises", "assign()", "notification programme", "acceptProgram()", "GET today workout", "start workout", "logExercise()", "complete workout"],
  },
  4: {
    title: "Séquence Sprint 4 - Plan nutritionnel et journal alimentaire",
    lifelines: ["Nutritionniste", "Diet Builder", "DietController", "DietRepository", "Athlète", "AIController", "MealLogRepository"],
    messages: ["crée plan", "POST /nutrition/plans", "save plan", "PUT /plans/:id/build", "save days/meals", "consulte plan actif", "scan meal image", "analyzeFood()", "POST /athletes/:id/log", "compute compliance"],
  },
  5: {
    title: "Séquence Sprint 5 - Messagerie et agenda",
    lifelines: ["Utilisateur A", "Messaging UI", "ChatController", "ConversationRepository", "SocketService", "Utilisateur B", "SessionController"],
    messages: ["ouvre contacts", "GET /chat/contacts", "startConversation()", "save conversation", "send message", "persist Message", "emit socket event", "message reçu", "createSession()", "notify participants"],
  },
  6: {
    title: "Séquence Sprint 6 - Déploiement et validation",
    lifelines: ["Développeur", "Docker Compose", "Backend API", "PostgreSQL", "Frontend Angular", "Administrateur"],
    messages: ["docker compose up", "build images", "run migrations/seeder", "connect DB", "serve Angular", "health check API", "login admin", "validate protected routes", "review logs"],
  },
};

function textWidth(text, min = 110) {
  return Math.max(min, Math.min(240, text.length * 7 + 30));
}

function addNameLabel(parentId, modelId, name, left, top, width) {
  const comp = id("nameComp");
  const label = id("label");
  return {
    comp,
    subViews: [{
      _type: "UMLNameCompartmentView",
      _id: comp,
      _parent: ref(parentId),
      model: ref(modelId),
      subViews: [{
        _type: "LabelView",
        _id: label,
        _parent: ref(comp),
        font: "Arial;13;1",
        left: left + 8,
        top: top + 8,
        width: width - 16,
        height: 16,
        text: name,
      }],
      font: "Arial;13;0",
      left,
      top,
      width,
      height: 28,
      nameLabel: ref(label),
    }],
  };
}

function attr(name, parent) {
  const [n, t = ""] = name.split(":").map((s) => s.trim());
  return { _type: "UMLAttribute", _id: id("attr"), _parent: ref(parent), name: n, type: t };
}

function op(name, parent) {
  return { _type: "UMLOperation", _id: id("op"), _parent: ref(parent), name: name.replace(/\(\)$/, "") };
}

function classModel(name, parentId) {
  const cid = id("class");
  const def = classDefs[name];
  return {
    id: cid,
    element: {
      _type: "UMLClass",
      _id: cid,
      _parent: ref(parentId),
      name,
      attributes: def.attrs.map((a) => attr(a, cid)),
      operations: def.ops.map((o) => op(o, cid)),
    },
  };
}

function classView(diagramId, classItem, name, left, top) {
  const modelId = classItem.id;
  const viewId = id("classView");
  const width = 250;
  const height = 88 + classDefs[name].attrs.length * 17 + Math.max(1, classDefs[name].ops.length) * 17;
  const nameData = addNameLabel(viewId, modelId, name, left, top, width);
  const attrComp = id("attrComp");
  const opComp = id("opComp");
  const attrLabels = classItem.element.attributes.map((a, i) => ({
    _type: "UMLAttributeView",
    _id: id("attrView"),
    _parent: ref(attrComp),
    model: ref(a._id),
    font: "Arial;12;0",
    left: left + 10,
    top: top + 38 + i * 17,
    width: width - 20,
    height: 15,
    text: `- ${a.name}${a.type ? `: ${a.type}` : ""}`,
  }));
  const opTop = top + 44 + classItem.element.attributes.length * 17;
  const opLabels = classItem.element.operations.map((o, i) => ({
    _type: "UMLOperationView",
    _id: id("opView"),
    _parent: ref(opComp),
    model: ref(o._id),
    font: "Arial;12;0",
    left: left + 10,
    top: opTop + i * 17,
    width: width - 20,
    height: 15,
    text: `+ ${o.name}()`,
  }));
  return {
    _type: "UMLClassView",
    _id: viewId,
    _parent: ref(diagramId),
    model: ref(modelId),
    subViews: [
      ...nameData.subViews,
      {
        _type: "UMLAttributeCompartmentView",
        _id: attrComp,
        _parent: ref(viewId),
        model: ref(modelId),
        subViews: attrLabels,
        font: "Arial;12;0",
        left: left + 1,
        top: top + 32,
        width: width - 2,
        height: classItem.element.attributes.length * 17 + 8,
      },
      {
        _type: "UMLOperationCompartmentView",
        _id: opComp,
        _parent: ref(viewId),
        model: ref(modelId),
        subViews: opLabels,
        font: "Arial;12;0",
        left: left + 1,
        top: opTop - 2,
        width: width - 2,
        height: Math.max(1, classItem.element.operations.length) * 17 + 8,
      },
    ],
    font: "Arial;13;0",
    containerChangeable: true,
    left,
    top,
    width,
    height,
    nameCompartment: ref(nameData.comp),
    attributeCompartment: ref(attrComp),
    operationCompartment: ref(opComp),
    fillColor: "#F8FAFC",
    lineColor: "#334155",
    suppressAttributes: false,
    suppressOperations: false,
  };
}

function assocElement(parentId, fromId, toId, label, m1, m2) {
  const aid = id("assoc");
  return {
    id: aid,
    element: {
      _type: "UMLAssociation",
      _id: aid,
      _parent: ref(parentId),
      name: label,
      end1: { _type: "UMLAssociationEnd", _id: id("end"), _parent: ref(aid), reference: ref(fromId), multiplicity: m1, navigable: false },
      end2: { _type: "UMLAssociationEnd", _id: id("end"), _parent: ref(aid), reference: ref(toId), multiplicity: m2, navigable: true },
    },
  };
}

function assocView(diagramId, assocId, fromView, toView) {
  return {
    _type: "UMLAssociationView",
    _id: id("assocView"),
    _parent: ref(diagramId),
    model: ref(assocId),
    tail: ref(fromView._id),
    head: ref(toView._id),
    points: `(${fromView.left + fromView.width},${fromView.top + fromView.height / 2});(${toView.left},${toView.top + toView.height / 2})`,
    lineColor: "#64748B",
  };
}

function buildClassProject(title, classNames) {
  counter = 0;
  const projectId = id("project");
  const modelId = id("model");
  const diagramId = id("classDiagram");
  const classItems = classNames.map((name) => classModel(name, modelId));
  const classByName = Object.fromEntries(classItems.map((x) => [x.element.name, x]));
  const cols = classNames.length > 12 ? 4 : 3;
  const views = {};
  const ownedViews = [];
  classNames.forEach((name, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const view = classView(diagramId, classByName[name], name, 70 + col * 320, 70 + row * 300);
    views[name] = view;
    ownedViews.push(view);
  });
  const assocs = [];
  assocDefs.forEach(([a, b, m1, m2, label]) => {
    if (classByName[a] && classByName[b]) {
      const assoc = assocElement(modelId, classByName[a].id, classByName[b].id, label, m1, m2);
      assocs.push(assoc.element);
      ownedViews.push(assocView(diagramId, assoc.id, views[a], views[b]));
    }
  });
  return {
    _type: "Project",
    _id: projectId,
    name: title,
    ownedElements: [{
      _type: "UMLModel",
      _id: modelId,
      _parent: ref(projectId),
      name: "GOSPORT - Modèle métier",
      ownedElements: [{
        _type: "UMLClassDiagram",
        _id: diagramId,
        _parent: ref(modelId),
        name: title,
        defaultDiagram: true,
        ownedViews,
      }, ...classItems.map((x) => x.element), ...assocs],
    }],
  };
}

function actorModel(name, parentId) {
  const actorId = id("actor");
  return { id: actorId, element: { _type: "UMLActor", _id: actorId, _parent: ref(parentId), name, ownedElements: [] } };
}

function useCaseModel(name, parentId) {
  const ucId = id("usecase");
  return { id: ucId, element: { _type: "UMLUseCase", _id: ucId, _parent: ref(parentId), name } };
}

function actorView(diagramId, modelId, name, left, top) {
  const viewId = id("actorView");
  const nameData = addNameLabel(viewId, modelId, name, left - 20, top + 58, textWidth(name, 90));
  return {
    _type: "UMLActorView",
    _id: viewId,
    _parent: ref(diagramId),
    model: ref(modelId),
    subViews: nameData.subViews,
    font: "Arial;13;0",
    left,
    top,
    width: 72,
    height: 88,
    nameCompartment: ref(nameData.comp),
  };
}

function useCaseView(diagramId, modelId, name, left, top) {
  const viewId = id("useCaseView");
  const width = textWidth(name, 170);
  const nameData = addNameLabel(viewId, modelId, name, left + 5, top + 18, width - 10);
  return {
    _type: "UMLUseCaseView",
    _id: viewId,
    _parent: ref(diagramId),
    model: ref(modelId),
    subViews: nameData.subViews,
    font: "Arial;13;0",
    left,
    top,
    width,
    height: 58,
    nameCompartment: ref(nameData.comp),
    fillColor: "#EFF6FF",
    lineColor: "#2563EB",
  };
}

function buildUseCaseProject(title, spec) {
  counter = 0;
  const projectId = id("project");
  const modelId = id("model");
  const diagramId = id("useCaseDiagram");
  const subjectId = id("subject");
  const actors = spec.actors.map((a) => actorModel(a, modelId));
  const cases = spec.cases.map(([name]) => useCaseModel(name, modelId));
  const actorByName = Object.fromEntries(actors.map((x) => [x.element.name, x]));
  const caseByName = Object.fromEntries(cases.map((x) => [x.element.name, x]));
  const ownedViews = [{
    _type: "UMLUseCaseSubjectView",
    _id: id("subjectView"),
    _parent: ref(diagramId),
    model: ref(subjectId),
    left: 250,
    top: 40,
    width: 760,
    height: Math.max(560, Math.ceil(spec.cases.length / 2) * 95 + 80),
    font: "Arial;13;1",
  }];
  actors.forEach((a, i) => ownedViews.push(actorView(diagramId, a.id, a.element.name, i % 2 === 0 ? 70 : 1070, 90 + Math.floor(i / 2) * 145)));
  cases.forEach((uc, i) => ownedViews.push(useCaseView(diagramId, uc.id, uc.element.name, 315 + (i % 2) * 330, 90 + Math.floor(i / 2) * 88)));
  const associations = [];
  spec.cases.forEach(([caseName, actorNames]) => {
    actorNames.forEach((actorName) => {
      const actor = actorByName[actorName];
      const uc = caseByName[caseName];
      if (!actor || !uc) return;
      const assoc = assocElement(modelId, actor.id, uc.id, "", "", "");
      associations.push(assoc.element);
      const aView = ownedViews.find((v) => v.model && v.model.$ref === actor.id);
      const ucView = ownedViews.find((v) => v.model && v.model.$ref === uc.id);
      ownedViews.push(assocView(diagramId, assoc.id, aView, ucView));
    });
  });
  return {
    _type: "Project",
    _id: projectId,
    name: title,
    ownedElements: [{
      _type: "UMLModel",
      _id: modelId,
      _parent: ref(projectId),
      name: "GOSPORT - Besoins fonctionnels",
      ownedElements: [{
        _type: "UMLUseCaseDiagram",
        _id: diagramId,
        _parent: ref(modelId),
        name: title,
        defaultDiagram: true,
        ownedViews,
      }, { _type: "UMLUseCaseSubject", _id: subjectId, _parent: ref(modelId), name: "Plateforme GOSPORT" }, ...actors.map((x) => x.element), ...cases.map((x) => x.element), ...associations],
    }],
  };
}

function buildSequenceProject(title, spec) {
  counter = 0;
  const projectId = id("project");
  const modelId = id("model");
  const interactionId = id("interaction");
  const diagramId = id("seqDiagram");
  const lifelines = spec.lifelines.map((name) => ({ _type: "UMLLifeline", _id: id("life"), _parent: ref(interactionId), name }));
  const messages = spec.messages.map((name, i) => ({
    _type: "UMLMessage",
    _id: id("msg"),
    _parent: ref(interactionId),
    name,
    source: ref(lifelines[Math.min(i % (lifelines.length - 1), lifelines.length - 1)]._id),
    target: ref(lifelines[Math.min((i % (lifelines.length - 1)) + 1, lifelines.length - 1)]._id),
    messageSort: i % 3 === 2 ? "reply" : "synchCall",
  }));
  const ownedViews = [];
  lifelines.forEach((life, i) => {
    const x = 70 + i * 180;
    const viewId = id("lifeView");
    const nameData = addNameLabel(viewId, life._id, life.name, x, 55, 140);
    ownedViews.push({
      _type: "UMLSeqLifelineView",
      _id: viewId,
      _parent: ref(diagramId),
      model: ref(life._id),
      subViews: nameData.subViews,
      left: x,
      top: 55,
      width: 140,
      height: 520,
      nameCompartment: ref(nameData.comp),
      fillColor: "#F8FAFC",
      lineColor: "#334155",
      font: "Arial;13;0",
    });
  });
  messages.forEach((msg, i) => {
    const from = lifelines.findIndex((l) => l._id === msg.source.$ref);
    const to = lifelines.findIndex((l) => l._id === msg.target.$ref);
    const y = 125 + i * 38;
    ownedViews.push({
      _type: "UMLSeqMessageView",
      _id: id("msgView"),
      _parent: ref(diagramId),
      model: ref(msg._id),
      tail: ref(ownedViews[from]._id),
      head: ref(ownedViews[to]._id),
      points: `(${140 + from * 180},${y});(${140 + to * 180},${y})`,
      font: "Arial;12;0",
      lineColor: "#475569",
    });
  });
  return {
    _type: "Project",
    _id: projectId,
    name: title,
    ownedElements: [{
      _type: "UMLModel",
      _id: modelId,
      _parent: ref(projectId),
      name: "GOSPORT - Scénarios dynamiques",
      ownedElements: [{
        _type: "UMLInteraction",
        _id: interactionId,
        _parent: ref(modelId),
        name: spec.title,
        participants: lifelines,
        messages,
      }, {
        _type: "UMLSequenceDiagram",
        _id: diagramId,
        _parent: ref(modelId),
        name: title,
        defaultDiagram: true,
        ownedViews,
      }],
    }],
  };
}

const manualUseCases = {
  global: {
    actors: ["Visiteur", "Utilisateur", "Athlete", "Coach", "Nutritionniste", "Administrateur", "Service IA"],
    cases: [
      { name: "S'authentifier", actors: ["Visiteur", "Utilisateur"] },
      { name: "Verifier identifiants", actors: [] },
      { name: "Generer token JWT", actors: [] },
      { name: "Completer profil", actors: ["Utilisateur"] },
      { name: "Decouvrir specialistes", actors: ["Athlete"] },
      { name: "Filtrer specialistes", actors: [] },
      { name: "Gerer demandes de relation", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Notifier statut demande", actors: [] },
      { name: "Gerer programmes entrainement", actors: ["Coach"] },
      { name: "Executer seance", actors: ["Athlete"] },
      { name: "Journaliser performance", actors: [] },
      { name: "Gerer nutrition", actors: ["Nutritionniste", "Athlete"] },
      { name: "Analyser repas par IA", actors: ["Service IA"] },
      { name: "Gerer messagerie", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Gerer agenda sessions", actors: ["Athlete", "Coach"] },
      { name: "Consulter tableaux de bord", actors: ["Athlete", "Coach", "Nutritionniste", "Administrateur"] },
      { name: "Administrer utilisateurs", actors: ["Administrateur"] },
    ],
    includes: [["S'authentifier", "Verifier identifiants"], ["S'authentifier", "Generer token JWT"], ["Decouvrir specialistes", "Filtrer specialistes"], ["Gerer demandes de relation", "Notifier statut demande"], ["Executer seance", "Journaliser performance"], ["Administrer utilisateurs", "Consulter tableaux de bord"]],
    extends: [["Completer profil", "S'authentifier"], ["Analyser repas par IA", "Gerer nutrition"], ["Gerer agenda sessions", "Gerer messagerie"]],
  },
  1: {
    actors: ["Visiteur", "Utilisateur", "Provider OAuth", "Service Email"],
    cases: [
      { name: "S'inscrire", actors: ["Visiteur"] },
      { name: "Valider formulaire", actors: [] },
      { name: "Envoyer code verification", actors: ["Service Email"] },
      { name: "Verifier email", actors: ["Utilisateur"] },
      { name: "Se connecter", actors: ["Utilisateur"] },
      { name: "Verifier mot de passe", actors: [] },
      { name: "Connexion OAuth", actors: ["Provider OAuth"] },
      { name: "Generer JWT", actors: [] },
      { name: "Reinitialiser mot de passe", actors: ["Utilisateur", "Service Email"] },
      { name: "Completer onboarding", actors: ["Utilisateur"] },
      { name: "Acceder espace protege", actors: ["Utilisateur"] },
    ],
    includes: [["S'inscrire", "Valider formulaire"], ["S'inscrire", "Envoyer code verification"], ["Verifier email", "Valider formulaire"], ["Se connecter", "Verifier mot de passe"], ["Se connecter", "Generer JWT"], ["Acceder espace protege", "Generer JWT"], ["Reinitialiser mot de passe", "Envoyer code verification"]],
    extends: [["Connexion OAuth", "Se connecter"], ["Completer onboarding", "Verifier email"], ["Reinitialiser mot de passe", "Se connecter"]],
  },
  2: {
    actors: ["Athlete", "Coach", "Nutritionniste", "Service Notification"],
    cases: [
      { name: "Consulter marketplace", actors: ["Athlete"] },
      { name: "Rechercher coach", actors: ["Athlete"] },
      { name: "Rechercher nutritionniste", actors: ["Athlete"] },
      { name: "Filtrer par specialite", actors: [] },
      { name: "Envoyer demande coaching", actors: ["Athlete"] },
      { name: "Envoyer demande nutrition", actors: ["Athlete"] },
      { name: "Traiter demande", actors: ["Coach", "Nutritionniste"] },
      { name: "Accepter demande", actors: [] },
      { name: "Refuser demande", actors: [] },
      { name: "Gerer clients", actors: ["Coach", "Nutritionniste"] },
      { name: "Rompre relation", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Notifier utilisateur", actors: ["Service Notification"] },
    ],
    includes: [["Consulter marketplace", "Filtrer par specialite"], ["Rechercher coach", "Filtrer par specialite"], ["Rechercher nutritionniste", "Filtrer par specialite"], ["Envoyer demande coaching", "Notifier utilisateur"], ["Envoyer demande nutrition", "Notifier utilisateur"], ["Traiter demande", "Notifier utilisateur"], ["Rompre relation", "Notifier utilisateur"]],
    extends: [["Rechercher coach", "Consulter marketplace"], ["Rechercher nutritionniste", "Consulter marketplace"], ["Accepter demande", "Traiter demande"], ["Refuser demande", "Traiter demande"], ["Gerer clients", "Accepter demande"]],
  },
  3: {
    actors: ["Coach", "Athlete", "Catalogue Exercices", "Service Suivi", "Service Notification"],
    cases: [
      { name: "Consulter catalogue exercices", actors: ["Coach", "Athlete", "Catalogue Exercices"] },
      { name: "Rechercher exercice", actors: [] },
      { name: "Creer programme", actors: ["Coach"] },
      { name: "Composer jour entrainement", actors: [] },
      { name: "Ajouter exercice au programme", actors: [] },
      { name: "Assigner programme", actors: ["Coach"] },
      { name: "Notifier utilisateur", actors: ["Service Notification"] },
      { name: "Accepter programme", actors: ["Athlete"] },
      { name: "Consulter seance du jour", actors: ["Athlete"] },
      { name: "Demarrer workout player", actors: ["Athlete"] },
      { name: "Journaliser series", actors: ["Athlete", "Service Suivi"] },
      { name: "Consulter historique", actors: ["Athlete", "Coach"] },
    ],
    includes: [["Consulter catalogue exercices", "Rechercher exercice"], ["Creer programme", "Composer jour entrainement"], ["Composer jour entrainement", "Ajouter exercice au programme"], ["Assigner programme", "Notifier utilisateur"], ["Demarrer workout player", "Journaliser series"], ["Consulter historique", "Journaliser series"]],
    extends: [["Assigner programme", "Creer programme"], ["Accepter programme", "Assigner programme"], ["Demarrer workout player", "Consulter seance du jour"]],
  },
  4: {
    actors: ["Athlete", "Nutritionniste", "Service IA", "Service Analyse"],
    cases: [
      { name: "Configurer profil alimentaire", actors: ["Athlete", "Nutritionniste"] },
      { name: "Calculer besoins nutritionnels", actors: [] },
      { name: "Creer plan dietetique", actors: ["Nutritionniste"] },
      { name: "Composer jour alimentaire", actors: [] },
      { name: "Ajouter repas", actors: [] },
      { name: "Assigner plan", actors: ["Nutritionniste"] },
      { name: "Consulter plan actif", actors: ["Athlete"] },
      { name: "Journaliser repas", actors: ["Athlete"] },
      { name: "Scanner repas par IA", actors: ["Athlete", "Service IA"] },
      { name: "Calculer conformite", actors: ["Service Analyse"] },
      { name: "Suivre objectifs sante", actors: ["Athlete", "Nutritionniste"] },
    ],
    includes: [["Configurer profil alimentaire", "Calculer besoins nutritionnels"], ["Creer plan dietetique", "Composer jour alimentaire"], ["Composer jour alimentaire", "Ajouter repas"], ["Assigner plan", "Consulter plan actif"], ["Journaliser repas", "Calculer conformite"], ["Suivre objectifs sante", "Calculer conformite"]],
    extends: [["Scanner repas par IA", "Journaliser repas"], ["Assigner plan", "Creer plan dietetique"]],
  },
  5: {
    actors: ["Athlete", "Coach", "Nutritionniste", "Socket.IO", "Copilote IA"],
    cases: [
      { name: "Consulter contacts", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Demarrer conversation", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Envoyer message", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Diffuser message temps reel", actors: ["Socket.IO"] },
      { name: "Marquer message lu", actors: [] },
      { name: "Recevoir notification", actors: ["Athlete", "Coach", "Nutritionniste"] },
      { name: "Creer session agenda", actors: ["Athlete", "Coach"] },
      { name: "Modifier session", actors: ["Athlete", "Coach"] },
      { name: "Annuler session", actors: ["Athlete", "Coach"] },
      { name: "Demander assistance IA", actors: ["Athlete", "Coach", "Nutritionniste", "Copilote IA"] },
    ],
    includes: [["Demarrer conversation", "Consulter contacts"], ["Envoyer message", "Diffuser message temps reel"], ["Envoyer message", "Recevoir notification"], ["Creer session agenda", "Recevoir notification"], ["Modifier session", "Recevoir notification"], ["Annuler session", "Recevoir notification"]],
    extends: [["Marquer message lu", "Envoyer message"], ["Demander assistance IA", "Envoyer message"], ["Modifier session", "Creer session agenda"], ["Annuler session", "Creer session agenda"]],
  },
  6: {
    actors: ["Developpeur", "Administrateur", "Docker", "PostgreSQL", "API Backend"],
    cases: [
      { name: "Configurer environnement", actors: ["Developpeur"] },
      { name: "Construire images Docker", actors: ["Developpeur", "Docker"] },
      { name: "Deployer application", actors: ["Developpeur", "Docker"] },
      { name: "Initialiser base donnees", actors: ["PostgreSQL"] },
      { name: "Executer migrations/seeder", actors: [] },
      { name: "Verifier API securisee", actors: ["Administrateur", "API Backend"] },
      { name: "Controler JWT et CORS", actors: [] },
      { name: "Surveiller logs", actors: ["Administrateur"] },
      { name: "Valider tests regression", actors: ["Developpeur"] },
    ],
    includes: [["Deployer application", "Construire images Docker"], ["Deployer application", "Initialiser base donnees"], ["Initialiser base donnees", "Executer migrations/seeder"], ["Verifier API securisee", "Controler JWT et CORS"], ["Valider tests regression", "Verifier API securisee"]],
    extends: [["Surveiller logs", "Deployer application"]],
  },
};

const correctedSequences = {
  1: {
    title: "Sequence Sprint 1 - Authentification et onboarding",
    lifelines: ["Utilisateur", "Angular AuthService", "AuthController", "UserRepository", "EmailService", "JWT"],
    messages: [
      ["Utilisateur", "Angular AuthService", "submitSignup(form)"],
      ["Angular AuthService", "AuthController", "POST /auth/signup"],
      ["AuthController", "UserRepository", "findByEmail(email)"],
      ["UserRepository", "AuthController", "email disponible", "reply"],
      ["AuthController", "UserRepository", "save(user + code)"],
      ["AuthController", "EmailService", "sendVerificationCode(email, code)"],
      ["Utilisateur", "Angular AuthService", "submitVerification(code)"],
      ["Angular AuthService", "AuthController", "POST /auth/verify-email"],
      ["AuthController", "UserRepository", "markVerified(userId)"],
      ["Utilisateur", "Angular AuthService", "submitLogin(credentials)"],
      ["Angular AuthService", "AuthController", "POST /auth/login"],
      ["AuthController", "UserRepository", "load user by email"],
      ["AuthController", "JWT", "sign({id, role})"],
      ["AuthController", "Angular AuthService", "token + user", "reply"],
    ],
  },
  2: {
    title: "Sequence Sprint 2 - Demande de mise en relation",
    lifelines: ["Athlete", "Marketplace UI", "CoachController", "CoachingRequestController", "CoachingRequestRepository", "NotificationService", "Coach"],
    messages: [
      ["Athlete", "Marketplace UI", "ouvrir marketplace"],
      ["Marketplace UI", "CoachController", "GET /coaches/public"],
      ["CoachController", "Marketplace UI", "liste coachs", "reply"],
      ["Athlete", "Marketplace UI", "envoyer demande"],
      ["Marketplace UI", "CoachingRequestController", "POST /coaching-requests"],
      ["CoachingRequestController", "CoachingRequestRepository", "check existing pending"],
      ["CoachingRequestController", "CoachingRequestRepository", "save pending request"],
      ["CoachingRequestController", "NotificationService", "notify coach"],
      ["NotificationService", "Coach", "nouvelle demande"],
      ["Coach", "CoachingRequestController", "PATCH /requests/:id accept"],
      ["CoachingRequestController", "CoachingRequestRepository", "update status accepted"],
      ["CoachingRequestController", "NotificationService", "notify athlete"],
    ],
  },
  3: {
    title: "Sequence Sprint 3 - Programme et workout player",
    lifelines: ["Coach", "Program Builder", "ProgramController", "ProgramRepository", "Athlete", "Workout Player", "WorkoutLogController"],
    messages: [
      ["Coach", "Program Builder", "composer programme"],
      ["Program Builder", "ProgramController", "POST /programs"],
      ["ProgramController", "ProgramRepository", "save Program"],
      ["ProgramController", "ProgramRepository", "save ProgramDay + ProgramExercise"],
      ["Coach", "ProgramController", "POST /programs/:id/assign"],
      ["ProgramController", "Athlete", "programme assigne"],
      ["Athlete", "ProgramController", "PATCH /programs/:id/accept"],
      ["Athlete", "Workout Player", "ouvrir seance du jour"],
      ["Workout Player", "ProgramController", "GET /programs/athlete/:userId/today"],
      ["Athlete", "Workout Player", "demarrer seance"],
      ["Workout Player", "WorkoutLogController", "POST /workout-logs/:id/start"],
      ["Workout Player", "WorkoutLogController", "POST /workout-logs/:id/exercises"],
      ["WorkoutLogController", "Workout Player", "historique mis a jour", "reply"],
    ],
  },
  4: {
    title: "Sequence Sprint 4 - Nutrition et journal alimentaire",
    lifelines: ["Nutritionniste", "Diet Builder", "DietController", "DietRepository", "Athlete", "AIController", "MealLogRepository"],
    messages: [
      ["Nutritionniste", "Diet Builder", "creer plan"],
      ["Diet Builder", "DietController", "POST /nutrition/plans"],
      ["DietController", "DietRepository", "save DietPlan"],
      ["Diet Builder", "DietController", "PUT /plans/:id/build"],
      ["DietController", "DietRepository", "save DietDay + Meal"],
      ["Athlete", "DietController", "GET /athletes/:id/active-plan"],
      ["Athlete", "AIController", "POST /ai/analyze-food(image)"],
      ["AIController", "Athlete", "aliments + macros", "reply"],
      ["Athlete", "DietController", "POST /athletes/:id/log"],
      ["DietController", "MealLogRepository", "save MealLog"],
      ["DietController", "DietRepository", "compute compliance"],
      ["DietController", "Athlete", "resume nutritionnel", "reply"],
    ],
  },
  5: {
    title: "Sequence Sprint 5 - Messagerie et agenda",
    lifelines: ["Utilisateur A", "Messaging UI", "ChatController", "ConversationRepository", "SocketService", "Utilisateur B", "SessionController"],
    messages: [
      ["Utilisateur A", "Messaging UI", "ouvrir messagerie"],
      ["Messaging UI", "ChatController", "GET /chat/contacts"],
      ["ChatController", "Messaging UI", "contacts autorises", "reply"],
      ["Utilisateur A", "Messaging UI", "envoyer message"],
      ["Messaging UI", "ChatController", "POST /chat/conversations"],
      ["ChatController", "ConversationRepository", "find or create conversation"],
      ["ChatController", "ConversationRepository", "save Message"],
      ["ChatController", "SocketService", "emit message:new"],
      ["SocketService", "Utilisateur B", "message temps reel"],
      ["Utilisateur A", "SessionController", "POST /sessions"],
      ["SessionController", "SocketService", "notify session created"],
      ["SocketService", "Utilisateur B", "notification agenda"],
    ],
  },
  6: {
    title: "Sequence Sprint 6 - Deploiement et validation",
    lifelines: ["Developpeur", "Docker Compose", "Backend API", "PostgreSQL", "Frontend Angular", "Administrateur"],
    messages: [
      ["Developpeur", "Docker Compose", "docker compose up --build"],
      ["Docker Compose", "Backend API", "build/start container"],
      ["Docker Compose", "PostgreSQL", "start database"],
      ["Backend API", "PostgreSQL", "connect datasource"],
      ["Backend API", "PostgreSQL", "run seeder"],
      ["Docker Compose", "Frontend Angular", "serve nginx/angular"],
      ["Administrateur", "Backend API", "health check API"],
      ["Administrateur", "Backend API", "login admin"],
      ["Backend API", "Administrateur", "JWT admin", "reply"],
      ["Administrateur", "Backend API", "test protected routes"],
    ],
  },
};

function manualRelationElement(parentId, type, sourceId, targetId) {
  const relId = id(type === "include" ? "include" : "extend");
  return {
    id: relId,
    element: {
      _type: type === "include" ? "UMLInclude" : "UMLExtend",
      _id: relId,
      _parent: ref(parentId),
      source: ref(sourceId),
      target: ref(targetId),
    },
  };
}

function manualRelationView(diagramId, relationId, fromView, toView, type) {
  const midX = (fromView.left + toView.left) / 2 + 80;
  const midY = (fromView.top + toView.top) / 2 + 5;
  const labelId = id("relLabel");
  return {
    _type: type === "include" ? "UMLIncludeView" : "UMLExtendView",
    _id: id(type === "include" ? "includeView" : "extendView"),
    _parent: ref(diagramId),
    model: ref(relationId),
    tail: ref(fromView._id),
    head: ref(toView._id),
    points: `(${fromView.left + fromView.width / 2},${fromView.top + fromView.height / 2});(${toView.left + toView.width / 2},${toView.top + toView.height / 2})`,
    lineColor: type === "include" ? "#16A34A" : "#9333EA",
    lineStyle: 1,
    subViews: [{
      _type: "LabelView",
      _id: labelId,
      _parent: ref(relationId),
      font: "Arial;12;2",
      left: midX,
      top: midY,
      width: 80,
      height: 16,
      text: type === "include" ? "<<include>>" : "<<extend>>",
    }],
  };
}

function buildManualUseCaseProject(title, spec) {
  counter = 0;
  const projectId = id("project");
  const modelId = id("model");
  const diagramId = id("useCaseDiagram");
  const subjectId = id("subject");
  const actors = spec.actors.map((a) => actorModel(a, modelId));
  const allCases = [...spec.cases, ...(spec.extraCases || [])].filter((c, index, arr) => arr.findIndex((x) => x.name === c.name) === index);
  const cases = allCases.map((c) => useCaseModel(c.name, modelId));
  const actorByName = Object.fromEntries(actors.map((x) => [x.element.name, x]));
  const caseByName = Object.fromEntries(cases.map((x) => [x.element.name, x]));
  const subjectHeight = Math.max(650, Math.ceil(allCases.length / 2) * 88 + 100);
  const ownedViews = [{
    _type: "UMLUseCaseSubjectView",
    _id: id("subjectView"),
    _parent: ref(diagramId),
    model: ref(subjectId),
    left: 250,
    top: 35,
    width: 830,
    height: subjectHeight,
    font: "Arial;13;1",
    lineColor: "#334155",
  }];
  actors.forEach((a, i) => ownedViews.push(actorView(diagramId, a.id, a.element.name, i % 2 === 0 ? 70 : 1135, 90 + Math.floor(i / 2) * 135)));
  cases.forEach((uc, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    ownedViews.push(useCaseView(diagramId, uc.id, uc.element.name, 315 + col * 380, 85 + row * 88));
  });
  const elements = [];
  allCases.forEach((c) => {
    c.actors.forEach((actorName) => {
      const actor = actorByName[actorName];
      const uc = caseByName[c.name];
      if (!actor || !uc) return;
      const assoc = assocElement(modelId, actor.id, uc.id, "", "", "");
      elements.push(assoc.element);
      const aView = ownedViews.find((v) => v.model && v.model.$ref === actor.id);
      const ucView = ownedViews.find((v) => v.model && v.model.$ref === uc.id);
      ownedViews.push(assocView(diagramId, assoc.id, aView, ucView));
    });
  });
  (spec.includes || []).forEach(([from, to]) => {
    if (!caseByName[from] || !caseByName[to]) return;
    const rel = manualRelationElement(modelId, "include", caseByName[from].id, caseByName[to].id);
    elements.push(rel.element);
    ownedViews.push(manualRelationView(diagramId, rel.id, ownedViews.find((v) => v.model && v.model.$ref === caseByName[from].id), ownedViews.find((v) => v.model && v.model.$ref === caseByName[to].id), "include"));
  });
  (spec.extends || []).forEach(([from, to]) => {
    if (!caseByName[from] || !caseByName[to]) return;
    const rel = manualRelationElement(modelId, "extend", caseByName[from].id, caseByName[to].id);
    elements.push(rel.element);
    ownedViews.push(manualRelationView(diagramId, rel.id, ownedViews.find((v) => v.model && v.model.$ref === caseByName[from].id), ownedViews.find((v) => v.model && v.model.$ref === caseByName[to].id), "extend"));
  });
  return {
    _type: "Project",
    _id: projectId,
    name: title,
    ownedElements: [{
      _type: "UMLModel",
      _id: modelId,
      _parent: ref(projectId),
      name: "GOSPORT - Use cases valides",
      ownedElements: [{
        _type: "UMLUseCaseDiagram",
        _id: diagramId,
        _parent: ref(modelId),
        name: title,
        defaultDiagram: true,
        ownedViews,
      }, { _type: "UMLUseCaseSubject", _id: subjectId, _parent: ref(modelId), name: "Plateforme GOSPORT" }, ...actors.map((x) => x.element), ...cases.map((x) => x.element), ...elements],
    }],
  };
}

function buildCorrectSequenceProject(title, spec) {
  counter = 0;
  const projectId = id("project");
  const modelId = id("model");
  const interactionId = id("interaction");
  const diagramId = id("seqDiagram");
  const lifelines = spec.lifelines.map((name) => ({ _type: "UMLLifeline", _id: id("life"), _parent: ref(interactionId), name }));
  const lifeByName = Object.fromEntries(lifelines.map((life) => [life.name, life]));
  const messages = spec.messages.map(([from, to, name, sort]) => ({
    _type: "UMLMessage",
    _id: id("msg"),
    _parent: ref(interactionId),
    name,
    source: ref(lifeByName[from]._id),
    target: ref(lifeByName[to]._id),
    messageSort: sort === "reply" ? "reply" : "synchCall",
  }));
  const ownedViews = [];
  lifelines.forEach((life, i) => {
    const x = 60 + i * 175;
    const viewId = id("lifeView");
    const nameData = addNameLabel(viewId, life._id, life.name, x, 55, 140);
    ownedViews.push({
      _type: "UMLSeqLifelineView",
      _id: viewId,
      _parent: ref(diagramId),
      model: ref(life._id),
      subViews: nameData.subViews,
      left: x,
      top: 55,
      width: 140,
      height: Math.max(560, 125 + messages.length * 38),
      nameCompartment: ref(nameData.comp),
      fillColor: "#F8FAFC",
      lineColor: "#334155",
      font: "Arial;13;0",
    });
  });
  messages.forEach((msg, i) => {
    const from = lifelines.findIndex((l) => l._id === msg.source.$ref);
    const to = lifelines.findIndex((l) => l._id === msg.target.$ref);
    const y = 125 + i * 38;
    ownedViews.push({
      _type: "UMLSeqMessageView",
      _id: id("msgView"),
      _parent: ref(diagramId),
      model: ref(msg._id),
      tail: ref(ownedViews[from]._id),
      head: ref(ownedViews[to]._id),
      points: `(${130 + from * 175},${y});(${130 + to * 175},${y})`,
      font: "Arial;12;0",
      lineColor: msg.messageSort === "reply" ? "#64748B" : "#2563EB",
      lineStyle: msg.messageSort === "reply" ? 1 : 0,
    });
  });
  return {
    _type: "Project",
    _id: projectId,
    name: title,
    ownedElements: [{
      _type: "UMLModel",
      _id: modelId,
      _parent: ref(projectId),
      name: "GOSPORT - Sequences corrigees",
      ownedElements: [{
        _type: "UMLInteraction",
        _id: interactionId,
        _parent: ref(modelId),
        name: spec.title,
        participants: lifelines,
        messages,
      }, {
        _type: "UMLSequenceDiagram",
        _id: diagramId,
        _parent: ref(modelId),
        name: title,
        defaultDiagram: true,
        ownedViews,
      }],
    }],
  };
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(data, null, "\t") + "\n", "utf8");
}

writeJson("global classe.mdj", buildClassProject("Diagramme de classes global - GOSPORT", sprintClasses.global));
writeJson("global use case .mdj", buildManualUseCaseProject("Diagramme de cas d'utilisation global - GOSPORT", manualUseCases.global));

for (let s = 1; s <= 6; s++) {
  writeJson(`sprint ${s} classe .mdj`, buildClassProject(`Diagramme de classes - Sprint ${s}`, sprintClasses[s]));
  writeJson(`sprint ${s} use case .mdj`, buildManualUseCaseProject(`Diagramme de cas d'utilisation - Sprint ${s}`, manualUseCases[s]));
  writeJson(s === 1 || s === 4 || s === 5 || s === 6 ? `sprint ${s} sequence .mdj` : `sprint ${s} sequence.mdj`, buildCorrectSequenceProject(`Diagramme de sequence - Sprint ${s}`, correctedSequences[s]));
}

console.log("StarUML MDJ diagrams regenerated:", 20);

module.exports = { classDefs, assocDefs, sprintClasses, manualUseCases };
