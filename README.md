# Signature électronique Google Docs vers Yousign

> Module Google Apps Script pour l'envoi automatisé de contrats Google Docs en signature électronique multi-signataires via l'API Yousign.

Ce projet ajoute un menu personnalisé dans Google Docs qui transforme un contrat rédigé dans le document en une procédure de signature Yousign, sans saisie manuelle des signataires. Les parties au contrat (prénom, nom, email) sont détectées automatiquement à partir du texte, puis préparées pour la création de la procédure de signature.

## Fonctionnalités

- **Menu intégré à Google Docs** : un bouton « Envoi pour signature » directement dans la barre de menu du document.
- **Détection automatique des signataires** : extraction du bloc des parties (situé entre les mots-clés `ENTRE` et `ci-après`), puis structuration par un modèle de langage.
- **Sortie normalisée** : chaque signataire est renvoyé au format `Prénom Nom | email`, prêt à être transmis à l'API Yousign.
- **Persistance** : les signataires détectés sont conservés dans les propriétés du document pour alimenter les étapes suivantes (création de la procédure, paraphes, blocs de signature, retour du PDF signé).

## Fonctionnement

```
Google Doc (contrat)
        |
        v
 Menu « Contrats » -> « Envoi pour signature »
        |
        v
 Extraction du bloc des parties  (ENTRE ... ci-après)
        |
        v
 Analyse par modèle de langage -> [Prénom Nom | email] x N
        |
        v
 Stockage des signataires -> procédure Yousign
```

## Périmètre de ce dépôt

Le code publié ici couvre la **détection et la préparation des signataires**, qui constitue le cœur de l'automatisation. Cette brique alimente ensuite la création de la procédure côté Yousign : envoi du document en signature, placement des paraphes et des blocs de signature, apposition de la signature du propriétaire du compte, et retour du PDF signé dans un dossier Google Drive prédéfini.

## Installation

1. Ouvrir un Google Doc, puis **Extensions** → **Apps Script**.
2. Copier le contenu de [`Code.gs`](./Code.gs) dans l'éditeur.
3. Renseigner la clé API dans **Paramètres du projet** → **Propriétés du script** :
   - Propriété : `OPENAI_API_KEY`
   - Valeur : votre clé OpenAI
4. Enregistrer, puis recharger le document. Le menu **Contrats** apparaît.

La clé API n'est jamais écrite dans le code : elle est lue depuis les *Script Properties*.

## Configuration

Les paramètres sont regroupés dans l'objet `CONFIG` en haut de [`Code.gs`](./Code.gs).

| Paramètre | Rôle | Valeur par défaut |
|---|---|---|
| `START_KEYWORD` | Début du bloc des parties | `ENTRE` |
| `END_KEYWORD` | Fin du bloc des parties | `ci-après` |
| `OPENAI_MODEL` | Modèle utilisé pour l'extraction | `gpt-3.5-turbo` |

## Stack technique

- **Google Apps Script** (runtime V8) : add-on Google Docs, `PropertiesService`, `UrlFetchApp`
- **API OpenAI** : extraction structurée des signataires
- **API Yousign** : procédure de signature électronique
- **Google Docs / Google Drive** : source du contrat et réception du PDF signé

## Format de document attendu

Le script repère les signataires dans l'en-tête du contrat, entre les mots-clés configurés. Un exemple de structure avec des données fictives est disponible dans [`exemple-structure-document.md`](./exemple-structure-document.md).

## Licence

Distribué sous licence MIT. Voir [`LICENSE`](./LICENSE).
