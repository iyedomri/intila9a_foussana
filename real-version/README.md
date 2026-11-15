# Intila9a Foussana — Version Réelle de Production

Ce dossier contient la configuration, les scripts d’initialisation et les guides opérationnels pour la **version réelle de production** du portail de l'école primaire **Intila9a Foussana**.

---

## 1. Identité et Gouvernance de l'Établissement

- **Établissement** : École primaire Intila9a Foussana (Classes de la 1<sup>re</sup> à la 6<sup>e</sup> année).
- **Directeur de l'établissement** : **M. Fethi Omri**
- **Comptes d'accès Direction** :
  - Identifiants reconnus : `directeur@ecole-foussana.tn`, `fethi.omri@ecole-foussana.tn`, ou `director@demo.intila9a.local`
  - Mot de passe : Code secret confidentiel (haché avec Argon2id — jamais stocké en clair) ou configurable via la variable d'environnement `DIRECTOR_PASSWORD`.
- **Comptes Enseignants** :
  - Mot de passe d'accès professionnel : `intila9a2027` (ou `intila9a2026`)
  - Les enseignants publient leurs cours, exercices, devoirs et examens avec pièces jointes PDF (jusqu'à 15 Mo).
- **Espaces Élèves et Parents** :
  - Classes réinitialisées et vidées de toute fausse donnée de démonstration.
  - Seuls les contenus réels publiés par les enseignants et la Direction s'affichent dans les fils de classe.

---

## 2. Démarrage de la Version Réelle

### En environnement local / serveur :

```bash
# Se placer à la racine du projet
cd ..

# Lancer la version de production
./real-version/start-production.sh
```

### Déploiement sur Vercel :

Consultez le guide complet dans [`../docs/DEPLOYMENT_VERCEL.md`](../docs/DEPLOYMENT_VERCEL.md).
- Pour un déploiement Vercel immédiat sans base de données : Définir `ENABLE_DEMO_MODE=true` et `APP_MODE=demo`.
- Pour la production avec PostgreSQL : Définir `APP_MODE=production` et `DATABASE_URL`.

---

## 3. Sécurité et Confidentialité

1. **Hachage Argon2id** : Tous les mots de passe sont vérifiés avec l'algorithme standard Argon2id (recommandé par l'OWASP).
2. **Confidentialité des mots de passe** : Aucun mot de passe secret de la Direction n'est écrit en clair dans le code ou les commits.
3. **Suppression des aides démo** :
   - Les bandeaux d'aide de démo et les boutons de remplissage automatique ont été intégralement retirés.
   - Les formulaires de connexion sont épurés et sécurisés (`/login`, `/teacher-access`, `/director-access`).
4. **Classes vides et propres** :
   - Les maquettes de leçons d'exemple ont été supprimées.
   - Les classes 1 à 6 sont prêtes à accueillir les cours et devoirs réels rédigés par le corps enseignant.
