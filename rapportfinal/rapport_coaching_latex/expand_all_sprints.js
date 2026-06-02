const fs = require('fs');

// ============================================================
// CHAPITRE 3 - SPRINT 1
// ============================================================
const chap3 = `\\chapter{Sprint 1 : Socle Technique, Authentification et Onboarding}
\\minitoc
\\newpage

\\section{Introduction}
Le premier Sprint constitue la pierre angulaire de toute la plateforme GOSPORT. Sans une infrastructure technique solide et un système d'authentification robuste, aucune des fonctionnalités métier ne peut être construite de manière fiable. Ce sprint répond à la question fondamentale : \\textit{Comment permettre à un utilisateur de rejoindre la plateforme de manière sécurisée et de configurer son espace personnalisé ?}

Ce premier incrément livre trois réalisations critiques : l'initialisation complète de la base de données relationnelle PostgreSQL avec TypeORM, la mise en place de la sécurité applicative (hachage, jetons JWT, OAuth 2.0), et la création des formulaires d'inscription et d'onboarding sur l'application web Angular.

\\section{Backlog du Sprint 1}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\resizebox{\\textwidth}{!}{%
\\begin{tabular}{|c|c|p{5cm}|p{6cm}|c|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Acteur} & \\textbf{User Story} & \\textbf{Tâche Technique} & \\textbf{Priorité} \\\\ \\hline
1.1 & Tous & Créer un compte avec email/mot de passe & POST /api/auth/signup, entité User, hachage bcrypt & Must \\\\ \\hline
1.2 & Tous & Se connecter et recevoir un jeton d'accès & POST /api/auth/login, génération JWT, middleware auth & Must \\\\ \\hline
1.3 & Tous & Se connecter avec Google OAuth 2.0 & Route OAuth2, OAuthController, callback redirection & Must \\\\ \\hline
1.4 & Tous & Vérifier son adresse e-mail & Envoi d'OTP, endpoint /verify-email & Should \\\\ \\hline
1.5 & Tous & Réinitialiser son mot de passe & /forgot-password, token OTP temporaire & Should \\\\ \\hline
1.6 & Athlète & Compléter son profil biométrique initial & Formulaire multi-étapes, PATCH /profile & Must \\\\ \\hline
1.7 & Coach & Renseigner son profil professionnel & Entité CoachProfile, bio/spécialité/tarif & Must \\\\ \\hline
\\end{tabular}%
}
\\caption{Backlog du Sprint 1 -- Authentification et Onboarding}
\\end{table}

\\section{Conception et Modélisation}

\\subsection{Diagramme de Cas d'Utilisation}
Le diagramme ci-dessous représente l'ensemble des interactions des acteurs avec les fonctionnalités d'accès et de gestion des profils livrées lors de ce sprint.

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint1_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation -- Sprint 1}
\\end{figure}

\\paragraph{Description des cas d'utilisation principaux :}
\\begin{itemize}
    \\item \\textbf{Créer un compte :} L'utilisateur renseigne son adresse e-mail, un mot de passe et son rôle (Coach, Athlète ou Nutritionniste). Le système valide les données, hache le mot de passe et persiste l'entité dans la base.
    \\item \\textbf{S'authentifier :} L'utilisateur soumet ses identifiants. Le serveur compare le mot de passe via \\texttt{bcrypt.compare()}, puis génère et retourne un JSON Web Token signé valide 7 jours.
    \\item \\textbf{OAuth Google :} L'utilisateur est redirigé vers la page de consentement Google. Après autorisation, le serveur échange le code d'accès contre les informations du profil.
    \\item \\textbf{Compléter profil -- Onboarding :} Flux guidé multi-étapes capturant les données biométriques de l'athlète (poids, taille, âge, niveau d'activité, objectifs) et les informations professionnelles du coach (expertise, tarifs, certifications).
\\end{itemize}

\\subsection{Diagramme de Classes -- Sprint 1}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint1_Classes.png}
\\caption{Diagramme de classes -- Entités du Sprint 1}
\\end{figure}

L'entité centrale \\texttt{User} porte les attributs communs (email, rôle, statut de vérification), et possède des relations \\textit{OneToOne} avec \\texttt{Coach}, \\texttt{Athlete} et \\texttt{NutritionistProfile} qui stockent les attributs métier spécifiques.

\\subsection{Diagramme de Séquence : Authentification JWT}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint1_Sequence_Auth.png}
\\caption{Diagramme de séquence -- Flux d'authentification JWT}
\\end{figure}

\\section{Architecture Technique}

\\subsection{Organisation du Backend Node.js}
Le backend adopte une architecture en couches séparées (Contrôleur $\\rightarrow$ Service $\\rightarrow$ Repository) qui garantit la maintenabilité et la testabilité du code.

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\begin{tabular}{|l|l|p{8cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Méthode HTTP} & \\textbf{Route} & \\textbf{Description} \\\\ \\hline
POST & /api/auth/signup & Création d'un nouveau compte utilisateur \\\\ \\hline
POST & /api/auth/login & Authentification et génération du JWT \\\\ \\hline
GET  & /api/auth/google & Initialisation du flux OAuth2 Google \\\\ \\hline
GET  & /api/auth/google/callback & Traitement du retour OAuth2 \\\\ \\hline
POST & /api/auth/verify-email & Vérification de l'OTP e-mail \\\\ \\hline
POST & /api/auth/forgot-password & Demande de réinitialisation de mot de passe \\\\ \\hline
PATCH & /api/users/:id/profile & Mise à jour du profil utilisateur \\\\ \\hline
\\end{tabular}
\\caption{Endpoints API -- Sprint 1}
\\end{table}

\\subsection{Sécurité Applicative}
Plusieurs mechanisms de sécurité complémentaires ont été déployés :
\\begin{itemize}
    \\item \\textbf{Hachage bcrypt (coût 12) :} Le mot de passe n'est jamais stocké en clair. L'algorithme bcrypt avec un facteur de coût de 12 itérations résiste aux attaques par force brute et aux tables arc-en-ciel.
    \\item \\textbf{JSON Web Tokens :} Chaque requête protégée doit porter l'en-tête \\texttt{Authorization: Bearer <token>}. Le middleware \\texttt{authenticate.ts} décode et valide ce token.
    \\item \\textbf{Rate Limiting :} \\texttt{express-rate-limit} bloque les requêtes abusives sur les routes d'authentification (max. 10 tentatives par 15 minutes par IP).
    \\item \\textbf{CORS configuré :} Seules les origines autorisées (domaine Angular) peuvent interroger l'API.
\\end{itemize}

\\subsection{Frontend Angular : Guards et Interceptors}
\\begin{itemize}
    \\item \\textbf{AuthGuard :} Vérifie la présence et la validité du JWT avant d'autoriser l'accès aux routes protégées.
    \\item \\textbf{RoleGuard :} Valide que le rôle de l'utilisateur (COACH, ATHLETE, ADMIN) correspond aux permissions de la route demandée.
    \\item \\textbf{HTTP Interceptor :} Injecte automatiquement le JWT dans l'en-tête de chaque requête HTTP sortante.
\\end{itemize}

\\section{Réalisation -- Extraits de Code}

\\subsection{Entité User avec TypeORM}
\\begin{lstlisting}[language=JavaScript, caption=Entité User.ts (TypeORM)]
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole,
            default: UserRole.ATHLETE })
  role: UserRole;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true })
  oauth_provider: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Coach, (c) => c.user, { cascade: true })
  coach: Coach;

  @OneToOne(() => Athlete, (a) => a.user, { cascade: true })
  athlete: Athlete;
}
\\end{lstlisting}

\\subsection{Logique de Connexion -- AuthController}
\\begin{lstlisting}[language=JavaScript, caption=Extrait AuthController.ts -- login()]
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userRepo.findOne({ where: { email } });

  if (!user || !user.passwordHash)
    return res.status(401).json({ message: 'Identifiants invalides' });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    return res.status(401).json({ message: 'Identifiants invalides' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  return res.status(200).json({ token, user });
};
\\end{lstlisting}

\\section{Tests et Validation}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{|p{5cm}|l|l|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Scénario de test} & \\textbf{Résultat attendu} & \\textbf{Statut} \\\\ \\hline
Inscription avec email valide & 201 Created + message & \\checkmark Conforme \\\\ \\hline
Inscription avec email dupliqué & 409 Conflict & \\checkmark Conforme \\\\ \\hline
Connexion avec bon mot de passe & 200 OK + token JWT & \\checkmark Conforme \\\\ \\hline
Connexion avec mauvais mot de passe & 401 Unauthorized & \\checkmark Conforme \\\\ \\hline
Accès route protégée sans token & 401 Unauthorized & \\checkmark Conforme \\\\ \\hline
Brute force (11\\textsuperscript{e} tentative) & 429 Too Many Requests & \\checkmark Conforme \\\\ \\hline
Onboarding profil biométrique & 200 + profil mis à jour & \\checkmark Conforme \\\\ \\hline
\\end{tabular}
\\caption{Résultats des tests d'intégration -- Sprint 1}
\\end{table}

\\section{Bilan du Sprint 1}
À l'issue de ce premier sprint, les fondations techniques et sécuritaires de GOSPORT sont opérationnelles. L'authentification locale et sociale, la persistance des données via TypeORM, la configuration des Guards Angular et le parcours d'onboarding sont livrés et validés. Ces fondations permettent aux sprints suivants de se concentrer sur les fonctionnalités métier.
`;

// ============================================================
// CHAPITRE 4 - SPRINT 2
// ============================================================
const chap4 = `\\chapter{Sprint 2 : Module de Découverte et de Mise en Relation}
\\minitoc
\\newpage

\\section{Introduction}
La valeur centrale de GOSPORT réside dans la capacité à connecter des athlètes avec des professionnels du sport (coachs, nutritionnistes) de manière fluide et sécurisée. Ce deuxième sprint implémente le cycle complet de mise en relation : la découverte de profils, la consultation des fiches détaillées, et le flux de demandes de coaching incluant leur acceptation ou leur refus.

À l'issue de ce sprint, un athlète peut parcourir l'annuaire des professionnels disponibles sur la plateforme, consulter leurs profils, et envoyer une demande de suivi. Le professionnel peut alors consulter les demandes en attente et décider de les accepter ou de les refuser.

\\section{Backlog du Sprint 2}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\resizebox{\\textwidth}{!}{%
\\begin{tabular}{|c|c|p{5cm}|p{6.5cm}|c|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Acteur} & \\textbf{User Story} & \\textbf{Tâche Technique} & \\textbf{Priorité} \\\\ \\hline
2.1 & Athlète & Découvrir et filtrer les coachs disponibles & GET /api/coaches + filtres (spécialité, tarif, note) & Must \\\\ \\hline
2.2 & Tous & Consulter le profil public d'un professionnel & GET /api/coaches/:id -- page profile-view & Must \\\\ \\hline
2.3 & Athlète & Envoyer une demande de coaching & POST /api/coaching-requests, entité CoachingRequest & Must \\\\ \\hline
2.4 & Coach & Accepter ou refuser une demande & PATCH /api/coaching-requests/:id (status) & Must \\\\ \\hline
2.5 & Athlète & Envoyer une demande à un nutritionniste & POST /api/nutrition-connections & Should \\\\ \\hline
2.6 & Nutritionniste & Répondre à une demande de suivi nutrition & PATCH /api/nutrition-connections/:id & Should \\\\ \\hline
2.7 & Coach & Dissocier un athlète de son suivi & DELETE /api/coaching-requests/:id & Could \\\\ \\hline
\\end{tabular}%
}
\\caption{Backlog du Sprint 2 -- Module de mise en relation}
\\end{table}

\\section{Conception et Modélisation}

\\subsection{Diagramme de Cas d'Utilisation}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint2_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation -- Sprint 2}
\\end{figure}

\\subsection{Diagramme de Classes -- Sprint 2}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint2_Classes.png}
\\caption{Diagramme de classes -- Mise en relation}
\\end{figure}

Les entités clés de ce sprint sont :\\texttt{CoachingRequest} (statut: PENDING \\textbar{} ACCEPTED \\textbar{} REJECTED) et \\texttt{NutritionConnection}. Ces deux entités établissent un lien entre un \\texttt{User} (athlète) et un professionnel (coach ou nutritionniste). Le cycle de vie de cet objet -- de sa création à son acceptation -- est central pour ouvrir l'accès aux fonctionnalités suivantes (programmes, nutrition, messagerie).

\\subsection{Diagramme de Séquence : Demande de Coaching}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint2_Sequence_CoachingRequest.png}
\\caption{Diagramme de séquence -- Cycle de vie d'une demande de coaching}
\\end{figure}

\\section{Architecture Technique}

\\subsection{Endpoints API du Sprint 2}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\begin{tabular}{|l|l|p{7.5cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Méthode} & \\textbf{Route} & \\textbf{Description} \\\\ \\hline
GET & /api/coaches & Lister les coachs (avec filtres et pagination) \\\\ \\hline
GET & /api/coaches/:id & Profil détaillé d'un coach \\\\ \\hline
GET & /api/athletes & Lister les athlètes d'un coach \\\\ \\hline
POST & /api/coaching-requests & Créer une demande de coaching \\\\ \\hline
GET & /api/coaching-requests & Lister les demandes (du coach ou de l'athlète) \\\\ \\hline
PATCH & /api/coaching-requests/:id & Modifier le statut (accept/reject) \\\\ \\hline
POST & /api/nutrition-connections & Demande de suivi nutritionnel \\\\ \\hline
PATCH & /api/nutrition-connections/:id & Répondre à une demande nutrition \\\\ \\hline
\\end{tabular}
\\caption{Endpoints API -- Sprint 2}
\\end{table}

\\subsection{Modèle de Données : CoachingRequest}
L'entité \\texttt{CoachingRequest} est le pivot de ce sprint. Elle porte un statut énuméré qui suit un cycle de vie strict :

\\begin{enumerate}
    \\item \\textbf{PENDING :} État initial créé par la requête \\texttt{POST} de l'athlète.
    \\item \\textbf{ACCEPTED :} Le coach accepte via \\texttt{PATCH} -- la relation de coaching est désormais active.
    \\item \\textbf{REJECTED :} Le coach refuse -- la demande est archivée sans suppression pour traçabilité.
\\end{enumerate}

\\subsection{Pagination et Filtrage des Profils}
La route \\texttt{GET /api/coaches} supporte la pagination et plusieurs critères de filtrage afin d'offrir une expérience de recherche pertinente :
\\begin{itemize}
    \\item \\textbf{?specialty=nutrition} : Filtrage par spécialité professionnelle.
    \\item \\textbf{?maxPrice=100} : Filtrage par tarif mensuel maximum.
    \\item \\textbf{?page=1\\&limit=12} : Pagination des résultats (12 profils par page).
\\end{itemize}

\\section{Réalisation}

\\subsection{Contrôleur de Requêtes de Coaching}
\\begin{lstlisting}[language=JavaScript,
    caption=Extrait de CoachingRequestController.ts]
export const createRequest = async (req: Request, res: Response) => {
  const { coachId, message } = req.body;
  const athleteId = req.user.id;

  // Verification : eviter les doublons actifs
  const existing = await requestRepo.findOne({
    where: { athleteId, coachId,
             status: RequestStatus.PENDING }
  });
  if (existing)
    return res.status(409).json({ message: 'Demande deja envoyee' });

  const request = requestRepo.create({
    athleteId, coachId, message,
    status: RequestStatus.PENDING
  });
  await requestRepo.save(request);

  // Notification au coach
  await notifService.notify(coachId,
    'Nouvelle demande de coaching recue');

  return res.status(201).json(request);
};
\\end{lstlisting}

\\subsection{Composant Discovery -- Angular}
La page de découverte Angular (\\texttt{DiscoveryComponent}) charge dynamiquement les profils depuis l'API et applique les filtres côté client ou serveur selon la configuration choisie. Les profils sont présentés sous forme de cartes (cards) interactives affichant la photo de profil, la note moyenne, la spécialité et le tarif mensuel.

\\begin{lstlisting}[language=JavaScript, caption=Extrait discovery.component.ts]
export class DiscoveryComponent implements OnInit {
  coaches: Coach[] = [];
  filters = { specialty: '', maxPrice: null };

  ngOnInit() { this.loadCoaches(); }

  loadCoaches() {
    this.coachService.getCoaches(this.filters)
      .subscribe(data => this.coaches = data);
  }

  sendRequest(coachId: number) {
    this.coachingService.sendRequest(coachId, '')
      .subscribe({
        next: () => this.toast.success('Demande envoyee !'),
        error: (e) => this.toast.error(e.error.message)
      });
  }
}
\\end{lstlisting}

\\section{Tests et Validation}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{|p{5.5cm}|l|l|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Scénario de test} & \\textbf{Résultat attendu} & \\textbf{Statut} \\\\ \\hline
Lister les coachs (filtres vides) & 200 + liste paginée & \\checkmark Conforme \\\\ \\hline
Filtrer par spécialité & 200 + liste filtrée & \\checkmark Conforme \\\\ \\hline
Envoyer une demande valide & 201 Created & \\checkmark Conforme \\\\ \\hline
Envoi de demande en doublon & 409 Conflict & \\checkmark Conforme \\\\ \\hline
Coach accepte une demande & 200 + status ACCEPTED & \\checkmark Conforme \\\\ \\hline
Coach refuse une demande & 200 + status REJECTED & \\checkmark Conforme \\\\ \\hline
\\end{tabular}
\\caption{Résultats des tests d'intégration -- Sprint 2}
\\end{table}

\\section{Bilan du Sprint 2}
Le module de mise en relation est complet. Les athlètes peuvent désormais explorer la place de marché des professionnels, consulter les profils publics et initier des demandes de coaching ou nutritionnelles. Les coachs disposent d'un tableau de bord pour gérer ces demandes entrantes. L'établissement de ces liens est la clé qui déverrouille l'accès aux fonctionnalités des sprints suivants (partage de programmes, nutrition, messagerie).
`;

// ============================================================
// CHAPITRE 5 - SPRINT 3
// ============================================================
const chap5 = `\\chapter{Sprint 3 : Catalogue d'Exercices, Workout Builder et Workout Player}
\\minitoc
\\newpage

\\section{Introduction}
Ce troisième sprint constitue le coeur de la proposition de valeur sportive de GOSPORT. Il apporte deux innovations majeures : d'un côté, \\textbf{le Workout Builder} (un outil de création de programmes structurés, puissant et intuitif destiné au coach) ; de l'autre, \\textbf{le Workout Player} (un lecteur de séance interactif et immersif destiné à l'athlète, intégrant des chronomètres de repos dynamiques et une validation des séries en temps réel).

L'objectif est de transformer l'acte d'entraînement -- qui était jusque-là une consultation statique d'un PDF -- en une expérience guidée, dynamique et motivante pour l'athlète.

\\section{Backlog du Sprint 3}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\resizebox{\\textwidth}{!}{%
\\begin{tabular}{|c|c|p{5cm}|p{6.5cm}|c|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Acteur} & \\textbf{User Story} & \\textbf{Tâche Technique} & \\textbf{Priorité} \\\\ \\hline
3.1 & Coach & Gérer le catalogue d'exercices & CRUD /api/exercises, entité Exercise & Must \\\\ \\hline
3.2 & Coach & Créer un programme en jours (Workout Builder) & POST /api/programs, cascade Program/ProgramDay/ProgramExercise & Must \\\\ \\hline
3.3 & Coach & Assigner un programme à un athlète & PATCH /api/programs/:id/assign & Must \\\\ \\hline
3.4 & Athlète & Exécuter une séance (Workout Player) & Interface Angular avec timer, validation des séries & Must \\\\ \\hline
3.5 & Athlète & Enregistrer les charges réelles de la séance & POST /api/workout-logs, entité WorkoutLog & Must \\\\ \\hline
3.6 & Athlète & Consulter l'historique des séances passées & GET /api/workout-logs/me & Should \\\\ \\hline
3.7 & Coach & Consulter la progression d'un athlète & GET /api/workout-logs/athlete/:id & Should \\\\ \\hline
\\end{tabular}%
}
\\caption{Backlog du Sprint 3 -- Workout Builder et Player}
\\end{table}

\\section{Conception et Modélisation}

\\subsection{Diagramme de Cas d'Utilisation}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint3_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation -- Sprint 3}
\\end{figure}

\\subsection{Diagramme de Classes : Structure Hiérarchique des Programmes}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint3_Classes.png}
\\caption{Diagramme de classes -- Programmes et Logs d'entraînement}
\\end{figure}

La structure de données du programme d'entraînement est hiérarchique sur trois niveaux :
\\begin{enumerate}
    \\item \\textbf{Program :} Le conteneur principal (nom, description, objectif, template ou assigné).
    \\item \\textbf{ProgramDay :} Chaque jour de la semaine d'entraînement (Jour A, Jour B...) lié au programme parent.
    \\item \\textbf{ProgramExercise :} Chaque exercice du jour, avec ses paramètres précis (séries, répétitions, charge cible, temps de repos en secondes).
\\end{enumerate}

Cette relation est enregistrée en base de données en une seule transaction atomique grâce au \\texttt{QueryRunner} de TypeORM, garantissant l'intégrité des données.

\\subsection{Diagramme de Séquence : Création d'un Programme}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint3_Sequence_SaveProgram.png}
\\caption{Diagramme de séquence -- Sauvegarde transactionnelle d'un programme}
\\end{figure}

\\section{Architecture Technique}

\\subsection{Endpoints API du Sprint 3}
\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\begin{tabular}{|l|l|p{7.5cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Méthode} & \\textbf{Route} & \\textbf{Description} \\\\ \\hline
GET  & /api/exercises & Lister le catalogue d'exercices \\\\ \\hline
POST & /api/exercises & Ajouter un exercice au catalogue \\\\ \\hline
POST & /api/programs  & Créer un programme avec jours et exercices \\\\ \\hline
GET  & /api/programs/my & Lister les programmes du coach \\\\ \\hline
GET  & /api/programs/athlete/:id & Programme actif de l'athlète \\\\ \\hline
PATCH& /api/programs/:id/assign & Assigner un programme à un athlète \\\\ \\hline
POST & /api/workout-logs & Sauvegarder le log d'une séance \\\\ \\hline
GET  & /api/workout-logs/me & Historique des séances de l'athlète \\\\ \\hline
\\end{tabular}
\\caption{Endpoints API -- Sprint 3}
\\end{table}

\\subsection{Transaction TypeORM pour la Création de Programme}
La sauvegarde d'un programme avec tous ses jours et exercices utilise le patron de \\textbf{transaction avec QueryRunner} pour garantir qu'aucune donnée partielle ne soit enregistrée en cas d'erreur :

\\begin{lstlisting}[language=JavaScript, caption=Création transactionnelle d'un programme (ProgramController.ts)]
export const createProgram = async (req, res) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const prog = queryRunner.manager.create(Program, {
      name: req.body.name,
      coachId: req.user.id
    });
    await queryRunner.manager.save(prog);

    for (const day of req.body.days) {
      const pDay = queryRunner.manager.create(ProgramDay, {
        programId: prog.id, dayName: day.name
      });
      await queryRunner.manager.save(pDay);

      for (const ex of day.exercises) {
        const pEx = queryRunner.manager.create(ProgramExercise, {
          programDayId: pDay.id, exerciseId: ex.id,
          sets: ex.sets, reps: ex.reps,
          restTimeSec: ex.restTimeSec
        });
        await queryRunner.manager.save(pEx);
      }
    }
    await queryRunner.commitTransaction();
    res.status(201).json({ id: prog.id });
  } catch (e) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ message: 'Erreur creation programme' });
  } finally {
    await queryRunner.release();
  }
};
\\end{lstlisting}

\\subsection{Workout Player -- Interface Angular}
Le \\texttt{WorkoutPlayerComponent} est le composant Angular le plus riche de l'application. Il orchestre :
\\begin{itemize}
    \\item La navigation entre les exercices du jour sélectionné.
    \\item Pour chaque exercice, un compteur de séries interactif permettant de valider chaque série réalisée avec la charge réelle.
    \\item Un \\textbf{chronomètre de repos} décrémentiel qui se déclenche automatiquement après validation d'une série et alerte l'athlète à la fin du temps de repos avec une notification sonore.
    \\item La sauvegarde automatique du \\texttt{WorkoutLog} complet à la fin de la séance.
\\end{itemize}

\\begin{lstlisting}[language=JavaScript,
    caption=Extrait workout-player.component.ts -- Gestion du timer de repos]
startRestTimer(restSec: number) {
  this.restCountdown = restSec;
  this.timerActive = true;

  const interval = setInterval(() => {
    this.restCountdown--;
    if (this.restCountdown <= 0) {
      clearInterval(interval);
      this.timerActive = false;
      this.playBeep(); // Alerte sonore de fin de repos
    }
  }, 1000);
}

validateSet(exerciseIndex: number, weight: number, reps: number) {
  this.loggedSets[exerciseIndex].push({ weight, reps });
  this.currentSet++;
  this.startRestTimer(this.currentExercise.restTimeSec);
}
\\end{lstlisting}

\\section{Tests et Validation}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{|p{5.5cm}|l|l|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Scénario de test} & \\textbf{Résultat attendu} & \\textbf{Statut} \\\\ \\hline
Créer un programme 3 jours / 5 exercices/jour & 201 Created & \\checkmark Conforme \\\\ \\hline
Rollback sur erreur partielle & 500 + aucune donnée en BDD & \\checkmark Conforme \\\\ \\hline
Assigner un programme à un athlète & 200 OK & \\checkmark Conforme \\\\ \\hline
Workout Player : timer décrémentiel & Décompte correct & \\checkmark Conforme \\\\ \\hline
Sauvegarde du WorkoutLog complet & 201 Created + données BDD & \\checkmark Conforme \\\\ \\hline
Historique des séances passées & 200 + liste chronologique & \\checkmark Conforme \\\\ \\hline
\\end{tabular}
\\caption{Résultats des tests -- Sprint 3}
\\end{table}

\\section{Bilan du Sprint 3}
Le coeur de la valeur sportive de GOSPORT est désormais livré. Le coach dispose d'un Workout Builder puissant pour structurer ses programmes en jours et exercices, et les assigner à ses athlètes. L'athlète, de son côté, bénéficie d'une expérience de séance guidée et interactive avec le Workout Player, remplaçant efficacement le traditionnel PDF imprimé. L'enregistrement des charges réelles constitue la base pour les analyses de progression futures.
`;

// ============================================================
// CHAPITRE 6 - SPRINT 4
// ============================================================
const chap6 = `\\chapter{Sprint 4 : Gestion Nutritionnelle et Objectifs de Santé}
\\minitoc
\\newpage

\\section{Introduction}
La performance sportive ne peut être dissociée d'une nutrition adaptée. Ce quatrième sprint implémente le module nutritionnel complet de GOSPORT, allant de la conception des plans diététiques par les professionnels jusqu'au suivi quotidien des apports macro-nutritionnels par l'athlète.

L'approche adoptée est centrée sur les données : chaque repas consommé est enregistré avec ses macronutriments (protéines, glucides, lipides), permettant un bilan journalier précis et des visualisations graphiques de la conformité alimentaire de l'athlète.

\\section{Backlog du Sprint 4}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\resizebox{\\textwidth}{!}{%
\\begin{tabular}{|c|c|p{5cm}|p{6.5cm}|c|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Acteur} & \\textbf{User Story} & \\textbf{Tâche Technique} & \\textbf{Priorité} \\\\ \\hline
4.1 & Coach/Nutritionniste & Créer un plan alimentaire (Diet Builder) & POST /api/diet, entités DietPlan/DietDay/Meal & Must \\\\ \\hline
4.2 & Coach/Nutritionniste & Assigner un plan à un athlète & PATCH /api/diet/:id/assign & Must \\\\ \\hline
4.3 & Athlète & Logger un repas consommé & POST /api/nutrition/log, entité MealLog & Must \\\\ \\hline
4.4 & Athlète & Consulter le bilan macro du jour & GET /api/nutrition/daily-summary & Must \\\\ \\hline
4.5 & Athlète & Définir ses objectifs caloriques personnels & POST /api/goals, entité Goal & Should \\\\ \\hline
4.6 & Coach & Consulter la conformité nutrition d'un athlète & GET /api/nutrition/athlete/:id/compliance & Should \\\\ \\hline
4.7 & Athlète & Voir l'historique des journées passées & GET /api/nutrition/history & Could \\\\ \\hline
\\end{tabular}%
}
\\caption{Backlog du Sprint 4 -- Nutrition et Objectifs}
\\end{table}

\\section{Conception et Modélisation}

\\subsection{Diagramme de Cas d'Utilisation}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint4_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation -- Sprint 4}
\\end{figure}

\\subsection{Diagramme de Classes : Nutrition}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint4_Classes.png}
\\caption{Diagramme de classes -- Plans nutritionnels et logs}
\\end{figure}

La structure de données nutritionnelle est symétrique à celle des programmes sportifs :
\\begin{itemize}
    \\item \\textbf{DietPlan :} Conteneur principal (nom, objectif calorique global).
    \\item \\textbf{DietDay :} Un jour de la semaine du plan avec ses macros cibles (protéines, glucides, lipides).
    \\item \\textbf{Meal :} Un repas précis du jour (petit-déjeuner, déjeuner, collation, dîner) avec le détail des apports nutritionnels.
    \\item \\textbf{MealLog :} Enregistrement réel de ce que l'athlète a consommé ce jour-là.
\\end{itemize}

\\subsection{Diagramme de Séquence : Logging d'un Repas}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint4_Sequence_LogMeal.png}
\\caption{Diagramme de séquence -- Enregistrement d'un repas consommé}
\\end{figure}

\\section{Architecture Technique}

\\subsection{Endpoints API du Sprint 4}
\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\begin{tabular}{|l|l|p{7.5cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Méthode} & \\textbf{Route} & \\textbf{Description} \\\\ \\hline
POST & /api/diet & Créer un plan diététique complet \\\\ \\hline
GET  & /api/diet/athlete/:id & Plan assigné à un athlète \\\\ \\hline
POST & /api/nutrition/athletes/:id/log & Logger un repas consommé \\\\ \\hline
GET  & /api/nutrition/athletes/:id/logs & Historique des logs d'un athlète \\\\ \\hline
GET  & /api/nutrition/daily-summary & Bilan macro de la journée courante \\\\ \\hline
POST & /api/goals & Créer un objectif santé (poids, calories...) \\\\ \\hline
GET  & /api/goals/me & Objectifs actifs de l'athlète \\\\ \\hline
\\end{tabular}
\\caption{Endpoints API -- Sprint 4}
\\end{table}

\\subsection{Calcul des Totaux Journaliers}
À chaque logging de repas, le serveur recalcule les totaux de la journée en agrégeant tous les \\texttt{MealLog} de la journée pour l'athlète concerné :

\\begin{lstlisting}[language=JavaScript,
    caption=Extrait NutritionController.ts -- Calcul du bilan journalier]
export const getDailySummary = async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const logs = await mealLogRepo.find({
    where: { userId, date: today }
  });

  const totals = logs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein:  acc.protein  + log.protein,
    carbs:    acc.carbs    + log.carbs,
    fats:     acc.fats     + log.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return res.json({ date: today, logs, totals });
};
\\end{lstlisting}

\\subsection{Dashboard Nutrition -- Angular}
Le composant Angular de nutrition affiche des graphiques en temps réel (jauges circulaires et barres de progression) représentant les apports de la journée versus les objectifs fixés :
\\begin{itemize}
    \\item \\textbf{Anneau de progression calorique :} Affiche les calories consommées sur les calories cibles journalières.
    \\item \\textbf{Barres macros :} Trois barres de progression distinctes pour les protéines, glucides et lipides.
    \\item \\textbf{Couleur de seuil :} Les jauges passent au rouge si un macronutriment dépasse l'objectif de 10\\%.
\\end{itemize}

\\section{Tests et Validation}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{|p{5.5cm}|l|l|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Scénario de test} & \\textbf{Résultat attendu} & \\textbf{Statut} \\\\ \\hline
Créer un plan avec 5 jours et repas & 201 Created & \\checkmark Conforme \\\\ \\hline
Logger un repas (valeurs nutritives) & 201 + log enregistré & \\checkmark Conforme \\\\ \\hline
Calcul du bilan journalier correct & Totaux agrégés exacts & \\checkmark Conforme \\\\ \\hline
Dépassement des macros (jauges rouges) & Affichage rouge correct & \\checkmark Conforme \\\\ \\hline
Créer et consulter un objectif santé & 201 + 200 liste objectifs & \\checkmark Conforme \\\\ \\hline
\\end{tabular}
\\caption{Résultats des tests -- Sprint 4}
\\end{table}

\\section{Bilan du Sprint 4}
Le module nutritionnel complet est opérationnel. Les nutritionnistes et coachs peuvent concevoir des plans diététiques détaillés avec des objectifs macros quotidiens. Les athlètes peuvent logger leurs repas et suivre leur conformité alimentaire en temps réel grâce aux graphiques du dashboard. Les objectifs de santé définissent le cap sur le long terme.
`;

// ============================================================
// CHAPITRE 7 - SPRINT 5
// ============================================================
const chap7 = `\\chapter{Sprint 5 : Messagerie Instantanée, Copilote IA et Agendas}
\\minitoc
\\newpage

\\section{Introduction}
La communication est la dimension humaine indispensable au coaching de qualité. Ce cinquième sprint introduit les fonctionnalités de communication et d'intelligence artificielle : une messagerie instantanée bidirectionnelle fonctionnant en temps réel grâce aux WebSockets, un assistant IA basé sur l'API Google Gemini, et un système de réservation de sessions de visioconférence avec intégration Jitsi Meet.

\\section{Backlog du Sprint 5}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\resizebox{\\textwidth}{!}{%
\\begin{tabular}{|c|c|p{5cm}|p{6.5cm}|c|}
\\hline
\\rowcolor[HTML]{DAE8FC}
\\textbf{ID} & \\textbf{Acteur} & \\textbf{User Story} & \\textbf{Tâche Technique} & \\textbf{Priorité} \\\\ \\hline
5.1 & Tous & Envoyer et recevoir des messages en temps réel & Socket.io, événements send/receive, entité Message & Must \\\\ \\hline
5.2 & Tous & Consulter la liste de ses contacts (coachs/athlètes) & GET /api/chat/contacts, logique relationnelle & Must \\\\ \\hline
5.3 & Tous & Voir l'historique d'une conversation & GET /api/chat/messages/:userId & Must \\\\ \\hline
5.4 & Coach/Athlète & Poser une question au copilote IA & POST /api/ai/ask, intégration Gemini API & Should \\\\ \\hline
5.5 & Coach & Créer une session de visioconférence & POST /api/sessions, génération lien Jitsi & Should \\\\ \\hline
5.6 & Athlète & Consulter ses sessions réservées & GET /api/sessions/me & Should \\\\ \\hline
5.7 & Tous & Recevoir des notifications non lues & GET /api/notifications, système de badges & Could \\\\ \\hline
\\end{tabular}%
}
\\caption{Backlog du Sprint 5 -- Messagerie, IA et Agendas}
\\end{table}

\\section{Conception et Modélisation}

\\subsection{Diagramme de Cas d'Utilisation}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint5_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation -- Sprint 5}
\\end{figure}

\\subsection{Diagramme de Classes -- Sprint 5}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint5_Classes.png}
\\caption{Diagramme de classes -- Messagerie et Sessions}
\\end{figure}

\\subsection{Diagramme de Séquence : Messagerie Instantanée}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint5_Sequence_Message.png}
\\caption{Diagramme de séquence -- Flux de messagerie WebSocket}
\\end{figure}

\\section{Architecture Technique}

\\subsection{Architecture WebSocket avec Socket.io}
Le module de messagerie repose sur une architecture événementielle bidirectionnelle (\\textit{event-driven}) implémentée avec \\textbf{Socket.io}. Contrairement aux requêtes HTTP classiques (requête-réponse), les WebSockets maintiennent une connexion permanente (\\textit{persistent connection}) entre le client et le serveur, permettant des échanges en temps réel sans polling.

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\begin{tabular}{|l|l|p{7cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Événement} & \\textbf{Direction} & \\textbf{Description} \\\\ \\hline
\\texttt{connection} & Client $\\rightarrow$ Serveur & Connexion initiale du client avec son JWT \\\\ \\hline
\\texttt{join\\_room} & Client $\\rightarrow$ Serveur & Rejoindre la salle de conversation privée \\\\ \\hline
\\texttt{send\\_message} & Client $\\rightarrow$ Serveur & Envoyer un message (persisté en BDD) \\\\ \\hline
\\texttt{new\\_message} & Serveur $\\rightarrow$ Client & Notification d'un nouveau message reçu \\\\ \\hline
\\texttt{typing} & Client $\\rightarrow$ Serveur & Indicateur de frappe en cours \\\\ \\hline
\\texttt{stop\\_typing} & Client $\\rightarrow$ Serveur & Arrêt de la frappe \\\\ \\hline
\\texttt{disconnect} & Client $\\rightarrow$ Serveur & Déconnexion du client \\\\ \\hline
\\end{tabular}
\\caption{Événements Socket.io -- Module de messagerie}
\\end{table}

\\subsection{Service SocketService Backend}
\\begin{lstlisting}[language=JavaScript,
    caption=Extrait SocketService.ts -- Gestion des événements]
export class SocketService {
  private connectedClients = new Map<number, Socket>();

  init(server: http.Server) {
    const io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL }
    });

    io.on('connection', (socket) => {
      const userId = extractUserIdFromSocket(socket);
      this.connectedClients.set(userId, socket);

      socket.on('send_message', async (data) => {
        const message = await this.saveMessage(data);

        // Envoie au destinataire s'il est connecte
        const recipientSocket =
          this.connectedClients.get(data.recipientId);
        if (recipientSocket)
          recipientSocket.emit('new_message', message);
      });

      socket.on('disconnect', () => {
        this.connectedClients.delete(userId);
      });
    });
  }
}
\\end{lstlisting}

\\subsection{Intégration du Copilote IA -- Google Gemini}
L'\\texttt{AIService} encapsule les appels à l'API Google Gemini (\\texttt{gemini-pro}). Il enrichit le prompt utilisateur avec un contexte sportif (objectifs de l'athlète, programme actif) pour obtenir des réponses contextualisées et pertinentes.

\\begin{lstlisting}[language=JavaScript,
    caption=Extrait AIController.ts -- Appel à l'API Gemini]
export const askAI = async (req: Request, res: Response) => {
  const { question, athleteContext } = req.body;

  const systemContext = \`Tu es un assistant coach sportif expert.
  Profil de l'athlete : \${JSON.stringify(athleteContext)}.
  Reponds en francais, de facon concise et pratique.\`;

  const result = await geminiModel.generateContent(
    systemContext + '\\n\\nQuestion: ' + question
  );
  const answer = result.response.text();

  return res.json({ answer });
};
\\end{lstlisting}

\\subsection{Génération des Liens de Visioconférence Jitsi}
Chaque session de coaching créée génère automatiquement un lien de réunion unique sur \\textbf{Jitsi Meet}. Jitsi est une solution de visioconférence open-source qui ne nécessite aucune installation côté client et supporte jusqu'à plusieurs dizaines de participants.

Le lien est généré côté serveur en combinant un identifiant unique (UUID v4) avec le domaine public de Jitsi :

\\begin{lstlisting}[language=JavaScript,
    caption=Génération du lien Jitsi dans SessionController.ts]
export const createSession = async (req, res) => {
  const { coachId, athleteId, scheduledAt } = req.body;
  const roomId = uuidv4().replace(/-/g, '').substring(0, 16);
  const meetingLink =
    \`https://meet.jit.si/GOSPORT-\${roomId}\`;

  const session = sessionRepo.create({
    coachId, athleteId, scheduledAt, meetingLink,
    status: SessionStatus.SCHEDULED
  });
  await sessionRepo.save(session);

  return res.status(201).json(session);
};
\\end{lstlisting}

\\section{Tests et Validation}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{|p{5.5cm}|l|l|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Scénario de test} & \\textbf{Résultat attendu} & \\textbf{Statut} \\\\ \\hline
Connexion WebSocket avec JWT valide & Socket connecté & \\checkmark Conforme \\\\ \\hline
Envoi message à destinataire connecté & Réception temps réel & \\checkmark Conforme \\\\ \\hline
Envoi message à destinataire hors ligne & Message persisté en BDD & \\checkmark Conforme \\\\ \\hline
Prompt IA simple & Réponse cohérente Gemini & \\checkmark Conforme \\\\ \\hline
Prompt IA avec contexte athlète & Réponse contextualisée & \\checkmark Conforme \\\\ \\hline
Création session avec lien Jitsi & 201 + lien HTTPS valide & \\checkmark Conforme \\\\ \\hline
\\end{tabular}
\\caption{Résultats des tests -- Sprint 5}
\\end{table}

\\section{Bilan du Sprint 5}
Les trois piliers de ce sprint -- messagerie WebSocket, copilote IA et gestion des agendas -- transforment GOSPORT en une plateforme de communication vivante et intelligente. La messagerie en temps réel élimine le recours à WhatsApp pour le suivi, l'IA apporte une valeur ajoutée différenciante, et les sessions de visioconférence intégrées ferment la boucle de la relation coach-athlète à distance.
`;

fs.writeFileSync('chapitre3.tex', chap3);
fs.writeFileSync('chapitre4.tex', chap4);
fs.writeFileSync('chapitre5.tex', chap5);
fs.writeFileSync('chapitre6.tex', chap6);
fs.writeFileSync('chapitre7.tex', chap7);

console.log('All 5 sprint chapters (3-7) written successfully.');
