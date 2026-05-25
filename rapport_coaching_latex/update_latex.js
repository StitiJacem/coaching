const fs = require('fs');
const path = require('path');

// ==================== CHAPITRE 2 ====================
const chap2 = `\\newcolumntype{C}[1]{>{\\centering\\arraybackslash}m{#1}}
\\chapter{Analyse et spécification des besoins} 
\\minitoc
\\newpage

\\section{Introduction}
Dans le chapitre précédent, nous avons analysé le contexte général de notre projet et défini le cadre méthodologique Agile Scrum. Dans ce deuxième chapitre, nous entrons au cœur de l'ingénierie logicielle. Nous allons d’abord identifier avec précision les différents acteurs de notre système, pour ensuite dégager de manière exhaustive les besoins fonctionnels et non fonctionnels de notre projet. Ces besoins seront traduits sous la forme d'un Product Backlog priorisé structuré en 5 Sprints. Enfin, nous procèderons à une modélisation poussée via le diagramme de cas d'utilisation global et présenterons les choix d'architecture de l'application.

\\section{Spécification des besoins}
La spécification des exigences consiste à traduire les objectifs de haut niveau en un ensemble de fonctionnalités ciblées pour les développeurs et utilisateurs.

\\subsection{Identification des acteurs}
Nous distinguons trois acteurs principaux disposant de privilèges d'accès spécifiques :
\\begin{itemize}
    \\item \\textbf{L’Administrateur :} Il interagit via la console web Angular pour assurer la gouvernance globale (statistiques KPIs, modération des utilisateurs, gestion de la bibliothèque d'exercices).
    \\item \\textbf{Le Coach (ou Nutritionniste) :} Professionnel qui gère son profil, crée des programmes d'entraînement et plans nutritionnels, et suit la progression des athlètes.
    \\item \\textbf{L’Athlète :} Utilisateur final qui recherche des professionnels, suit ses séances d'entraînement interactives, logge ses repas et suit ses métriques de santé.
\\end{itemize}

\\subsection{Besoins fonctionnels}
\\subsubsection{Besoins de l'Administrateur}
\\begin{itemize}
    \\item S'authentifier sur le tableau de bord web.
    \\item Suivre les indicateurs clés (utilisateurs inscrits, abonnements).
    \\item Gérer la bibliothèque globale d'exercices.
    \\item Gérer les comptes utilisateurs (bannissement/réactivation).
\\end{itemize}

\\subsubsection{Besoins du Coach}
\\begin{itemize}
    \\item Configurer son profil public (spécialités, tarifs).
    \\item Valider/refuser les demandes de coaching.
    \\item Concevoir des programmes sportifs et plans diététiques.
    \\item Suivre la conformité de l'athlète via des historiques et messagerie.
\\end{itemize}

\\subsubsection{Besoins de l'Athlète}
\\begin{itemize}
    \\item Créer un compte et compléter son onboarding biométrique.
    \\item Rechercher un coach ou nutritionniste et envoyer des demandes.
    \\item Lancer des séances d'entraînement via le Workout Player.
    \\item Renseigner ses repas pour un calcul immédiat des macronutriments.
    \\item Échanger en direct par chat ou visioconférence.
\\end{itemize}

\\subsection{Besoins non fonctionnels}
\\begin{itemize}
    \\item \\textbf{Sécurité :} Mots de passe hachés avec bcrypt, communication protégée par des tokens JWT.
    \\item \\textbf{Performance :} Temps de chargement réduits, messagerie instantanée réactive avec WebSockets.
    \\item \\textbf{Ergonomie :} Design adaptatif moderne (Angular/Tailwind CSS), formulaires réactifs robustes.
\\end{itemize}

\\section{Product Backlog}
Le Product Backlog est découpé en 5 Sprints selon la méthodologie MoSCoW.

\\begin{table}[H]
\\centering
\\renewcommand{\\arraystretch}{1.4}
\\resizebox{\\textwidth}{!}{%
\\begin{tabular}{|>{\\centering\\arraybackslash}p{1.2cm}|p{3cm}|>{\\centering\\arraybackslash}p{1cm}|p{2cm}|p{7cm}|>{\\centering\\arraybackslash}p{1.5cm}|}
\\hline
\\rowcolor[HTML]{EFEFEF} 
\\textbf{Sprint} & \\textbf{Épopée (Epic)} & \\textbf{ID} & \\textbf{Acteur} & \\textbf{User Story} & \\textbf{Priorité} \\\\ \\hline
1 & \\multirow{3}{3cm}{Socle \\& Authentification}
& 1.1 & Tous & ETQ utilisateur, je veux créer un compte sécurisé et utiliser Google OAuth. & Must \\\\ \\cline{3-6}
& & 1.2 & Athlète & ETQ athlète, je veux compléter mon profil d'onboarding biométrique. & Must \\\\ \\cline{3-6}
& & 1.3 & Tous & ETQ utilisateur, je veux me connecter avec un token JWT sécurisé. & Must \\\\ \\hline
2 & \\multirow{2}{3cm}{Mise en relation}
& 2.1 & Athlète & ETQ athlète, je veux rechercher des professionnels et envoyer des demandes. & Must \\\\ \\cline{3-6}
& & 2.2 & Coach & ETQ coach, je veux accepter ou refuser des demandes de coaching. & Must \\\\ \\hline
3 & \\multirow{3}{3cm}{Entraînement}
& 3.1 & Coach & ETQ coach, je veux construire un programme avec jours et exercices. & Must \\\\ \\cline{3-6}
& & 3.2 & Athlète & ETQ athlète, je veux exécuter ma séance via le Workout Player interactif. & Must \\\\ \\cline{3-6}
& & 3.3 & Athlète & ETQ athlète, je veux consulter l'historique de mes séances effectuées. & Should \\\\ \\hline
4 & \\multirow{2}{3cm}{Nutrition \\& Objectifs}
& 4.1 & Coach & ETQ coach, je veux bâtir des plans diététiques (Diet Builder). & Should \\\\ \\cline{3-6}
& & 4.2 & Athlète & ETQ athlète, je veux logger mes repas et suivre mes objectifs de macros. & Should \\\\ \\hline
5 & \\multirow{3}{3cm}{Interactivité \\& IA}
& 5.1 & Tous & ETQ utilisateur, je veux chatter en temps réel avec mon coach/athlète. & Should \\\\ \\cline{3-6}
& & 5.2 & Tous & ETQ utilisateur, je veux réserver des séances et lancer un appel visio. & Could \\\\ \\cline{3-6}
& & 5.3 & Coach/Ath & ETQ utilisateur, je veux consulter le copilote IA pour des conseils. & Could \\\\ \\hline
\\end{tabular}%
}
\\caption{Product Backlog détaillé en 5 Sprints}
\\end{table}

\\section{Modélisation et Diagrammes Globaux}
Les figures suivantes représentent le cas d'utilisation global et le diagramme de classes global de l'écosystème web.

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Global_Cas_Utilisation.png}
\\caption{Diagramme des cas d'utilisation global}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.95\\textwidth]{Global_Classes.png}
\\caption{Diagramme de classes global}
\\end{figure}

\\section{Architecture Technique 3-Tiers}
La plateforme adopte une architecture physique 3-Tiers robuste, séparant la présentation, la logique applicative et les données.

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Architecture_3_Tiers.png}
\\caption{Architecture physique 3-Tiers}
\\end{figure}

\\section{Technologies Utilisées}
Dans le cadre de la réalisation de la plateforme GOSPORT, nous avons sélectionné un ensemble de technologies modernes et performantes. Afin de répondre aux exigences de scalabilité, d'interactivité et de robustesse, le choix s'est porté sur un écosystème homogène et éprouvé dans l'industrie.

\\subsection{Angular (Interface Web)}
Angular est un framework de développement d'applications web monophages (Single Page Applications - SPA) côté client, développé et maintenu par Google. Reposant entièrement sur TypeScript, Angular impose une architecture hautement structurée en composants, modules, services et directives.

Dans le projet GOSPORT, Angular a été choisi pour concevoir le portail d'administration web et la console de gestion destinée aux professionnels (coachs et nutritionnistes). Sa force réside dans son mécanisme d'injection de dépendances qui rend le code modulaire, son système de routage avancé pour la navigation entre les différents modules, et ses formulaires réactifs (Reactive Forms) puissants qui facilitent la saisie et la validation des données d'onboarding et des programmes d'entraînement.

\\begin{figure}[H]
\\centering
\\includegraphics[width=2.5cm]{angular.png}
\\caption{Logo du framework Angular}
\\end{figure}

\\subsection{Flutter (Application Mobile)}
Flutter est un kit de développement logiciel (SDK) d'interface utilisateur open source développé par Google. Il permet de concevoir des applications compilées nativement pour le mobile (iOS et Android), le web et le bureau à partir d'une seule base de code écrite en Dart.

Pour GOSPORT, Flutter a été sélectionné pour réaliser l'application mobile dédiée aux athlètes. Son moteur de rendu graphique performant permet un affichage à 60 ou 120 images par seconde, assurant des animations fluides indispensables lors de l'exécution des séances via le Workout Player. De plus, son architecture basée sur des widgets réutilisables et son système de rafraîchissement à chaud (Hot Reload) ont grandement accéléré les phases de conception et d'intégration de l'interface utilisateur.

\\begin{figure}[H]
\\centering
\\includegraphics[width=2.5cm]{flutter.png}
\\caption{Logo du SDK Flutter}
\\end{figure}

\\subsection{Node.js et Express (API Backend)}
Node.js est un environnement d'exécution JavaScript côté serveur asynchrone et orienté événements, construit sur le moteur V8 de Google Chrome. Express est un framework Web minimaliste et flexible conçu pour structurer les applications basées sur Node.js.

Ils forment le socle du backend de la plateforme GOSPORT. Ce choix se justifie par les performances exceptionnelles du modèle d'E/S non-bloquant de Node.js, idéal pour gérer des requêtes concurrentes massives (notamment pour le chat en temps réel avec WebSockets). De plus, l'adoption de TypeScript et de l'ORM TypeORM permet de maintenir une structure typée et ordonnée, cohérente avec le frontend Angular, simplifiant ainsi la maintenance du code et l'évolution de la base de données.

\\begin{figure}[H]
\\centering
\\includegraphics[width=3cm]{nodejs.png}
\\caption{Logo de Node.js}
\\end{figure}

\\subsection{PostgreSQL (Base de Données)}
PostgreSQL est un système de gestion de base de données relationnelle et objet (SGBDR) libre et très puissant, réputé pour sa fiabilité, sa robustesse et sa conformité aux standards SQL.

Au sein de GOSPORT, il sert de base de données principale pour stocker toutes les données relationnelles : comptes utilisateurs, profils biométriques, relations coach-athlète, programmes d'entraînement, plans diététiques, logs de nutrition, messages de chat et transactions financières. L'utilisation de PostgreSQL garantit le respect de l'intégrité référentielle, le support des transactions ACID, et offre la flexibilité nécessaire pour exécuter des requêtes d'agrégation complexes indispensables à la génération des graphiques de progression de l'athlète et des indicateurs de performance (KPIs) de l'administration.

\\begin{figure}[H]
\\centering
\\includegraphics[width=2.5cm]{postgresql.png}
\\caption{Logo de la base de données PostgreSQL}
\\end{figure}

`;



// ==================== CHAPITRE 3 ====================
const chap3 = `\\chapter{Sprint 1 : Socle Technique, Authentification et Onboarding}
\\minitoc
\\newpage

\\section{Introduction}
Le premier sprint est fondamental pour mettre en place l'architecture technique, sécuriser les accès et permettre la création des profils utilisateurs.

\\section{Objectifs du Sprint}
\\begin{itemize}
    \\item Initialiser le backend Node.js (Express, TypeORM, PostgreSQL).
    \\item Implémenter l'authentification locale (JWT, bcrypt) et Google OAuth.
    \\item Mettre en place l'application Angular avec les formulaires d'accès et l'onboarding.
\\end{itemize}

\\section{Conception Détaillée}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint1_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation - Sprint 1}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint1_Classes.png}
\\caption{Diagramme de classes - Sprint 1}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.8\\textwidth]{Sprint1_Sequence_Auth.png}
\\caption{Diagramme de séquence - Authentification}
\\end{figure}

\\section{Implémentation Technique}
Le backend expose les routes de l'API auth (\\texttt{/api/auth/login}, \\texttt{/api/auth/signup}, \\texttt{/api/auth/google}). 
Côté Frontend Angular, le \\texttt{AuthService} gère le stockage du jeton JWT. L'onboarding capture les données physiques initiales dans \\texttt{complete-profile.component.ts} via des formulaires réactifs.
`;

// ==================== CHAPITRE 4 ====================
const chap4 = `\\chapter{Sprint 2 : Module de Découverte et de Mise en Relation}
\\minitoc
\\newpage

\\section{Introduction}
Ce sprint connecte les athlètes avec les professionnels du sport et de la nutrition à travers des profils publics et un flux de demandes de mise en relation.

\\section{Objectifs du Sprint}
\\begin{itemize}
    \\item Développer les routes backend de recherche de coachs et de requêtes.
    \\item Créer la page de découverte (Discovery) sur Angular.
    \\item Implémenter le tableau de bord d'acceptation/refus des relations.
\\end{itemize}

\\section{Conception Détaillée}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint2_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation - Sprint 2}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint2_Classes.png}
\\caption{Diagramme de classes - Sprint 2}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint2_Sequence_CoachingRequest.png}
\\caption{Diagramme de séquence - Demande de coaching}
\\end{figure}

\\section{Implémentation Technique}
Le \\texttt{CoachingRequestController} gère la création des enregistrements dans PostgreSQL avec le statut \\texttt{PENDING}. Côté Angular, la vue \\texttt{discovery.component.html} présente les profils sous forme de cartes et permet d'initier une demande de coaching ou de nutrition.
`;

// ==================== CHAPITRE 5 ====================
const chap5 = `\\chapter{Sprint 3 : Catalogue d'Exercices, Workout Builder et Workout Player}
\\minitoc
\\newpage

\\section{Introduction}
Ce sprint fournit le cœur du suivi sportif : la construction de séances d'entraînement complexes et leur exécution active en temps réel.

\\section{Objectifs du Sprint}
\\begin{itemize}
    \\item Modéliser les entités sportives (Programmes, Jours, Exercices, Logs).
    \\item Créer l'éditeur de programme côté Coach (Workout Builder).
    \\item Développer l'interface de lecture interactive des séances côté Athlète (Workout Player) avec chronomètres de repos.
\\end{itemize}

\\section{Conception Détaillée}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint3_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation - Sprint 3}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint3_Classes.png}
\\caption{Diagramme de classes - Sprint 3}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.8\\textwidth]{Sprint3_Sequence_SaveProgram.png}
\\caption{Diagramme de séquence - Sauvegarde d'un programme}
\\end{figure}

\\section{Implémentation Technique}
Le \\texttt{WorkoutPlayerComponent} sous Angular utilise des timers asynchrones JavaScript pour guider l'athlète durant sa séance (séries, répétitions, et minuteur de repos). Les charges réelles sont sauvegardées dans \\texttt{WorkoutLog} et reliées à la base pour évaluer la surcharge progressive.
`;

// ==================== CHAPITRE 6 ====================
const chap6 = `\\chapter{Sprint 4 : Gestion Nutritionnelle et Objectifs de Santé}
\\minitoc
\\newpage

\\section{Introduction}
La nutrition étant une composante vitale du suivi, ce sprint offre des outils de planification et de suivi diététique précis combinés avec des objectifs généraux.

\\section{Objectifs du Sprint}
\\begin{itemize}
    \\item Créer le module diététique backend (DietPlan, Meals, MealLogs).
    \\item Développer le Diet Builder pour les nutritionnistes et coachs.
    \\item Implémenter le Dashboard de nutrition avec graphiques de macronutriments.
\\end{itemize}

\\section{Conception Détaillée}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint4_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation - Sprint 4}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint4_Classes.png}
\\caption{Diagramme de classes - Sprint 4}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.8\\textwidth]{Sprint4_Sequence_LogMeal.png}
\\caption{Diagramme de séquence - Logging de repas}
\\end{figure}

\\section{Implémentation Technique}
Le \\texttt{DietController} calcule en direct les apports énergétiques. Côté Angular, nous utilisons des jauges de progression graphiques affichant les apports en Protéines, Glucides et Lipides consommés en comparaison avec les objectifs fixés.
`;

// ==================== CHAPITRE 7 ====================
const chap7 = `\\chapter{Sprint 5 : Messagerie Instantanée, Copilote IA et Agendas}
\\minitoc
\\newpage

\\section{Introduction}
Ce sprint favorise l'interactivité en temps réel via un chat instantané, des réservations de sessions avec appels vidéo, et des conseils générés par IA.

\\section{Objectifs du Sprint}
\\begin{itemize}
    \\item Configurer WebSockets via Socket.io pour la messagerie instantanée.
    \\item Intégrer l'IA Google Gemini pour l'aide à la conception de séances.
    \\item Implémenter la planification de séances de visioconférence.
\\end{itemize}

\\section{Conception Détaillée}
\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint5_Cas_Utilisation.png}
\\caption{Diagramme de cas d'utilisation - Sprint 5}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.9\\textwidth]{Sprint5_Classes.png}
\\caption{Diagramme de classes - Sprint 5}
\\end{figure}

\\begin{figure}[H]
\\centering
\\includegraphics[width=0.85\\textwidth]{Sprint5_Sequence_Message.png}
\\caption{Diagramme de séquence - Messagerie instantanée}
\\end{figure}

\\section{Implémentation Technique}
Le \\texttt{SocketService} backend gère les salons de chat. Le \\texttt{AIService} traite les prompts des utilisateurs et interroge Gemini pour renvoyer des alternatives d'exercices ou des conseils physiologiques. Les sessions intègrent des liens éphémères s'ouvrant sur Jitsi Meet.
`;

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'chapitre2.tex'), chap2);
fs.writeFileSync(path.join(dir, 'chapitre3.tex'), chap3);
fs.writeFileSync(path.join(dir, 'chapitre4.tex'), chap4);
fs.writeFileSync(path.join(dir, 'chapitre5.tex'), chap5);
fs.writeFileSync(path.join(dir, 'chapitre6.tex'), chap6);
fs.writeFileSync(path.join(dir, 'chapitre7.tex'), chap7);

console.log("Mise à jour des chapitres LaTeX effectuée avec succès.");
