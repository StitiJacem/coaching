# Guide de Test - Fonctionnalité Fullstack GOSPORT

## ✅ Fonctionnalité Complète Prête à Tester

### Ce qui a été implémenté :

#### Backend (API REST)
1. **Programs CRUD** - `/api/programs`
   - GET `/api/programs` - Liste avec filtres (coachId, athleteId, status)
   - GET `/api/programs/:id` - Détails d'un programme
   - POST `/api/programs` - Créer un programme
   - PUT `/api/programs/:id` - Mettre à jour
   - DELETE `/api/programs/:id` - Supprimer

2. **Sessions CRUD** - `/api/sessions`
   - GET `/api/sessions` - Liste avec filtres (athleteId, programId, date, status)
   - GET `/api/sessions/:id` - Détails d'une session
   - POST `/api/sessions` - Créer une session
   - PUT `/api/sessions/:id` - Mettre à jour
   - DELETE `/api/sessions/:id` - Supprimer

3. **Goals CRUD** - `/api/goals`
   - GET `/api/goals` - Liste avec filtres (athleteId, status)
   - GET `/api/goals/:id` - Détails d'un objectif
   - POST `/api/goals` - Créer un objectif
   - PUT `/api/goals/:id` - Mettre à jour
   - DELETE `/api/goals/:id` - Supprimer

4. **Athletes** - `/api/athletes`
   - GET `/api/athletes` - Liste avec recherche
   - GET `/api/athletes/:id` - Détails d'un athlète
   - GET `/api/athletes/:id/stats` - Statistiques d'un athlète
   - PUT `/api/athletes/:id` - Mettre à jour le profil

5. **Dashboard** - `/api/dashboard`
   - GET `/api/dashboard/stats?role=coach|athlete` - Statistiques
   - GET `/api/dashboard/sessions/today` - Sessions du jour
   - GET `/api/dashboard/athletes/recent` - Athlètes récents

**Toutes les routes sont protégées par authentification JWT**

#### Frontend (Angular)
1. **Services créés** :
   - `ProgramService` - Gestion des programmes
   - `SessionService` - Gestion des sessions
   - `GoalService` - Gestion des objectifs
   - `AthleteService` - Gestion des athlètes
   - `DashboardService` - Mis à jour pour utiliser les vraies APIs

2. **Dashboard connecté** :
   - Charge les statistiques depuis l'API
   - Affiche les sessions du jour depuis l'API
   - Affiche les athlètes récents depuis l'API
   - Gestion des erreurs et états de chargement

## 🚀 Comment Tester

### Prérequis
1. Base de données PostgreSQL en cours d'exécution
2. Variables d'environnement configurées (`.env` dans backend)
3. Données de seed dans la base (seeder automatique au démarrage)

### Étape 1 : Démarrer le Backend

```bash
cd backend
npm install  # Si pas déjà fait
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000`

### Étape 2 : Démarrer le Frontend

```bash
cd Frontend
npm install  # Si pas déjà fait
ng serve
```

Le frontend devrait démarrer sur `http://localhost:4200`

### Étape 3 : Se Connecter

1. Aller sur `http://localhost:4200/login`
2. Utiliser les credentials du seeder :
   - Email: `coach@escd.tn`
   - Password: `password123`
   - OU pour un athlète : `sarah@example.com` / `password123`

### Étape 4 : Tester le Dashboard

Une fois connecté, vous devriez voir :
- **Stats Cards** : Statistiques chargées depuis l'API
- **Today's Schedule** : Sessions du jour depuis l'API
- **Recent Athletes** : Athlètes récents depuis l'API

### Étape 5 : Tester les APIs avec Postman/Thunder Client

1. **Obtenir un token** :
   ```
   POST http://localhost:3000/auth/login
   Body: {
     "email": "coach@escd.tn",
     "password": "password123"
   }
   ```

2. **Tester les endpoints** (avec le token dans header `Authorization: Bearer <token>`) :
   ```
   GET http://localhost:3000/api/programs
   GET http://localhost:3000/api/sessions
   GET http://localhost:3000/api/goals
   GET http://localhost:3000/api/athletes
   ```

## 📋 Endpoints Disponibles

### Authentification
- `POST /auth/signup` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/verify-email` - Vérification email
- `POST /auth/resend-code` - Renvoyer code
- `POST /auth/google` - OAuth Google
- `POST /auth/facebook` - OAuth Facebook

### Dashboard
- `GET /api/dashboard/stats?role=coach` - Stats dashboard
- `GET /api/dashboard/sessions/today` - Sessions du jour
- `GET /api/dashboard/athletes/recent` - Athlètes récents

### Programs
- `GET /api/programs?coachId=1&status=active`
- `GET /api/programs/:id`
- `POST /api/programs`
- `PUT /api/programs/:id`
- `DELETE /api/programs/:id`

### Sessions
- `GET /api/sessions?athleteId=1&date=2025-02-14`
- `GET /api/sessions/:id`
- `POST /api/sessions`
- `PUT /api/sessions/:id`
- `DELETE /api/sessions/:id`

### Goals
- `GET /api/goals?athleteId=1&status=active`
- `GET /api/goals/:id`
- `POST /api/goals`
- `PUT /api/goals/:id`
- `DELETE /api/goals/:id`

### Athletes
- `GET /api/athletes?search=sarah`
- `GET /api/athletes/:id`
- `GET /api/athletes/:id/stats`
- `PUT /api/athletes/:id`

## ✅ Checklist de Test

- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Connexion fonctionne
- [ ] Dashboard affiche les stats
- [ ] Sessions du jour s'affichent
- [ ] Athlètes récents s'affichent
- [ ] APIs répondent avec authentification
- [ ] CRUD Programs fonctionne
- [ ] CRUD Sessions fonctionne
- [ ] CRUD Goals fonctionne
- [ ] Athletes endpoints fonctionnent

## 🐛 Problèmes Potentiels

1. **CORS** : Si erreur CORS, vérifier que le backend autorise `http://localhost:4200`
2. **Token expiré** : Se reconnecter si le token expire
3. **Base de données** : Vérifier que PostgreSQL est démarré et accessible
4. **Ports** : Vérifier que les ports 3000 (backend) et 4200 (frontend) sont libres

## 📝 Notes

- Les données sont seedées automatiquement au démarrage du backend
- Toutes les routes API nécessitent un token JWT valide
- Le dashboard charge les données en temps réel depuis l'API
- Les erreurs sont loggées dans la console du navigateur et du serveur
