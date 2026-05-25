const fs = require('fs');

const esc = (value) => String(value)
  .replace(/\\/g, '\\textbackslash{}')
  .replace(/&/g, '\\&')
  .replace(/%/g, '\\%')
  .replace(/\$/g, '\\$')
  .replace(/#/g, '\\#')
  .replace(/_/g, '\\_')
  .replace(/\{/g, '\\{')
  .replace(/\}/g, '\\}')
  .replace(/~/g, '\\textasciitilde{}')
  .replace(/\^/g, '\\textasciicircum{}');

const txt = (value) => `\\texttt{${esc(value)}}`;

const endpoints = [
  ['POST', '/api/auth/signup', 'Tous', 'Créer un compte utilisateur avec email, mot de passe et rôle initial.'],
  ['POST', '/api/auth/login', 'Tous', 'Authentifier un utilisateur et retourner un jeton JWT exploitable par les clients web et mobile.'],
  ['POST', '/api/auth/verify-email', 'Tous', 'Valider le code OTP envoyé par email et passer le compte au statut vérifié.'],
  ['POST', '/api/auth/forgot-password', 'Tous', 'Déclencher le flux de réinitialisation du mot de passe avec code temporaire.'],
  ['POST', '/api/auth/reset-password', 'Tous', 'Remplacer le mot de passe après vérification du code temporaire.'],
  ['GET', '/api/auth/google', 'Tous', 'Initialiser le flux OAuth Google pour simplifier l’inscription.'],
  ['GET', '/api/users/me', 'Tous', 'Récupérer le profil complet de l’utilisateur connecté.'],
  ['PATCH', '/api/users/me/profile', 'Tous', 'Mettre à jour les informations personnelles et les préférences de profil.'],
  ['GET', '/api/coaches', 'Athlète', 'Lister les coachs disponibles avec filtres de recherche et pagination.'],
  ['GET', '/api/coaches/:id', 'Tous', 'Consulter le profil public détaillé d’un coach.'],
  ['GET', '/api/nutritionists', 'Athlète', 'Lister les nutritionnistes disponibles pour une prise en charge alimentaire.'],
  ['POST', '/api/coaching-requests', 'Athlète', 'Envoyer une demande de coaching à un professionnel.'],
  ['GET', '/api/coaching-requests', 'Coach/Athlète', 'Lister les demandes reçues ou envoyées selon le rôle connecté.'],
  ['PATCH', '/api/coaching-requests/:id', 'Coach', 'Accepter ou refuser une demande de coaching.'],
  ['GET', '/api/athletes', 'Coach', 'Lister les athlètes suivis par le coach connecté.'],
  ['GET', '/api/exercises', 'Tous', 'Consulter la bibliothèque d’exercices avec filtres par muscle, niveau et matériel.'],
  ['POST', '/api/exercises', 'Admin/Coach', 'Ajouter un exercice dans le catalogue.'],
  ['POST', '/api/programs', 'Coach', 'Créer un programme d’entraînement structuré par jours et exercices.'],
  ['GET', '/api/programs', 'Coach/Athlète', 'Lister les programmes créés ou assignés.'],
  ['GET', '/api/programs/:id', 'Coach/Athlète', 'Consulter le détail complet d’un programme.'],
  ['PATCH', '/api/programs/:id', 'Coach', 'Modifier un programme existant.'],
  ['POST', '/api/programs/:id/assign', 'Coach', 'Assigner un programme à un athlète suivi.'],
  ['POST', '/api/workout-logs', 'Athlète', 'Enregistrer une séance réalisée avec charges, répétitions et ressenti.'],
  ['GET', '/api/workout-logs/me', 'Athlète', 'Afficher l’historique des séances terminées.'],
  ['GET', '/api/workout-logs/athlete/:id', 'Coach', 'Consulter la progression d’un athlète précis.'],
  ['POST', '/api/diet', 'Coach/Nutritionniste', 'Créer un plan alimentaire avec journées, repas et macronutriments.'],
  ['GET', '/api/diet/athlete/:id', 'Coach/Nutritionniste', 'Récupérer le plan alimentaire assigné à un athlète.'],
  ['PATCH', '/api/diet/:id', 'Coach/Nutritionniste', 'Modifier un plan alimentaire.'],
  ['POST', '/api/meal-logs', 'Athlète', 'Enregistrer un repas consommé durant la journée.'],
  ['GET', '/api/meal-logs/me/today', 'Athlète', 'Récupérer le résumé nutritionnel du jour.'],
  ['GET', '/api/goals/me', 'Athlète', 'Lister les objectifs de poids, calories ou activité.'],
  ['POST', '/api/goals', 'Athlète', 'Créer un nouvel objectif personnel.'],
  ['GET', '/api/chat/contacts', 'Tous', 'Lister les contacts autorisés pour la messagerie.'],
  ['GET', '/api/chat/messages/:userId', 'Tous', 'Charger l’historique d’une conversation privée.'],
  ['POST', '/api/chat/messages', 'Tous', 'Envoyer un message et le persister en base.'],
  ['GET', '/api/notifications', 'Tous', 'Lister les notifications non lues et récentes.'],
  ['PATCH', '/api/notifications/:id/read', 'Tous', 'Marquer une notification comme lue.'],
  ['POST', '/api/sessions', 'Coach', 'Planifier une session de coaching avec date, heure et lien visio.'],
  ['GET', '/api/sessions/me', 'Tous', 'Lister les sessions à venir de l’utilisateur connecté.'],
  ['PATCH', '/api/sessions/:id', 'Coach', 'Reporter ou annuler une session.'],
  ['POST', '/api/ai/ask', 'Coach/Athlète', 'Interroger le copilote IA à partir d’un contexte sportif ou nutritionnel.'],
  ['GET', '/api/dashboard/summary', 'Tous', 'Récupérer les indicateurs principaux du tableau de bord.'],
  ['GET', '/api/reports/athlete/:id', 'Coach', 'Générer une synthèse de progression pour un athlète.'],
  ['GET', '/api/admin/users', 'Admin', 'Lister les utilisateurs pour administration et modération.'],
  ['PATCH', '/api/admin/users/:id/status', 'Admin', 'Activer, suspendre ou réactiver un compte.'],
];

const entities = [
  ['User', 'Compte central portant email, mot de passe haché, rôle, statut de vérification et dates d’audit.', 'Relations vers Athlete, Coach, NutritionistProfile, Message et Notification.'],
  ['Athlete', 'Profil sportif contenant données biométriques, niveau, objectifs, blessures et préférences.', 'Lié à User, CoachingRequest, Program, WorkoutLog, MealLog et Goal.'],
  ['Coach', 'Profil professionnel contenant spécialités, certifications, tarif, description et disponibilité.', 'Lié à User, CoachCertification, Program, Session et CoachingRequest.'],
  ['NutritionistProfile', 'Extension métier pour le suivi nutritionnel avec expertise et approche alimentaire.', 'Lié à User, DietPlan et NutritionConnection.'],
  ['CoachingRequest', 'Objet transactionnel décrivant une demande envoyée par un athlète vers un coach.', 'Statuts PENDING, ACCEPTED, REJECTED; relie Athlete et Coach.'],
  ['NutritionConnection', 'Objet de relation entre un athlète et un nutritionniste.', 'Autorise l’accès aux plans nutritionnels et aux logs repas.'],
  ['Exercise', 'Référentiel d’exercices avec nom, groupe musculaire, niveau, équipement et instructions.', 'Utilisé dans ProgramExercise et WorkoutLog.'],
  ['Program', 'Programme d’entraînement complet créé par un coach.', 'Contient ProgramDay et ProgramExercise; assigné à un athlète.'],
  ['ProgramDay', 'Journée d’entraînement au sein d’un programme.', 'Contient une liste ordonnée d’exercices.'],
  ['ProgramExercise', 'Association entre un exercice et une journée avec séries, répétitions, charge et repos.', 'Dépend de ProgramDay et Exercise.'],
  ['WorkoutLog', 'Journal d’exécution d’une séance par l’athlète.', 'Agrège ExerciseLog et ressenti de séance.'],
  ['ExerciseLog', 'Détail réel d’un exercice exécuté: charge, répétitions, durée et notes.', 'Lié à WorkoutLog et Exercise.'],
  ['DietPlan', 'Plan alimentaire structuré créé par coach ou nutritionniste.', 'Contient DietDay et Meal; assigné à un athlète.'],
  ['DietDay', 'Jour alimentaire avec objectifs de calories, protéines, glucides et lipides.', 'Contient plusieurs repas planifiés.'],
  ['Meal', 'Repas planifié avec nom, ingrédients et valeurs nutritionnelles.', 'Appartient à un DietDay.'],
  ['MealLog', 'Repas effectivement consommé et renseigné par l’athlète.', 'Sert au calcul de conformité nutritionnelle.'],
  ['Goal', 'Objectif personnel mesurable: poids cible, calories, fréquence sportive ou hydratation.', 'Lié à Athlete et exploité par Dashboard.'],
  ['Conversation', 'Regroupement logique d’échanges entre deux utilisateurs autorisés.', 'Contient Message et métadonnées de lecture.'],
  ['Message', 'Message texte persistant envoyé via WebSocket ou HTTP.', 'Lié à sender, receiver et Conversation.'],
  ['Notification', 'Événement utilisateur affiché dans le tableau de bord.', 'Créé lors des demandes, acceptations, messages et sessions.'],
  ['Session', 'Rendez-vous de coaching ou nutrition avec date, statut et lien de visioconférence.', 'Relie Coach/Nutritionniste et Athlete.'],
  ['ActivityEvent', 'Trace d’activité utilisée pour l’audit et les indicateurs récents.', 'Alimente le dashboard et les rapports.'],
  ['UserInvitation', 'Invitation envoyée par un professionnel à un athlète externe.', 'Permet de créer une relation guidée.'],
];

const rules = [
  ['Authentification', 'Un endpoint protégé refuse toute requête sans jeton JWT valide.', '401 Unauthorized et aucune donnée métier retournée.'],
  ['Rôle utilisateur', 'Un utilisateur ne peut accéder qu’aux fonctionnalités autorisées par son rôle.', '403 Forbidden si le rôle ne correspond pas.'],
  ['Email unique', 'Deux comptes ne peuvent pas partager la même adresse email.', '409 Conflict lors de l’inscription.'],
  ['Mot de passe', 'Le mot de passe doit être haché avant stockage.', 'Aucun mot de passe clair ne doit apparaître en base ni dans les logs.'],
  ['Demande de coaching', 'Une demande active unique peut exister entre un athlète et un coach donné.', 'Blocage des doublons en statut PENDING ou ACCEPTED.'],
  ['Acceptation de demande', 'Seul le coach destinataire peut accepter ou refuser une demande.', 'Vérification de propriété avant mutation.'],
  ['Programme', 'Un programme ne peut être assigné qu’à un athlète lié au coach.', 'Contrôle de relation avant assignation.'],
  ['Workout Player', 'Une séance terminée doit produire un WorkoutLog cohérent.', 'Au moins une entrée d’exercice ou un statut explicitement annulé.'],
  ['Plan nutritionnel', 'Un plan assigné doit contenir au moins une journée et un repas.', 'Validation côté backend avant sauvegarde.'],
  ['MealLog', 'Les valeurs nutritionnelles doivent être positives ou nulles.', 'Rejet des calories et macros négatives.'],
  ['Messagerie', 'Deux utilisateurs ne peuvent échanger que s’ils sont liés par coaching ou nutrition.', 'Contrôle d’autorisation avant chargement de conversation.'],
  ['Session', 'Une session ne peut pas être planifiée dans le passé.', 'Validation de date côté serveur.'],
  ['Notification', 'Une notification appartient à un seul utilisateur.', 'Le marquage lu vérifie le propriétaire.'],
  ['IA', 'Les réponses IA sont des aides et ne remplacent pas un avis médical.', 'Message de prudence conservé dans les interfaces sensibles.'],
  ['Administration', 'La suspension d’un compte empêche toute nouvelle connexion.', 'Contrôle du statut lors du login.'],
];

const tests = [
  ['AUTH-01', 'Inscription email valide', 'POST signup avec données complètes', '201 Created et utilisateur non vérifié.'],
  ['AUTH-02', 'Inscription email dupliqué', 'POST signup avec email existant', '409 Conflict.'],
  ['AUTH-03', 'Connexion réussie', 'POST login avec identifiants valides', '200 OK, token JWT, profil utilisateur.'],
  ['AUTH-04', 'Connexion refusée', 'POST login avec mauvais mot de passe', '401 Unauthorized.'],
  ['AUTH-05', 'Accès sans token', 'GET /api/users/me sans Authorization', '401 Unauthorized.'],
  ['AUTH-06', 'Accès rôle invalide', 'Athlète vers route admin', '403 Forbidden.'],
  ['REL-01', 'Recherche coachs', 'GET /api/coaches avec filtres', 'Liste paginée et stable.'],
  ['REL-02', 'Demande coaching', 'POST coaching-requests', 'Demande PENDING créée.'],
  ['REL-03', 'Acceptation demande', 'PATCH demande par coach destinataire', 'Statut ACCEPTED et notification athlète.'],
  ['REL-04', 'Refus non autorisé', 'PATCH demande par autre coach', '403 Forbidden.'],
  ['PRG-01', 'Création programme', 'POST programs avec jours et exercices', 'Programme complet enregistré.'],
  ['PRG-02', 'Assignation programme', 'POST assign vers athlète suivi', 'Programme visible côté athlète.'],
  ['PRG-03', 'Workout Player', 'Terminer une séance depuis Angular/Flutter', 'WorkoutLog et ExerciseLog enregistrés.'],
  ['PRG-04', 'Historique', 'GET workout-logs/me', 'Tri décroissant par date.'],
  ['NUT-01', 'Création plan alimentaire', 'POST diet avec repas', 'DietPlan, DietDay et Meal persistés.'],
  ['NUT-02', 'Logging repas', 'POST meal-logs', 'MealLog créé et résumé journalier mis à jour.'],
  ['NUT-03', 'Macros négatives', 'POST meal-logs avec calories négatives', '400 Bad Request.'],
  ['NUT-04', 'Objectifs', 'POST goals puis GET goals/me', 'Objectif retrouvé dans la liste active.'],
  ['MSG-01', 'Contact autorisé', 'GET chat/contacts', 'Contacts issus des relations actives uniquement.'],
  ['MSG-02', 'Message temps réel', 'send_message Socket.io', 'Message reçu par destinataire connecté.'],
  ['MSG-03', 'Destinataire hors ligne', 'send_message vers utilisateur déconnecté', 'Message persisté et notification créée.'],
  ['SES-01', 'Planification session', 'POST sessions date future', 'Lien Jitsi et statut SCHEDULED.'],
  ['SES-02', 'Date passée', 'POST sessions date passée', '400 Bad Request.'],
  ['AI-01', 'Prompt simple', 'POST ai/ask', 'Réponse textuelle cohérente.'],
  ['AI-02', 'Prompt contextualisé', 'POST ai/ask avec profil athlète', 'Réponse adaptée au contexte fourni.'],
  ['ADM-01', 'Liste utilisateurs', 'GET admin/users par admin', 'Liste paginée.'],
  ['ADM-02', 'Suspension', 'PATCH admin/users/:id/status', 'Compte suspendu et login refusé.'],
];

const mobileScreens = [
  ['SplashScreen', 'Vérification initiale du token et redirection vers login ou dashboard.'],
  ['LoginScreen', 'Connexion email/mot de passe avec gestion des erreurs API.'],
  ['SignupScreen', 'Création de compte et choix du rôle.'],
  ['OnboardingScreen', 'Saisie guidée des informations biométriques et objectifs.'],
  ['DashboardScreen', 'Synthèse de la journée, prochaines séances et progression.'],
  ['DiscoverScreen', 'Recherche de coachs ou nutritionnistes depuis mobile.'],
  ['ProgramsScreen', 'Liste des programmes assignés ou créés.'],
  ['ProgramDetailScreen', 'Détail d’un programme et lancement de séance.'],
  ['WorkoutPlayerScreen', 'Exécution pas à pas avec chronomètre de repos.'],
  ['WorkoutHistoryScreen', 'Historique des séances terminées.'],
  ['NutritionScreen', 'Résumé calories/macros et repas du jour.'],
  ['MealScanScreen', 'Saisie rapide ou assistée d’un repas.'],
  ['SessionsScreen', 'Liste des rendez-vous et accès aux liens visio.'],
  ['CalendarScreen', 'Vue calendrier des séances planifiées.'],
  ['NotificationsScreen', 'Notifications récentes et statut lu/non lu.'],
  ['ProfileScreen', 'Consultation et modification du profil utilisateur.'],
];

const frontendComponents = [
  ['AuthService', 'Centralise login, signup, stockage du JWT, récupération du profil courant et logout.'],
  ['JwtInterceptor', 'Injecte automatiquement le bearer token dans les requêtes HTTP sortantes.'],
  ['AuthGuard', 'Protège les routes privées et redirige vers login si nécessaire.'],
  ['DashboardLayoutComponent', 'Structure l’espace connecté avec sidebar, navbar et zone de contenu.'],
  ['DiscoveryComponent', 'Affiche les professionnels et déclenche les demandes de mise en relation.'],
  ['ProgramsComponent', 'Gère la liste des programmes et les actions de création/assignation.'],
  ['WorkoutBuilderModalComponent', 'Interface de construction des séances par jours et exercices.'],
  ['WorkoutPlayerComponent', 'Expérience interactive de séance avec progression, séries et repos.'],
  ['NutritionComponent', 'Dashboard nutrition avec objectifs journaliers et logs repas.'],
  ['DietBuilderComponent', 'Construction de plans alimentaires par jour et repas.'],
  ['MessagingComponent', 'Interface chat synchronisée avec le backend Socket.io.'],
  ['AthleteScheduleComponent', 'Affichage des rendez-vous et des sessions planifiées.'],
  ['AnalyticsComponent', 'Graphiques de progression et indicateurs de conformité.'],
  ['AdminDashboardComponent', 'Indicateurs globaux, utilisateurs et activité plateforme.'],
  ['ToastService', 'Affichage homogène des messages succès/erreur.'],
];

const sections = [];

sections.push(`\\appendix
\\chapter{Catalogue Technique de l'API}
\\minitoc
\\newpage

\\section{Objectif de l'annexe}
Cette annexe complète les chapitres de réalisation en détaillant la surface API exposée par la plateforme GOSPORT. Elle sert de référence de lecture pour comprendre le contrat entre l'application web Angular, l'application mobile Flutter et le backend Node.js/Express. Les routes ci-dessous sont regroupées par domaine fonctionnel et décrivent le rôle de chaque endpoint, l'acteur principal concerné et les règles d'accès attendues.

\\section{Catalogue des Endpoints}
\\begin{longtable}{|p{2cm}|p{4.2cm}|p{3cm}|p{6cm}|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{Méthode} & \\textbf{Route} & \\textbf{Acteur} & \\textbf{Description} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{Méthode} & \\textbf{Route} & \\textbf{Acteur} & \\textbf{Description} \\\\ \\hline
\\endhead
${endpoints.map(([m, r, a, d]) => `${esc(m)} & ${txt(r)} & ${esc(a)} & ${esc(d)} \\\\ \\hline`).join('\n')}
\\caption{Catalogue des endpoints REST de GOSPORT}
\\end{longtable}

\\section{Convention des Réponses JSON}
Les réponses de l'API suivent une structure homogène afin de simplifier l'intégration côté Angular et Flutter. En cas de succès, le serveur retourne un code HTTP cohérent avec l'action effectuée et un objet JSON contenant la ressource créée, modifiée ou consultée. En cas d'erreur, la réponse contient un message lisible par l'interface et, lorsque cela est utile, un tableau d'erreurs de validation.

\\begin{lstlisting}[language=JavaScript, caption=Format standard d'une réponse de succès]
{
  "success": true,
  "data": {
    "id": 15,
    "createdAt": "2026-05-23T10:30:00.000Z"
  },
  "message": "Operation effectuee avec succes"
}
\\end{lstlisting}

\\begin{lstlisting}[language=JavaScript, caption=Format standard d'une réponse d'erreur]
{
  "success": false,
  "message": "Validation impossible",
  "errors": [
    { "field": "email", "message": "Email invalide" }
  ]
}
\\end{lstlisting}

\\section{Règles de Pagination et de Filtrage}
Les listes potentiellement volumineuses (coachs, athlètes, programmes, notifications et messages) sont paginées. Le client transmet les paramètres \\texttt{page} et \\texttt{limit}; le serveur retourne le nombre total d'éléments, la page courante et le nombre total de pages. Cette convention évite de charger inutilement l'ensemble de la base, améliore la réactivité du dashboard et prépare l'application à une montée en charge progressive.`);

sections.push(`\\chapter{Dictionnaire de Données}
\\minitoc
\\newpage

\\section{Vue d'ensemble}
Le modèle de données repose sur PostgreSQL et TypeORM. Les entités sont conçues pour séparer les responsabilités: l'identité commune est portée par \\texttt{User}, tandis que les profils métier sont stockés dans des tables spécialisées. Cette séparation permet de conserver une base évolutive, d'éviter la duplication et de préserver l'intégrité référentielle.

\\section{Entités Principales}
\\begin{longtable}{|p{3.5cm}|p{6cm}|p{6cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Entité} & \\textbf{Responsabilité} & \\textbf{Relations principales} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Entité} & \\textbf{Responsabilité} & \\textbf{Relations principales} \\\\ \\hline
\\endhead
${entities.map(([e, r, rel]) => `${txt(e)} & ${esc(r)} & ${esc(rel)} \\\\ \\hline`).join('\n')}
\\caption{Dictionnaire des entités principales}
\\end{longtable}

\\section{Justification du Découpage}
Le découpage adopté évite de créer une table utilisateur trop large contenant des champs inutiles selon les rôles. Par exemple, les informations biométriques n'ont pas de sens pour un coach, tandis que les certifications professionnelles ne concernent pas un athlète. L'association entre \\texttt{User} et les profils spécialisés permet donc une lecture plus claire du modèle, un contrôle plus précis des validations et une meilleure évolutivité.

\\section{Contraintes d'Intégrité}
Chaque relation critique est protégée par une contrainte métier. Un \\texttt{WorkoutLog} doit appartenir à un athlète identifié; un \\texttt{MealLog} doit être rattaché à une date et à un utilisateur; une \\texttt{Session} ne peut exister que si les deux parties sont liées. Ces contraintes limitent les incohérences et sécurisent les agrégations utilisées par les dashboards.`);

sections.push(`\\chapter{Matrice des Règles Métier}
\\minitoc
\\newpage

\\section{Présentation}
Les règles métier décrivent les décisions fonctionnelles qui doivent rester vraies quelle que soit l'interface utilisée. Elles sont appliquées côté backend pour éviter qu'un client web ou mobile modifié puisse contourner les contrôles.

\\begin{longtable}{|p{3.2cm}|p{7cm}|p{5cm}|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Domaine} & \\textbf{Règle} & \\textbf{Comportement attendu} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Domaine} & \\textbf{Règle} & \\textbf{Comportement attendu} \\\\ \\hline
\\endhead
${rules.map(([d, r, b]) => `${esc(d)} & ${esc(r)} & ${esc(b)} \\\\ \\hline`).join('\n')}
\\caption{Matrice des règles métier}
\\end{longtable}

\\section{Gestion des Autorisations}
L'autorisation n'est pas limitée à la vérification du rôle. Le backend vérifie également la propriété de la ressource: un coach ne peut lire que les athlètes qu'il suit, un athlète ne peut consulter que ses programmes, et un message ne peut être envoyé qu'à un utilisateur lié par une relation active. Cette approche évite les failles de type IDOR, où un utilisateur tente d'accéder à une ressource en modifiant simplement un identifiant dans l'URL.

\\section{Gestion des États}
Plusieurs objets possèdent un cycle de vie. Les demandes passent de \\texttt{PENDING} à \\texttt{ACCEPTED} ou \\texttt{REJECTED}; les sessions passent de \\texttt{SCHEDULED} à \\texttt{DONE}, \\texttt{CANCELLED} ou \\texttt{MISSED}; les notifications passent de non lues à lues. Ces transitions sont contrôlées afin d'empêcher les retours incohérents, par exemple réactiver une demande refusée sans recréer une nouvelle demande.`);

sections.push(`\\chapter{Matrice de Tests et Validation}
\\minitoc
\\newpage

\\section{Stratégie}
La validation de GOSPORT combine des tests d'intégration API, des tests fonctionnels sur interface web, des tests mobiles sur émulateur et des tests manuels de bout en bout. L'objectif est de vérifier les flux complets: inscription, mise en relation, création de programme, exécution de séance, suivi nutritionnel, messagerie et planification.

\\begin{longtable}{|p{2.2cm}|p{4cm}|p{5.2cm}|p{5cm}|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Scénario} & \\textbf{Procédure} & \\textbf{Résultat attendu} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Scénario} & \\textbf{Procédure} & \\textbf{Résultat attendu} \\\\ \\hline
\\endhead
${tests.map(([id, s, p, r]) => `${txt(id)} & ${esc(s)} & ${esc(p)} & ${esc(r)} \\\\ \\hline`).join('\n')}
\\caption{Matrice de tests fonctionnels et d'intégration}
\\end{longtable}

\\section{Tests de Non-Régression}
Après chaque évolution, les scénarios les plus critiques sont rejoués: connexion, chargement du dashboard, création de programme, assignation, exécution d'une séance et envoi d'un message. Ces tests garantissent que les fonctionnalités transversales, notamment l'authentification et l'autorisation, ne sont pas cassées par les nouveaux développements.

\\section{Critères d'Acceptation}
Une fonctionnalité est considérée comme livrée si elle respecte les critères suivants: l'API retourne des codes HTTP cohérents, les erreurs sont affichées proprement côté client, les données sont persistées, les autorisations sont contrôlées, et l'expérience utilisateur reste fluide sur un écran desktop et sur un écran mobile.`);

sections.push(`\\chapter{Interfaces Web et Mobile}
\\minitoc
\\newpage

\\section{Structure Angular}
Le frontend web cible principalement l'administration, les coachs et les nutritionnistes. Il utilise une architecture par composants et services, ce qui facilite la maintenance et la séparation entre interface, accès aux données et logique de navigation.

\\begin{longtable}{|p{4cm}|p{11cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Composant ou Service} & \\textbf{Rôle dans l'application web} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Composant ou Service} & \\textbf{Rôle dans l'application web} \\\\ \\hline
\\endhead
${frontendComponents.map(([c, r]) => `${txt(c)} & ${esc(r)} \\\\ \\hline`).join('\n')}
\\caption{Composants et services Angular significatifs}
\\end{longtable}

\\section{Structure Flutter}
L'application mobile est organisée par fonctionnalités. Chaque domaine possède ses écrans, ses repositories et ses widgets partagés. Cette organisation rend le code lisible et permet de faire évoluer indépendamment les modules de programme, nutrition, sessions et notifications.

\\begin{longtable}{|p{4cm}|p{11cm}|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Écran mobile} & \\textbf{Responsabilité} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Écran mobile} & \\textbf{Responsabilité} \\\\ \\hline
\\endhead
${mobileScreens.map(([s, r]) => `${txt(s)} & ${esc(r)} \\\\ \\hline`).join('\n')}
\\caption{Écrans principaux de l'application Flutter}
\\end{longtable}

\\section{Principes Ergonomiques}
Les interfaces privilégient les parcours guidés. L'utilisateur n'est pas confronté à l'ensemble des fonctionnalités en une seule fois; les vues sont organisées autour de tâches concrètes: créer un programme, suivre une séance, renseigner un repas, envoyer un message ou consulter un indicateur. Cette logique réduit la charge cognitive et rend la plateforme plus accessible pour des utilisateurs non techniques.`);

sections.push(`\\chapter{Sécurité, Exploitation et Déploiement}
\\minitoc
\\newpage

\\section{Mesures de Sécurité}
La plateforme manipule des informations personnelles et des données liées à la santé et à l'activité physique. Même si le projet reste académique, la conception adopte des pratiques proches d'un contexte professionnel: hachage des mots de passe, jetons courts, contrôle des rôles, validation des entrées, limitation du débit et restriction CORS.

\\subsection{Journalisation}
Les événements importants doivent être journalisés sans exposer de secrets. Les logs peuvent conserver l'identifiant de l'utilisateur, la route appelée, le code HTTP et la date, mais ne doivent jamais afficher un mot de passe, un token complet, une clé API ou un contenu médical sensible.

\\subsection{Variables d'Environnement}
Les informations de configuration sont sorties du code source: URL de base de données, secret JWT, clés OAuth, clé Gemini, origine frontend et paramètres SMTP. Cette séparation permet de déployer la même base de code sur plusieurs environnements sans modifier les sources.

\\begin{lstlisting}[caption=Exemple de variables d'environnement attendues]
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/gosport
JWT_SECRET=change_me_in_production
FRONTEND_URL=https://app.gosport.example
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GEMINI_API_KEY=...
SMTP_HOST=smtp.example.com
SMTP_USER=notifications@example.com
SMTP_PASSWORD=...
\\end{lstlisting}

\\section{Processus de Déploiement}
Le déploiement se déroule en plusieurs étapes. Le backend est compilé depuis TypeScript vers JavaScript, les dépendances de production sont installées, la base PostgreSQL est disponible, puis le processus Node.js est lancé sous un superviseur. Le frontend Angular est compilé en fichiers statiques et servi via Nginx ou un service de hosting. L'application Flutter est compilée séparément pour Android et iOS.

\\begin{enumerate}
  \\item Préparer l'environnement de production et les variables sensibles.
  \\item Installer les dépendances backend avec \\texttt{npm ci}.
  \\item Compiler le backend avec \\texttt{npm run build}.
  \\item Vérifier la connexion PostgreSQL.
  \\item Lancer l'API Node.js via PM2, Docker ou le service PaaS choisi.
  \\item Compiler Angular avec \\texttt{ng build}.
  \\item Servir les fichiers statiques via Nginx ou CDN.
  \\item Compiler Flutter en APK/AAB pour Android et archive iOS pour distribution.
\\end{enumerate}

\\section{Supervision}
Une supervision minimale doit suivre la disponibilité de l'API, le temps de réponse moyen, le taux d'erreur HTTP 5xx, le nombre de connexions WebSocket actives et l'espace disque de la base de données. Ces indicateurs permettent d'identifier rapidement les régressions et les problèmes de capacité.`);

sections.push(`\\chapter{Scénarios de Démonstration}
\\minitoc
\\newpage

\\section{Parcours 1: Inscription et Onboarding Athlète}
L'utilisateur ouvre l'application, crée un compte athlète, vérifie son email puis complète son onboarding. Il renseigne son âge, sa taille, son poids, son niveau sportif et son objectif principal. Le système crée le profil et redirige vers le dashboard personnalisé.

\\section{Parcours 2: Recherche d'un Coach}
L'athlète accède à la découverte, filtre les coachs par spécialité et consulte un profil public. Il envoie une demande. Le coach reçoit une notification, ouvre son dashboard et accepte la demande. Dès l'acceptation, l'athlète devient visible dans la liste des athlètes suivis.

\\section{Parcours 3: Création et Exécution d'un Programme}
Le coach crée un programme sur quatre semaines. Il ajoute des journées d'entraînement, sélectionne des exercices, définit les séries, répétitions, charges de départ et temps de repos. L'athlète lance ensuite le Workout Player, suit la séance étape par étape et sauvegarde ses performances réelles.

\\section{Parcours 4: Suivi Nutritionnel}
Le nutritionniste crée un plan alimentaire avec objectifs de calories et de macronutriments. L'athlète logge ses repas au quotidien. Le dashboard calcule automatiquement les écarts par rapport aux objectifs et affiche une synthèse claire.

\\section{Parcours 5: Communication et Session}
Le coach et l'athlète échangent via la messagerie instantanée. Le coach planifie une session de visioconférence; l'athlète la retrouve dans son agenda et peut ouvrir le lien au moment prévu. Les notifications rappellent les événements importants.

\\section{Parcours 6: Assistance IA}
Un utilisateur interroge le copilote IA pour obtenir une alternative d'exercice ou une suggestion d'organisation de séance. Le backend ajoute le contexte utile et transmet la demande à Gemini. La réponse est affichée comme une aide pratique, avec prudence lorsqu'elle touche à la santé.`);

sections.push(`\\chapter{Fiches Détaillées des Endpoints}
\\minitoc
\\newpage

\\section{Objectif}
Cette annexe détaille chaque endpoint sous forme de fiche technique. Elle complète le catalogue synthétique en précisant l'intention fonctionnelle, les validations, les erreurs probables et les éléments de réponse attendus. Ces fiches peuvent servir de support à la soutenance, aux tests Postman et à la future documentation développeur.

${endpoints.map(([method, route, actor, description], index) => `\\section{Endpoint ${index + 1}: ${esc(method)} ${txt(route)}}
\\subsection{Rôle Fonctionnel}
${esc(description)} Cette route appartient au périmètre de l'acteur principal \\textbf{${esc(actor)}}. Elle participe à la cohérence du parcours utilisateur en reliant l'interface Angular ou Flutter au backend Express. Son comportement doit rester stable, car les clients web et mobile dépendent de son contrat JSON.

\\subsection{Contrôles et Préconditions}
Avant de traiter la requête, le serveur vérifie la validité des entrées reçues, le format des identifiants, la cohérence des dates et l'autorisation métier. Lorsque la route est protégée, le middleware d'authentification extrait le JWT, vérifie sa signature, contrôle son expiration et attache l'utilisateur courant à la requête. Les routes sensibles appliquent en plus une vérification de propriété afin d'empêcher l'accès à des ressources appartenant à un autre utilisateur.

\\subsection{Réponse Attendue}
En cas de succès, la route retourne un code HTTP adapté à l'opération: \\texttt{200 OK} pour une lecture ou une modification, \\texttt{201 Created} pour une création, et \\texttt{204 No Content} pour une suppression sans corps. En cas d'erreur, le backend renvoie un message explicite mais sans divulguer d'information sensible. Les erreurs typiques sont \\texttt{400 Bad Request}, \\texttt{401 Unauthorized}, \\texttt{403 Forbidden}, \\texttt{404 Not Found} et \\texttt{409 Conflict}.

\\begin{lstlisting}[language=JavaScript, caption=Exemple générique de réponse pour ${esc(method)} ${esc(route)}]
{
  "success": true,
  "message": "Operation realisee avec succes",
  "data": {
    "id": 1,
    "status": "OK"
  }
}
\\end{lstlisting}

\\subsection{Points de Test}
La route doit être testée avec un cas nominal, un cas d'entrée invalide, un cas sans authentification si elle est protégée, et un cas où l'utilisateur authentifié ne possède pas la ressource demandée. Cette grille assure que le comportement reste prévisible pour les interfaces et évite les régressions lors des ajouts fonctionnels.
`).join('\n')}
`);

sections.push(`\\chapter{Fiches Détaillées des Entités}
\\minitoc
\\newpage

\\section{Objectif}
Cette annexe décrit les principales entités de la base de données avec une lecture orientée métier. Elle permet de comprendre pourquoi chaque table existe, quelles données elle porte et comment elle s'insère dans le cycle de vie global de la plateforme.

${entities.map(([entity, responsibility, relations], index) => `\\section{Entité ${index + 1}: ${txt(entity)}}
\\subsection{Responsabilité}
${esc(responsibility)} Cette entité représente un élément durable du domaine fonctionnel. Elle est persistée dans PostgreSQL à travers TypeORM, ce qui permet de bénéficier du typage TypeScript, des relations déclaratives et des migrations contrôlées.

\\subsection{Relations}
${esc(relations)} Les relations sont essentielles pour maintenir l'intégrité du modèle. Une suppression ou une modification doit donc être étudiée avec prudence afin de ne pas créer d'enregistrements orphelins, de doublons ou d'incohérences dans les tableaux de bord.

\\subsection{Validation}
Les champs de cette entité doivent respecter des contraintes explicites: présence des champs obligatoires, unicité lorsque le métier l'impose, cohérence des dates, valeurs positives pour les mesures numériques et respect des énumérations de statut. Les validations sont appliquées côté API, même si l'interface effectue déjà un premier contrôle.

\\subsection{Utilisation dans les Interfaces}
L'entité ${txt(entity)} est exploitée indirectement par les services Angular et Flutter. Les vues ne manipulent pas directement la base de données; elles consomment des objets JSON simplifiés retournés par l'API. Cette séparation réduit le couplage entre les écrans et le modèle relationnel interne.

\\subsection{Risques et Évolutions}
Les évolutions possibles concernent l'ajout de nouveaux attributs, l'amélioration de l'audit, ou l'extension des relations vers de nouveaux modules. Toute évolution devra être accompagnée d'une migration de base de données, d'une adaptation des DTO et d'une mise à jour des tests de non-régression.
`).join('\n')}
`);

sections.push(`\\chapter{Guide de Recette Fonctionnelle}
\\minitoc
\\newpage

\\section{Préparation de la Recette}
La recette fonctionnelle doit être effectuée avec plusieurs comptes: un administrateur, un coach, un nutritionniste et au moins deux athlètes. Cette diversité permet de vérifier les permissions, les relations croisées, les demandes acceptées et refusées, ainsi que les différences d'affichage selon les rôles.

\\section{Jeu de Données Conseillé}
Le jeu de données minimal contient dix exercices, deux programmes sportifs, deux plans alimentaires, trois objectifs personnels, deux conversations et trois sessions de coaching. Ce volume reste simple à contrôler manuellement tout en étant suffisant pour observer les tableaux de bord, les listes paginées, les graphiques et les notifications.

\\section{Checklist de Recette}
\\begin{longtable}{|p{5cm}|p{9.5cm}|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{Bloc} & \\textbf{Contrôles à effectuer} \\\\ \\hline
\\endfirsthead
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{Bloc} & \\textbf{Contrôles à effectuer} \\\\ \\hline
\\endhead
Authentification & Inscription, connexion, déconnexion, persistance de session, redirection après expiration du token. \\\\ \\hline
Onboarding & Saisie des données selon le rôle, validation des champs requis, retour d'erreur clair. \\\\ \\hline
Mise en relation & Recherche de professionnels, envoi de demande, acceptation, refus, notifications associées. \\\\ \\hline
Programmes & Création de programme, ajout de jours, ajout d'exercices, assignation, affichage côté athlète. \\\\ \\hline
Workout Player & Lancement de séance, passage d'un exercice au suivant, timer de repos, sauvegarde des logs. \\\\ \\hline
Nutrition & Création de plan, assignation, logging repas, calcul des macros et historique. \\\\ \\hline
Messagerie & Chargement des contacts, historique, envoi temps réel, notification de message non lu. \\\\ \\hline
Sessions & Création, affichage agenda, ouverture du lien visio, annulation ou report. \\\\ \\hline
Administration & Liste utilisateurs, suspension, réactivation, consultation des statistiques globales. \\\\ \\hline
\\caption{Checklist de recette fonctionnelle}
\\end{longtable}

\\section{Procès-Verbal de Validation}
À la fin de la recette, chaque scénario est classé en conforme, conforme avec réserve ou non conforme. Les réserves mineures concernent généralement l'affichage, la formulation ou l'ergonomie. Les non-conformités bloquantes concernent la perte de données, l'accès non autorisé, l'impossibilité de terminer un parcours critique ou une erreur serveur récurrente.
`);

const output = sections.join('\n\n') + '\n';
fs.writeFileSync('annexes.tex', output, 'utf8');
console.log(`annexes.tex generated (${output.length} characters)`);
