# Document de Conception Architecturale - Projet MOBA ARAM (Proof of Concept)

> Source spec for this project, preserved verbatim as the reference document. Implementation
> milestones (see [ROADMAP.md](./ROADMAP.md)) derive their scope from the sections below and
> cite them by number — when in doubt about a design detail, this document is the source of
> truth, not the milestone summaries.

## 1. Vue d'ensemble du Projet
Ce document définit l'architecture et les spécifications d'un Proof of Concept (POC) pour un jeu de type MOBA (Multiplayer Online Battle Arena) se déroulant sur une seule voie (ARAM - All Random All Mid). Le jeu sera entièrement jouable dans un navigateur web, utilisant une architecture réseau Peer-to-Peer (P2P) avec un modèle d'hôte (Listen Server) pour assurer la synchronisation et limiter la triche.

Le POC vise à valider les mécaniques de base : déplacement, collisions, pathfinding, système de combat (attaques automatiques, sorts, dégâts de zone, projectiles), gestion des vagues de sbires, bâtiments défensifs, et boucle de jeu réseau. L'esthétique sera minimaliste, basée sur des formes géométriques simples pour faciliter le développement rapide.

---

## 2. Stack Technologique Choisie

*   **Moteur de Rendu 3D :** Babylon.js (Excellent pour la gestion des caméras isométriques, l'instanciation de milliers de projectiles, et la gestion des inputs).
*   **Moteur Physique (Optionnel mais recommandé pour les collisions robustes) :** Havok (natif dans Babylon.js) ou Rapier.js. *Pour ce POC, nous utiliserons la détection de collision intégrée à Babylon.js (IntersectsMesh et Raycasting) couplée à un moteur de navigation pour simplifier, car nous n'avons pas besoin de physique complexe avec rebonds réalistes, mais plutôt de boîtes de collision pour les hitbox et les tirs.*
*   **Intelligence Artificielle & Pathfinding :** Yuka.js (Couplé à Babylon.js). Essentiel pour le pathfinding (NavMesh) point-and-click des héros et le comportement (Steering behaviors) des vagues de sbires.
*   **Réseau (Signaling) :** Un micro-serveur Node.js avec Socket.io ou Bun avec uWebSockets. Son seul rôle est de mettre en relation les joueurs pour établir les connexions P2P.
*   **Réseau (P2P Data) :** PeerJS ou Geckos.io (WebRTC Data Channels) pour la communication UDP-like (faible latence) entre l'hôte et les clients.
*   **Langage :** TypeScript (Indispensable pour maintenir un code de jeu structuré).
*   **Outil de création de map :** Blender (Export en `.glb` avec un NavMesh).

> **Écart avec l'implémentation (Milestone 1) :** le runtime/gestionnaire de paquets est Bun (au
> lieu de Node.js pour le tooling local), le bundler est Vite exécuté via Bun, et l'UI HTML/CSS
> superposée (section 7.2) utilise SolidJS. Ce sont des choix de performance faits pendant le
> Milestone 1, cohérents avec l'esprit "TypeScript + tooling moderne" de cette section.

---

## 3. Architecture Réseau (Modèle "Hôte Autoritaire")

Le système repose sur une topologie en étoile où un joueur fait office de serveur.

1.  **L'Hôte (Serveur Logique) :**
    *   Fait tourner la boucle de jeu principale invisible (`GameLogic`).
    *   Valide tous les déplacements (utilise le NavMesh pour vérifier qu'un joueur ne traverse pas un mur).
    *   Calcule les dégâts, les points de vie, les temps de recharge (cooldowns).
    *   Gère le cycle de vie des entités (apparition des vagues de sbires, destruction des tours).
    *   Diffuse l'état du jeu (Positions, HP, États d'animation) à tous les clients à un rythme fixe (ex: 20 ou 30 ticks par seconde).
2.  **Les Clients (Navigateurs des autres joueurs) :**
    *   N'exécutent que le rendu visuel (Babylon.js).
    *   Envoient leurs inputs (Ex: "Clic à la coordonnée X,Z", "Appui sur la touche A avec le vecteur de visée V") à l'Hôte.
    *   Appliquent la **Prédiction Client** : Quand le joueur clique pour bouger, le client commence le déplacement localement sans attendre la validation de l'hôte pour éviter la sensation de lag. L'hôte corrige la position si nécessaire lors du prochain *tick*.
    *   Interpôlent les positions des autres entités reçues depuis l'hôte pour un rendu fluide entre les *ticks* réseau.

---

## 4. Spécifications du Level Design (La Map ARAM)

La carte est un long couloir droit rectangulaire (ex: `100x` sur `500z`).

### 4.1. Composition des Bases (Symétrie parfaite)

Chaque équipe (Équipe Bleu vs Équipe Rouge) possède de son côté :
1.  **L'Idole (Le Cœur) :**
    *   *Visuel :* Un grand Octaèdre flottant et pulsant.
    *   *Comportement :* Cible l'ennemi le plus proche.
    *   *Attaque :* Fappe fort, attaque de zone (AoE) avec un rayon de X mètres autour de l'impact. Lent.
2.  **Les 2 Forts :**
    *   *Visuel :* Des grands Cylindres massifs.
    *   *Comportement :* Ciblent l'ennemi le plus proche (Priorité: Sbire > Héros).
    *   *Attaque :* Mono-cible, cadence moyenne, dégâts très élevés.
    *   *Effet :* Applique un débuff de "Vulnérabilité" (Les dégâts subis par la cible sont augmentés de 15% pendant 2 secondes).
3.  **Les 2 Tours Extérieures :**
    *   *Visuel :* Des Prismes rectangulaires dressés.
    *   *Comportement :* Ciblent l'ennemi le plus proche. Dégâts modérés.
4.  **Le Mur Destructible :**
    *   *Visuel :* Un assemblage de blocs rectangulaires plats bloquant le passage devant les Tours extérieures.
    *   *Comportement :* Bloque le pathfinding. Possède ses propres points de vie. Une fois détruit, le NavMesh est mis à jour (ou un obstacle statique est retiré) pour permettre le passage.

> **État Milestone 1 :** le mur existe comme mesh statique + trou fixe dans le NavMesh (voir
> `src/game/map/destructibleWall.ts` et `src/game/navigation/navMeshBuilder.ts`), avec un HP
> stocké mais inerte. La destruction du mur et la mise à jour du NavMesh associée sont prévues au
> Milestone 3 (voir [milestone-3-advanced-systems.md](./milestone-3-advanced-systems.md)). Les
> Forts, Tours et Idole ne sont pas encore implémentés — également Milestone 3.

---

## 5. Spécifications des Entités (IA)

### 5.1. Vagues de Sbires (Minions)
*   **Spawn :** Toutes les 30 secondes, aux pieds de l'Idole.
*   **Composition d'une vague :** 3 Mêlées, 1 Mage, 3 Distances.
*   **Comportement (Yuka.js) :** Avancent en ligne droite vers la base ennemie le long de *waypoints*.
*   **Priorité de Ciblage :** 1. Sbires ennemis -> 2. Héros ennemis -> 3. Structures (Murs, Tours, Forts, Idole).

*   **Le Mêlée (CAC) :**
    *   *Visuel Corps :* Petit Cube.
    *   *Visuel Arme :* Petit triangle rattaché au cube.
    *   *Attaque :* Doit être au contact. Animation de poussée de l'arme.
*   **Le Distance (Ranged) :**
    *   *Visuel Corps :* Petit Cylindre.
    *   *Visuel Arme :* Petit cylindre fin horizontal (arc/fusil).
    *   *Attaque :* Tire de petits projectiles sphériques rapides.
*   **Le Mage :**
    *   *Visuel Corps :* Petit Cône inversé.
    *   *Visuel Arme :* Sphère flottant au-dessus de lui.
    *   *Attaque :* Tire des projectiles pyramidaux lents mais faisant des dégâts de zone à l'impact.

---

## 6. Spécifications des Héros

Au lancement, le joueur choisit un héros. Les statistiques (HP, Mana, Vitesse, Dégâts) seront équilibrées itérativement.

### 6.1. Héros 1 : "Apex" (Le Tireur à distance)
*   **Rôle :** Dégâts constants, fragile (ADC/Sniper).
*   **Visuel Corps :** Un grand Tétraèdre (Pyramide à base triangulaire) inversé (pointe vers le bas).
*   **Visuel Arme :** Un long prisme fin sur le côté (Sniper).
*   **Attaque Auto :** Tire un projectile fin et rapide (Cylindre étiré).
*   **Sort A (Piercing Ray) :** Charge brièvement puis tire un rayon continu (Box/Cylindre long généré dynamiquement) en ligne droite. Transperce toutes les cibles et inflige de lourds dégâts.
*   **Sort B (Cone of Shards) :** Projette une volée de particules (multiples petits triangles) en forme de cône (triangle 2D au sol) devant lui. Dégâts de zone instantanés.
*   **Sort C (Tactical Shift) :** Un "Dash". Déplace instantanément le héros sur une courte distance dans la direction de la souris. Offre des *frames* d'invulnérabilité pendant le trajet (0.2s).

### 6.2. Héros 2 : "Brutus" (Le Combattant de Mêlée)
*   **Rôle :** Encaisseur (Bruiser/Tank), perturbations.
*   **Visuel Corps :** Un gros Cube trapu avec des bords biseautés.
*   **Visuel Arme :** Un énorme prisme rectangulaire (marteau géant) devant lui.
*   **Attaque Auto :** Frappe lente au corps-à-corps en arc de cercle devant lui (Dégâts de zone légers, "Cleave").
*   **Sort A (Hammer Smash) :** Frappe violemment le sol. Créé un effet visuel de fissure. Étourdit (Stun) la cible touchée pendant 2 secondes (incapable de bouger ou d'attaquer).
*   **Sort B (Berserker Overdrive) :** Devient rouge vif. Passe en mode rage pendant 4 secondes. Vitesse de déplacement augmentée de 20%, vitesse d'attaque multipliée par 3. Les attaques auto deviennent un tourbillon frénétique.
*   **Sort C (Earth Tremor / Burrow) :** Plonge dans le sol (le modèle disparaît, ne laissant qu'un effet de poussière au sol) le rendant inciblable pendant 1s. Ressort violemment à la même position, appliquant un *Knockback* (repousse physiquement) tous les ennemis dans un cercle autour de lui.

### 6.3. Héros 3 : "Aura" (Le Soigneur / Support)
*   **Rôle :** Maintien en vie de l'équipe, contrôle de zone.
*   **Visuel Corps :** Une grande Sphère flottante.
*   **Visuel Arme :** Un anneau lumineux rotatif (Torus) autour de la sphère.
*   **Attaque Auto :** Tire des petites sphères lumineuses (dégâts faibles).
*   **Sort A (Healing Pulse) :** Lance un projectile lent qui voyage vers l'allié ciblé ou le sol. S'il touche un allié, le soigne. S'il atteint sa destination, il explose et soigne en petite zone.
*   **Sort B (Reflecting Barrier) :** Place un mur rectangulaire translucide (Mesh plan) à l'endroit ciblé. Ce mur bloque et détruit tous les projectiles ennemis qui le traversent pendant 3 secondes.
*   **Sort C (Harmonic Tether) :** Crée un lien visuel (un cylindre fin ou des particules) entre Aura et un allié pendant 4 secondes. Tant que le lien n'est pas rompu (en s'éloignant trop), une partie des dégâts subis par l'allié est redirigée vers Aura, et l'allié gagne de la régénération de vie.

> **État Milestone 1 :** les 3 héros existent en tant que formes géométriques statiques (voir
> `src/game/heroes/`), sans HP/Mana/sorts. Le pathfinding point-and-click ne fonctionne que pour
> Apex (le héros contrôlé par défaut, `CONTROLLED_HERO_ID` dans `src/game/map/mapConfig.ts`).
> Brutus a un corps cube simple sans biseaux (Babylon.js n'a pas de primitive "rounded box"
> native — un détail d'art différé). Les sorts de tous les héros sont Milestone 3.
>
> **État Milestone 2 :** les 3 héros ont maintenant HP + rayon de collision + stats d'attaque auto
> (`src/game/combat/heroStats.ts`, valeurs provisoires). L'attaque auto d'Apex (projectile
> cylindrique fin) est câblée de bout en bout ; celles de Brutus (cleave mêlée) et Aura (orbes
> homing) ont leurs stats définies mais ne tirent pas encore. Mana et sorts restent Milestone 3.

---

## 7. Contrôles et Interface (UX/UI)

### 7.1. Gestion des Contrôles (Souris & Clavier)
Le jeu doit supporter nativement les configurations clavier US (QWERTY) et FR (AZERTY), ainsi que le mappage personnalisé.

*   **Mapping par défaut (Système par position physique) :** L'API Web `KeyboardEvent.code` doit être utilisée au lieu de `KeyboardEvent.key`. Par exemple, `KeyQ` sur un clavier AZERTY correspondra au A d'un clavier QWERTY.
*   **Déplacement (Smart Cast / Point & Click) :**
    *   Clic Droit sur le sol : Se déplace à la position (Pathfinding via NavMesh pour contourner les obstacles/murs).
    *   Clic Droit sur un ennemi : Se déplace à portée d'attaque, puis déclenche l'attaque automatique en boucle tant que la cible est à portée et vivante.
*   **Sorts (Q, W, E, R ou A, Z, E, R selon clavier local) :**
    *   Appui sur la touche + Curseur de la souris : Déclenche le sort dans la direction du curseur ou à la position du curseur (selon le type de sort : Rayon vs Zone ciblée).
*   **Caméra :** Caméra isométrique bloquée sur le héros (FollowCamera), ou libre (mouvement de caméra en bord d'écran, centrage sur la touche Espace). *Recommandation POC: Caméra verrouillée souple sur le héros pour simplifier.*

> **État Milestone 1 :** clic droit sur le sol → déplacement avec pathfinding est implémenté
> (`src/game/input/pointerInput.ts`, `KeyboardEvent.code` déjà utilisé pour le toggle de debug
> NavMesh). Clic droit sur un ennemi + attaque auto en boucle, et les touches de sorts, sont
> Milestone 2/3.
>
> **État Milestone 2 :** clic droit sur un ennemi (Brutus/Aura, `registerRightClickCommand` dans
> `pointerInput.ts`) déplace Apex à portée puis déclenche l'attaque auto en boucle
> (`src/game/combat/autoAttackController.ts`) tant que la cible est à portée et vivante ; clic
> droit sur le sol annule la cible en cours. Les touches de sorts restent Milestone 3.

### 7.2. Interface Utilisateur (UI HTML/CSS superposée au Canvas)
*   **Barre de vie (au-dessus des entités) :** Rouge pour les ennemis, Vert pour les alliés. Division visuelle (ex: 1 trait tous les 100 HP) pour estimer la robustesse d'un coup d'œil.
*   **HUD en bas :**
    *   Portrait du héros.
    *   Barre de vie (HP) et barre de ressource (Mana ou Énergie).
    *   Icônes des sorts (A, B, C) avec un overlay sombre indiquant le temps de recharge restant (Cooldown radial).
*   **Indicateurs de ciblage (Decals au sol) :** Quand le joueur maintient un bouton de sort avant de relâcher (ou pour les sorts de zone), projeter une texture au sol (ligne, cercle, cône) via `Babylon.js Decals` ou un Mesh semi-transparent pour montrer la zone d'effet prévue.

> **État Milestone 1 :** le HUD SolidJS (`src/ui/HudRoot.tsx`) est un conteneur vide
> (`pointer-events: none`) prêt à recevoir ces widgets — aucun n'est encore implémenté.
>
> **État Milestone 2 :** toujours aucun widget dans `HudRoot.tsx`. À la place, un simple
> résumé HP/état en DOM brut (non Solid, non stylé) est monté directement par
> `src/game/bootstrap.ts` (`src/game/combat/hpDebugOverlay.ts`) — un remplaçant temporaire
> explicitement permis par milestone-2-combat.md, à retirer quand les vraies barres de vie
> (Milestone 3.5) existeront.

---

## 8. Phases de Développement (Recommandations pour Claude)

> Voir [ROADMAP.md](./ROADMAP.md) pour le découpage en milestones réellement utilisé — condensé
> à partir des 5 phases ci-dessous après le Milestone 1.

1.  **Phase 1 : Socle et Rendu**
    *   Initialisation d'une scène Babylon.js.
    *   Génération de la map de base (sol plat, ajout du mur cassable).
    *   Création visuelle des 3 Héros (formes géométriques de base) et de la caméra de suivi.
2.  **Phase 2 : Déplacements et Pathfinding (Client local)**
    *   Intégration de Yuka.js.
    *   Génération d'un Navigation Mesh rudimentaire (un grand rectangle, troué au niveau du mur cassable).
    *   Logique de déplacement au Clic Droit avec calcul de chemin.
3.  **Phase 3 : Logique de Combat (Client local)**
    *   Mise en place de la machine à états (Idle, Moving, Attacking, Casting, Dead).
    *   Implémentation des projectiles (Babylon.js Instanced Meshes pour les performances).
    *   Détection de collision (Intersection des projectiles avec les boîtes englobantes des entités).
    *   Gestion des HP et destructions.
4.  **Phase 4 : Systèmes Avancés**
    *   Création des classes de Sorts (Dash, Stun, Barrière) et leurs effets visuels et logiques temporaires.
    *   Implémentation du spawner de vagues de sbires et de leurs comportements autonomes.
    *   Logique des tourelles et de l'idole.
5.  **Phase 5 : Architecture Réseau (Le gros morceau)**
    *   Séparation du code en Logique Pure (Hôte) et Affichage (Client).
    *   Mise en place de la boucle de tick serveur (Update de la physique, des cooldowns, des IA).
    *   Génération des "Snapshots" d'état et envoi via WebRTC/WebSocket.
    *   Implémentation de la prédiction client pour les déplacements du joueur local.
