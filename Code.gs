/**
 * Signature électronique Google Docs -> Yousign
 * ---------------------------------------------------------------------------
 * Module d'extraction automatique des signataires d'un contrat rédigé dans
 * Google Docs, en vue de l'envoi en signature électronique multi-signataires
 * via l'API Yousign.
 *
 * Un menu personnalisé est ajouté à Google Docs. Au clic, le bloc des parties
 * au contrat est isolé, puis structuré par un modèle de langage afin d'obtenir
 * une liste normalisée [Prénom Nom | email]. Les signataires sont conservés
 * dans les propriétés du document pour alimenter la procédure Yousign.
 *
 * La clé API est lue depuis les "Script Properties" et n'apparaît jamais dans
 * le code source.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CONFIG = {
  // Délimiteurs du bloc de texte contenant les parties au contrat.
  START_KEYWORD: 'ENTRE',
  END_KEYWORD: 'ci-après',
  // Modèle OpenAI utilisé pour structurer les données (modifiable).
  OPENAI_MODEL: 'gpt-3.5-turbo',
  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Contrats')
    .addItem('Envoi pour signature', 'envoyerPourSignature')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Extraction des signataires
// ---------------------------------------------------------------------------
function envoyerPourSignature() {
  const ui = DocumentApp.getUi();
  const texte = DocumentApp.getActiveDocument().getBody().getText().trim();

  const blocParties = extraireBlocParties(texte);
  if (!blocParties) {
    ui.alert(
      'Section introuvable : vérifiez la présence des mots-clés "' +
        CONFIG.START_KEYWORD + '" et "' + CONFIG.END_KEYWORD + '".'
    );
    return;
  }

  const signataires = analyserSignataires(blocParties);
  if (signataires.length === 0) {
    ui.alert('Aucun signataire détecté dans le document.');
    return;
  }

  // Persistance pour les étapes suivantes (création de la procédure Yousign).
  PropertiesService.getDocumentProperties()
    .setProperty('signataires', JSON.stringify(signataires));

  const apercu = signataires
    .map(function (s) { return s[0] + ' | ' + s[1]; })
    .join('\n');
  ui.alert('Signataires extraits :\n\n' + apercu);
}

/**
 * Isole le bloc de texte situé entre les deux mots-clés de configuration.
 * @param {string} texte Texte intégral du document.
 * @return {?string} Le texte des parties, ou null si introuvable.
 */
function extraireBlocParties(texte) {
  const start = texte.indexOf(CONFIG.START_KEYWORD);
  const end = texte.indexOf(CONFIG.END_KEYWORD);
  if (start === -1 || end === -1 || start >= end) {
    return null;
  }
  return texte.substring(start + CONFIG.START_KEYWORD.length, end).trim();
}

/**
 * Transmet le bloc des parties à l'API OpenAI pour en extraire une liste
 * structurée [Prénom Nom, email].
 * @param {string} texte Bloc des parties au contrat.
 * @return {Array<Array<string>>} Tableau de signataires.
 */
function analyserSignataires(texte) {
  const reponse = appelerOpenAI(texte);
  if (!reponse) return [];

  return reponse
    .split('\n')
    .map(function (ligne) {
      return ligne.split(' | ').map(function (champ) { return champ.trim(); });
    })
    .filter(function (champs) {
      return champs.length === 2 && champs[0] && champs[1];
    });
}

// ---------------------------------------------------------------------------
// Appel API OpenAI
// ---------------------------------------------------------------------------
/**
 * Appelle l'API OpenAI pour structurer les signataires.
 * @param {string} texte Bloc des parties au contrat.
 * @return {string} Réponse brute (format "Prénom Nom | email" par ligne).
 */
function appelerOpenAI(texte) {
  const apiKey = PropertiesService.getScriptProperties()
    .getProperty('OPENAI_API_KEY');

  if (!apiKey) {
    Logger.log('Clé OPENAI_API_KEY absente des Script Properties.');
    DocumentApp.getUi().alert(
      'Configuration manquante : ajoutez la propriété "OPENAI_API_KEY" dans ' +
        'Paramètres du projet > Propriétés du script.'
    );
    return '';
  }

  const payload = {
    model: CONFIG.OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Tu es un assistant chargé d\'extraire les noms, prénoms et emails ' +
          'des signataires d\'un contrat. Retourne uniquement ces informations ' +
          'au format "prenom nom | email", un signataire par ligne, sans aucun ' +
          'texte supplémentaire.',
      },
      { role: 'user', content: texte },
    ],
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { Authorization: 'Bearer ' + apiKey },
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(CONFIG.OPENAI_ENDPOINT, options);
    const code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('Erreur API OpenAI (' + code + ') : ' + response.getContentText());
      return '';
    }
    const json = JSON.parse(response.getContentText());
    return json.choices[0].message.content;
  } catch (error) {
    Logger.log('Erreur lors de l\'appel à l\'API : ' + error);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Accès aux signataires stockés (étape d'envoi Yousign)
// ---------------------------------------------------------------------------
/**
 * Récupère les signataires précédemment détectés et stockés.
 * @return {Array<Array<string>>} Tableau de signataires (vide si aucun).
 */
function getSignataires() {
  const data = PropertiesService.getDocumentProperties()
    .getProperty('signataires');
  return data ? JSON.parse(data) : [];
}
