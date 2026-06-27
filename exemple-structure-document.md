# Exemple de structure de document

Le script extrait les signataires à partir du bloc situé entre les mots-clés
`ENTRE` et `ci-après`. Voici un exemple de structure attendue. **Toutes les
données ci-dessous sont fictives** et servent uniquement d'illustration.

---

```
CONTRAT DE PRESTATION

ENTRE

Jean DUPONT, demeurant 12 rue des Lilas, 75011 Paris,
joignable à l'adresse jean.dupont@example.com,

ET

Marie MARTIN, demeurant 8 avenue Victor Hugo, 69002 Lyon,
joignable à l'adresse marie.martin@example.com,

ci-après désignés « les Parties »,

[ ... corps du contrat ... ]
```

---

À partir de ce document, le module renvoie la liste structurée suivante :

```
Jean Dupont | jean.dupont@example.com
Marie Martin | marie.martin@example.com
```

Cette liste est ensuite transmise à l'API Yousign pour la création de la
procédure de signature (jusqu'à 5 signataires par document).
