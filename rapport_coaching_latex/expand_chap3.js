const fs = require('fs');

const content = `\\chapter{Sprint 1 : Socle Technique, Authentification et Onboarding}
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
1.1 & Tous & ETQ utilisateur, je veux créer un compte avec email/mot de passe & Endpoint POST /api/auth/signup, entité User, hachage bcrypt & Must \\\\ \\hline
1.2 & Tous & ETQ utilisateur, je veux me connecter et recevoir un jeton d'accès & Endpoint POST /api/auth/login, génération JWT, middleware auth & Must \\\\ \\hline
1.3 & Tous & ETQ utilisateur, je veux me connecter avec mon compte Google & Route OAuth2 Google, OAuthController, callback de redirection & Must \\\\ \\hline
1.4 & Tous & ETQ utilisateur, je veux vérifier mon adresse e-mail & Envoi d'OTP par email, endpoint /verify-email & Should \\\\ \\hline
1.5 & Tous & ETQ utilisateur, je veux réinitialiser mon mot de passe & Endpoint /forgot-password, token OTP temporaire & Should \\\\ \\hline
1.6 & Athlète & ETQ athlète, je veux compléter mon profil biométrique initial & Formulaire Angular multi-étapes, endpoint PATCH /profile & Must \\\\ \\hline
1.7 & Coach & ETQ coach, je veux renseigner mon profil professionnel & Entité CoachProfile, champs bio/spécialité/tarif & Must \\\\ \\hline
\\end{tabular}%
}
\\caption{Backlog du Sprint 1}
\\end{table}

\\section{Conception Détaillée}

\\subsection{Diagramme de Cas d'Utilisation}
Le diagramme ci-dessous représente l'ensemble des interactions des différents acteurs avec les fonctionnalités d'accès et de gestion des profils développées lors de ce sprint.

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.88\\textwidth]{Sprint1_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation -- Sprint 1}
\\end{figure}

\\paragraph{Description des cas d'utilisation principaux :}
\\begin{itemize}
    \\item \\textbf{Créer un compte :} L'utilisateur renseigne son adresse e-mail, un mot de passe (min. 8 caractères) et son rôle (Coach, Athlète ou Nutritionniste). Le système valide les données, hache le mot de passe et persiste l'entité.
    \\item \\textbf{S'authentifier :} L'utilisateur soumet ses identifiants. Le serveur compare le mot de passe soumis avec le hash stocké via \\texttt{bcrypt.compare()}, puis génère et retourne un JSON Web Token signé.
    \\item \\textbf{OAuth Google :} L'utilisateur est redirigé vers la page de consentement Google. Après autorisation, Google retourne un code d'accès que le serveur échange contre les informations du profil utilisateur.
    \\item \\textbf{Compléter profil (Onboarding) :} Flux multi-étapes guidant l'athlète pour saisir ses données biométriques (poids, taille, âge, niveau d'activité et objectifs), et le coach pour configurer son expertise et ses certifications.
\\end{itemize}

\\subsection{Diagramme de Classes}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint1_Classes.png}
\\caption{Diagramme de classes -- Sprint 1}
\\end{figure}

Les entités centrales de ce sprint sont :\\texttt{User}, \\texttt{Coach}, \\texttt{Athlete} et \\texttt{NutritionistProfile}. L'entité \\texttt{User} porte les attributs communs (email, rôle, statut de vérification), tandis que les entités dérivées stockent les attributs métier spécifiques à chaque rôle.

\\subsection{Diagramme de Séquence : Authentification}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint1_Sequence_Auth.png}
\\caption{Diagramme de séquence -- Flux d'authentification JWT}
\\end{figure}

Le flux d'authentification suit les étapes suivantes :
\\begin{enumerate}
    \\item L'utilisateur saisit ses identifiants dans le formulaire Angular \\texttt{LoginComponent}.
    \\item Le service \\texttt{AuthService} envoie une requête \\texttt{POST /api/auth/login} avec les identifiants en corps JSON.
    \\item Le \\texttt{AuthController} appelle le \\texttt{AuthService} backend qui interroge PostgreSQL via TypeORM.
    \\item Le hash stocké est comparé via \\texttt{bcrypt.compare(plainPassword, hash)}.
    \\item En cas de succès, un JWT est signé avec la clé secrète et une durée d'expiration de 7 jours.
    \\item Le frontend stocke le token dans le \\texttt{localStorage} et le \\texttt{AuthGuard} Angular redirige vers le Dashboard.
\\end{enumerate}

\\section{Architecture Technique et Choix Technologiques}

\\subsection{Stack Backend : Node.js, Express et TypeORM}
Le backend de GOSPORT est architecturé selon le patron \\textbf{MVC (Modèle-Vue-Contrôleur)} adapté au contexte d'une API REST :

\\begin{itemize}
    \\item \\textbf{Model (Entités TypeORM) :} Les classes TypeScript décorées représentent les tables PostgreSQL. Le mapping Objet-Relationnel (ORM) est géré par TypeORM, éliminant les requêtes SQL brutes et garantissant la sécurité face aux injections SQL.
    \\item \\textbf{Contrôleurs :} Chaque contrôleur (\\texttt{AuthController}, \\texttt{UserController}) est responsable d'un domaine fonctionnel. Il reçoit la requête HTTP, délègue la logique métier au service correspondant et retourne la réponse.
    \\item \\textbf{Services :} La couche service encapsule toute la logique applicative (hachage, génération de tokens, envoi d'emails) et est indépendante du protocole HTTP.
\\end{itemize}

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\begin{tabular}{|l|l|p{8cm}|}
\\hline
\\rowcolor[HTML]{D5E8D4}
\\textbf{Méthode} & \\textbf{Route} & \\textbf{Description} \\\\ \\hline
POST & /api/auth/signup & Création d'un nouveau compte utilisateur \\\\ \\hline
POST & /api/auth/login & Authentification et génération du JWT \\\\ \\hline
GET & /api/auth/google & Initialisation du flux OAuth2 Google \\\\ \\hline
GET & /api/auth/google/callback & Traitement du retour OAuth2 \\\\ \\hline
POST & /api/auth/verify-email & Vérification de l'OTP email \\\\ \\hline
POST & /api/auth/forgot-password & Demande de réinitialisation \\\\ \\hline
PATCH & /api/users/:id/profile & Mise à jour du profil utilisateur \\\\ \\hline
\\end{tabular}
\\caption{Endpoints API -- Sprint 1}
\\end{table}

\\subsection{Sécurité Applicative}
La sécurité est au cœur de ce premier sprint. Plusieurs mécanismes complémentaires ont été mis en place :

\\begin{itemize}
    \\item \\textbf{Hachage bcrypt (coût 12) :} Le mot de passe n'est jamais stocké en clair. L'algorithme bcrypt avec un facteur de coût élevé (\\texttt{saltRounds = 12}) est utilisé, le rendant résistant aux attaques par dictionnaire et par force brute.
    \\item \\textbf{JSON Web Tokens (JWT) :} Chaque requête protégée doit porter un en-tête \\texttt{Authorization: Bearer <token>}. Le middleware \\texttt{authenticate.ts} décode et valide ce token avant de laisser passer la requête.
    \\item \\textbf{Limitation de débit (Rate Limiting) :} Le module \\texttt{express-rate-limit} est configuré pour bloquer les requêtes en rafale sur les routes d'authentification (max. 10 tentatives par fenêtre de 15 minutes par adresse IP).
    \\item \\textbf{Protection CORS :} La liste blanche des origines autorisées à interroger l'API est configurée dans \\texttt{app.ts}.
\\end{itemize}

\\subsection{Stack Frontend : Angular avec Formulaires Réactifs}
L'application web Angular utilise les \\textbf{Reactive Forms} (\\texttt{FormBuilder}, \\texttt{Validators}) pour tous les formulaires d'authentification. Cette approche offre une validation synchrone puissante, un contrôle fin de l'état de chaque champ (pristine, dirty, valid, invalid) et une testabilité unitaire accrue.

\\begin{itemize}
    \\item \\textbf{AuthGuard :} Implémente \\texttt{CanActivate}. Il vérifie la présence et la validité du JWT stocké avant d'autoriser l'accès aux routes protégées.
    \\item \\textbf{RoleGuard :} Implémente \\texttt{CanActivate}. Il vérifie que le rôle de l'utilisateur authentifié correspond au rôle requis par la route (\\texttt{COACH}, \\texttt{ATHLETE}, \\texttt{ADMIN}).
    \\item \\textbf{HTTP Interceptor :} Injecte automatiquement le token JWT dans l'en-tête de chaque requête HTTP sortante, évitant la duplication de code dans chaque service.
\\end{itemize}

\\section{Réalisation}

\\subsection{Implémentation Backend : Entité User}
L'entité centrale \\texttt{User} est définie avec TypeORM et comporte les champs fondamentaux pour la gestion des comptes et l'authentification.

\\begin{lstlisting}[language=JavaScript, caption=Extrait de l'entité User.ts (TypeORM)]
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
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

\\subsection{Implémentation Backend : Logique d'Authentification}
Le contrôleur d'authentification gère la création de compte avec validation et hachage :

\\begin{lstlisting}[language=JavaScript, caption=Extrait de AuthController.ts]
export const signup = async (req: Request, res: Response) => {
  const { email, password, role, firstName, lastName } = req.body;

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email deja utilise' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = userRepo.create({
    email, passwordHash, role, firstName, lastName,
    is_verified: false
  });
  await userRepo.save(user);

  const otp = generateOTP();
  await sendVerificationEmail(email, otp);

  return res.status(201).json({ message: 'Compte cree. Verifie ton email.' });
};
\\end{lstlisting}

\\subsection{Implémentation Frontend : Stepper d'Onboarding}
Le composant \\texttt{CompleteProfileComponent} utilise un stepper Angular Material (ou équivalent Tailwind) pour guider l'athlète en plusieurs étapes :

\\begin{lstlisting}[language=JavaScript, caption=Extrait de complete-profile.component.ts]
export class CompleteProfileComponent implements OnInit {
  currentStep = 0;
  totalSteps = 3;

  profileForm = this.fb.group({
    step1: this.fb.group({
      weight: [null, [Validators.required, Validators.min(30)]],
      height: [null, [Validators.required, Validators.min(100)]],
      age:    [null, [Validators.required, Validators.min(10)]],
    }),
    step2: this.fb.group({
      fitnessGoal:   ['', Validators.required],
      activityLevel: ['', Validators.required],
    }),
    step3: this.fb.group({
      bio: [''],
    })
  });

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) this.currentStep++;
  }

  async submitProfile() {
    const data = this.profileForm.value;
    await this.userService.updateProfile(data).toPromise();
    this.router.navigate(['/dashboard']);
  }
}
\\end{lstlisting}

\\section{Tests et Validation du Sprint 1}

\\subsection{Tests d'Intégration API}
Les endpoints d'authentification ont été testés via \\textbf{Postman} avec les scénarios suivants :

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{|p{4cm}|l|p{6cm}|}
\\hline
\\rowcolor[HTML]{FFF2CC}
\\textbf{Scénario de test} & \\textbf{Résultat attendu} & \\textbf{Résultat obtenu} \\\\ \\hline
Inscription avec email valide & 201 Created + message & \\checkmark Conforme \\\\ \\hline
Inscription avec email dupliqué & 409 Conflict & \\checkmark Conforme \\\\ \\hline
Connexion avec bon mot de passe & 200 OK + token JWT & \\checkmark Conforme \\\\ \\hline
Connexion avec mauvais MDP & 401 Unauthorized & \\checkmark Conforme \\\\ \\hline
Accès route protégée sans token & 401 Unauthorized & \\checkmark Conforme \\\\ \\hline
Accès route protégée avec token expiré & 401 Token expired & \\checkmark Conforme \\\\ \\hline
Brute force (11e tentative) & 429 Too Many Requests & \\checkmark Conforme \\\\ \\hline
\\end{tabular}
\\caption{Résultats des tests d'intégration -- Sprint 1}
\\end{table}

\\subsection{Tests Frontend}
Les formulaires Angular ont fait l'objet de tests de validation manuels pour chaque règle :\\begin{itemize}
    \\item Champ email : validation du format RFC 5322 (\\texttt{Validators.email}).
    \\item Mot de passe : longueur minimale 8 caractères, présence d'un chiffre.
    \\item Confirmation de mot de passe : validateur croisé personnalisé (\\texttt{passwordMatchValidator}).
\\end{itemize}

\\section{Résultat et Bilan du Sprint 1}
À l'issue de ce premier sprint, les livrables suivants ont été validés :
\\begin{itemize}
    \\item Base de données PostgreSQL initialisée avec les entités de base et leurs relations.
    \\item Authentification locale (email + mot de passe) et sociale (Google OAuth2) pleinement fonctionnelles.
    \\item Génération et validation de tokens JWT avec protection par middleware.
    \\item Application Angular configurée avec Guards, Interceptors et formulaires réactifs.
    \\item Formulaire d'onboarding multi-étapes pour l'athlète et le coach.
    \\item Vérification par email via envoi d'un OTP.
\\end{itemize}

Ce sprint a posé les fondations indispensables qui permettront aux sprints suivants de se concentrer exclusivement sur les fonctionnalités métier, la sécurité et la persistance des données étant désormais garanties.
`;

fs.writeFileSync('chapitre3.tex', content);
console.log('chapitre3.tex generated');
