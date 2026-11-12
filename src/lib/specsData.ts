
export interface ShoeSpecs {
    specs: { poids: string; drop: string; stack: string; prix: string; profil: string; usage: string; };
    notes: { amorti: number; dynamisme: number; confort: number; stabilite: number; };
    pForts: string[];
    pFaibles: string[];
}

// Keywords that indicate it's NOT a shoe review
const NON_SHOE_KEYWORDS = ['actu', 'montre', 'gps', 'garmin', 'suunto', 'coros', 'casque', 'shokz', 'nutrition', 'guide', 'classement', 'bilan', 'résultats', 'marathon de ', 'semi-marathon '];

export function isShoeReview(title: string, category?: string): boolean {
    const t = title.toLowerCase();
    const cat = (category || '').toLowerCase();

    // Explicitly not a shoe if category is guides/actu
    if (cat.includes('guide') || cat.includes('actu') || cat.includes('coaching')) return false;

    // Not a shoe if title contains non-shoe keywords
    if (NON_SHOE_KEYWORDS.some(kw => t.includes(kw))) return false;

    // Is a shoe if category is "Matériel" (most reliable signal)
    if (cat.includes('matériel') || cat.includes('materiel')) return true;

    // Fall back: check if title matches any known shoe pattern
    const shoeKeywords = ['hyperboost', 'cumulus', 'adrenaline', 'kipstorm', 'rebel v', 'phantasm', 'endorphin speed', 'endorphin pro', 'endorphin rift', 'skyrise', 'clifton', 'evo sl', 'mafate', 'aero glide', 'rebellion pro', 'vomero', 'ultra glide', 'kayano', 'sl 2', 'sl2', 'pegasus', 'skyward x', 'spectur', 'zegama', 'mach 6', 'mach x', 'triumph', 'kd 900', 'kd900x', 'hierro', 'alphafly', 'cloudmonster', 'agravic', 'metaspeed', 'supercomp', 'nimbus', 'takumi sen', 'fast-r', 'cloudflow', 'kairos', 'supernova', 'novablast', 'cloudeclipse', 'adios pro', 'hyperion max', 'vaporfly', 'kinvara', 'tecton x', 'drx bliss', 'ultrafly', 'cloudboom', 'aero volt', '1080 v', 'sonicblast', 'prodigio pro', 'evo pro', 'rebel flash', 'soarin', 'hoka', 'adios', 'speed elite', 'adizero'];
    if (shoeKeywords.some(kw => t.includes(kw))) return true;

    // Detect by brand + "test" combination
    const brands = ['asics', 'adidas', 'nike', 'hoka', 'saucony', 'new balance', 'salomon', 'on running', 'brooks', 'mizuno', 'puma', 'decathlon', 'scott', 'altra', 'merrell', 'inov-8', 'nnormal'];
    if (t.includes('test') && brands.some(b => t.includes(b))) return true;

    return false;
}


export function getSpecsForArticle(title: string): ShoeSpecs {
    const t = title.toLowerCase();
    
    let specs = { poids: "Voir article", drop: "Voir article", stack: "NC", prix: "Voir article", profil: "Neutre", usage: "Polyvalent" };
    let notes = { amorti: 8.0, dynamisme: 8.0, confort: 8.0, stabilite: 8.0 };
    let pForts = ["Chaussure réputée", "Bonne accroche"];
    let pFaibles = ["Prix", "Durabilité"];

    if (t.includes('hyperboost')) {
                specs.prix = "200 €"; specs.poids = "255 g"; specs.drop = "6 mm"; specs.stack = "45 mm / 39 mm"; 
                specs.usage = "Entraînement quotidien polyvalent (endurance, tempo). Déconseillé pour la compétition pure.";
                specs.profil = "Neutre"; notes = { amorti: 9.0, dynamisme: 8.5, confort: 9.0, stabilite: 7.5 };
                pForts = ["Amorti généreux", "Grande polyvalence", "Dynamisme sans plaque"]; pFaibles = ["Poids un peu élevé (255g)", "Pas idéal pour la compétition pure"];
            } else if (t.includes('cumulus 28')) {
                specs.prix = "160 €"; specs.poids = "~250 g"; specs.drop = "8 mm"; specs.stack = "38.5 mm / 30.5 mm"; 
                specs.usage = "Entraînement quotidien classique, confort.";
                specs.profil = "Neutre"; notes = { amorti: 9.5, dynamisme: 6.5, confort: 9.5, stabilite: 9.0 };
                pForts = ["Confort maximal", "Excellente durabilité", "Très bon amorti"]; pFaibles = ["Manque de dynamisme pour les séances rapides", "Pas de plaque carbone"];
            } else if (t.includes('adrenaline')) {
                specs.prix = "150 €"; specs.poids = "260 g"; specs.drop = "12 mm"; specs.stack = "36 mm / 24 mm"; 
                specs.usage = "Entraînement quotidien avec soutien renforcé pour la pronation.";
                specs.profil = "Pronateur"; notes = { amorti: 8.5, dynamisme: 6.0, confort: 9.0, stabilite: 10.0 };
                pForts = ["Soutien ciblé (pronation)", "Excellente stabilité (10/10)", "Confortable"]; pFaibles = ["Drop très élevé (12mm)", "Poids conséquent (260g)"];
            } else if (t.includes('kipstorm lab') || t.includes('kipstorm elite')) {
                specs.prix = "299,99 €"; specs.poids = "~190 g"; specs.drop = "4 mm"; specs.stack = "40 mm / 36 mm"; 
                specs.usage = "Modèle élite unisexe ultra-performant pour la compétition marathon.";
                specs.profil = "Compétition"; notes = { amorti: 8.0, dynamisme: 10.0, confort: 7.5, stabilite: 6.5 };
                pForts = ["Poids plume (190g)", "Plaque très réactive", "Rapport qualité/prix élite"]; pFaibles = ["Durabilité de la semelle", "Exigeante musculairement (Drop 4mm)"];
            } else if (t.includes('rebel v5')) {
                specs.prix = "150 €"; specs.poids = "210 g"; specs.drop = "6 mm"; specs.stack = "30 mm / 24 mm"; 
                specs.usage = "Entraînement très dynamique, léger et sans plaque (séances tempo).";
                specs.profil = "Universel"; notes = { amorti: 7.0, dynamisme: 9.5, confort: 8.5, stabilite: 7.0 };
                pForts = ["Très légère (210g)", "Grande flexibilité", "Excellent rebond"]; pFaibles = ["Manque de structure pour les longues sorties", "Amorti un peu ferme"];
            } else if (t.includes('phantasm 3') && !t.includes('s/lab')) {
                specs.prix = "280 €"; specs.poids = "210 g"; specs.drop = "9 mm"; specs.stack = "38 mm / 29 mm"; 
                specs.usage = "Compétition sur route très haute performance (Plaque carbone, Unisexe).";
                specs.profil = "Elite"; notes = { amorti: 7.5, dynamisme: 9.5, confort: 7.0, stabilite: 7.5 };
                pForts = ["Plaque carbone très dynamique", "Légèreté (210g)", "Fit précis"]; pFaibles = ["Prix élevé (280€)", "Confort minimaliste"];
            } else if (t.includes('kipstorm tempo')) {
                specs.prix = "139,99 €"; specs.poids = "230 g"; specs.drop = "6 mm"; specs.stack = "38 mm / 32 mm"; 
                specs.usage = "Super-trainer pour les entraînements et sorties rythmées.";
                specs.profil = "Neutre"; notes = { amorti: 8.0, dynamisme: 8.5, confort: 8.0, stabilite: 8.0 };
                pForts = ["Prix imbattable (140€)", "Très polyvalente", "Bon équilibre amorti/dynamisme"]; pFaibles = ["Un peu lourde pour de la VMA pure (230g)", "Mesh moins respirant"];
            } else if (t.includes('1080 v15')) {
                specs.prix = "190 €"; specs.poids = "~220 g"; specs.drop = "6 mm"; specs.stack = "38 mm / 32 mm"; 
                specs.usage = "Entraînement quotidien, footing et récupération avec un confort maximal.";
                specs.profil = "Neutre"; notes = { amorti: 10.0, dynamisme: 5.5, confort: 10.0, stabilite: 8.5 };
                pForts = ["Confort exceptionnel (10/10)", "Amorti ultra-moelleux", "Idéal sorties longues"]; pFaibles = ["Manque cruel de dynamisme", "S'écrase sur les accélérations"];
            } else if (t.includes('metaspeed ray')) {
                specs.prix = "300 €"; specs.poids = "~185 g"; specs.drop = "5 mm"; specs.stack = "40 mm / 35 mm"; 
                specs.usage = "Compétition élite (Unisexe). Conçue pour battre records sur longue distance.";
                specs.profil = "Elite Rapide"; notes = { amorti: 7.0, dynamisme: 10.0, confort: 6.5, stabilite: 5.0 };
                pForts = ["Ultra-légère (185g)", "Plaque carbone agressive", "Retour d'énergie massif"]; pFaibles = ["Prix très élitiste (300€)", "Instable à basse vitesse"];
            } else if (t.includes('sonicblast')) {
                specs.prix = "190 €"; specs.poids = "260 g"; specs.drop = "8 mm"; specs.stack = "40 mm / 32 mm"; 
                specs.usage = "Entraînement quotidien dynamique et rebondissant.";
                specs.profil = "Neutre"; notes = { amorti: 8.5, dynamisme: 8.0, confort: 8.5, stabilite: 8.0 };
                pForts = ["Effet rebondissant agréable", "Très bon rapport qualité/prix", "Polyvalente"]; pFaibles = ["Poids perfectible (260g)", "Stack important réduisant la sensation du sol"];
            } else if (t.includes('prodigio pro')) {
                specs.prix = "180 €"; specs.poids = "~270 g"; specs.drop = "6 mm"; specs.stack = "34 mm / 28 mm"; 
                specs.usage = "Modèle ultra-trail doté d'une géométrie dynamique pour la vitesse en montagne.";
                specs.profil = "Trail"; notes = { amorti: 8.5, dynamisme: 8.5, confort: 8.5, stabilite: 9.0 };
                pForts = ["Géométrie favorisant un déroulé dynamique", "Accroche exceptionnelle en montagne", "Idéale sur ultra-trail"]; pFaibles = ["Poids un peu lourd pour les sentiers roulants (270g)"];
            } else if (t.includes('endorphin speed 5')) {
                specs.prix = "200 €"; specs.poids = "~230 g"; specs.drop = "8 mm"; specs.stack = "36 mm / 28 mm"; 
                specs.usage = "Chaussure polyvalente pour entraînements rythmés et compétition (Plaque nylon).";
                specs.profil = "Universel Rapide"; notes = { amorti: 8.0, dynamisme: 9.5, confort: 8.5, stabilite: 8.0 };
                pForts = ["Plaque en nylon flexible et moins exigeante", "Très grande polyvalence", "Légèreté appréciable (230g)"]; pFaibles = ["Moins propulsive qu'une vraie carbone", "Prix élevé pour de l'entraînement"];
            } else if (t.includes('skyrise 6')) {
                specs.prix = "150 €"; specs.poids = "280 g"; specs.drop = "8 mm"; specs.stack = "38 mm / 30 mm"; 
                specs.usage = "Confort optimal et amortissement performant pour toutes les courses (footing, récupération).";
                specs.profil = "Neutre"; notes = { amorti: 9.5, dynamisme: 6.0, confort: 9.5, stabilite: 8.5 };
                pForts = ["Confort optimal", "Très bonne adhérence", "Absorption des chocs très performante"]; pFaibles = ["Modèle lourd (280g)", "Manque de dynamisme sur allures rapides"];
            } else if (t.includes('clifton 10')) {
                specs.prix = "160 €"; specs.poids = "~240 g"; specs.drop = "5 mm"; specs.stack = "35 mm / 30 mm"; 
                specs.usage = "Légèreté et moelleux pour courir au quotidien (le grand classique Hoka).";
                specs.profil = "Neutre"; notes = { amorti: 9.0, dynamisme: 7.0, confort: 9.5, stabilite: 8.0 };
                pForts = ["Le confort classique et moelleux d'Hoka", "Légèreté conservée (240g)", "Ajout de 3mm de stack pour plus d'amorti"]; pFaibles = ["Pas conçue pour les séances très intenses"];
            } else if (t.includes('evo sl')) {
                specs.prix = "150 €"; specs.poids = "224 g"; specs.drop = "6.5 mm"; specs.stack = "38 mm / 32 mm"; 
                specs.usage = "La super-shoe de l'entraînement. Parfaite pour le confort, le dynamisme et le tempo.";
                specs.profil = "Universel Rapide"; notes = { amorti: 8.5, dynamisme: 9.5, confort: 8.5, stabilite: 8.0 };
                pForts = ["Mousse Lightstrike Pro ultra-réactive", "Poids plume incroyable (224g)", "Design inspiré de l'Evo Pro 1"]; pFaibles = ["Durabilité de la mousse à vérifier sur très long terme"];
            } else if (t.includes('mafate x')) {
                specs.prix = "225 €"; specs.poids = "~280 g"; specs.drop = "4 mm"; specs.stack = "35 mm / 31 mm"; 
                specs.usage = "Le summum de l'amorti pour trails difficiles et ultramarathons (Plaque carbone et PEBA).";
                specs.profil = "Trail Elite"; notes = { amorti: 9.5, dynamisme: 9.0, confort: 8.5, stabilite: 8.0 };
                pForts = ["Mousse PEBA pour une propulsion unique", "Plaque carbone à fourche", "Le summum de l'amorti trail"]; pFaibles = ["Prix très élevé (225€)", "Drop de 4mm assez exigeant"];
            } else if (t.includes('aero glide 3')) {
                specs.prix = "150 €"; specs.poids = "~255 g"; specs.drop = "10 mm"; specs.stack = "38 mm / 28 mm"; 
                specs.usage = "Entraînement quotidien très amorti (maximaliste) sur route.";
                specs.profil = "Neutre"; notes = { amorti: 9.5, dynamisme: 6.5, confort: 9.0, stabilite: 8.5 };
                pForts = ["Amorti maximaliste excellent", "Très grand confort sur route", "Polyvalence pour les footings"]; pFaibles = ["Drop de 10mm un peu classique", "Manque de peps pour le fractionné"];
            } else if (t.includes('rebellion pro 3')) {
                specs.prix = "240 €"; specs.poids = "~210 g"; specs.drop = "1.5 mm"; specs.stack = "39.5 mm / 38 mm"; 
                specs.usage = "Compétition sur route avec plaque carbone. Modèle au design extrême (foulée médio-pied).";
                specs.profil = "Elite"; notes = { amorti: 8.0, dynamisme: 10.0, confort: 7.0, stabilite: 6.0 };
                pForts = ["Design extrême hyper propulsif", "Plaque carbone redoutable", "Très légère (210g)"]; pFaibles = ["Instable au talon (drop 1.5mm)", "Exige une foulée médio-pied parfaite"];
            } else if (t.includes('vomero 18')) {
                specs.prix = "149,99 €"; specs.poids = "326 g"; specs.drop = "10 mm"; specs.stack = "46 mm / 36 mm"; 
                specs.usage = "Allie confort et performance. Excellente absorption des chocs (idéale longues distances).";
                specs.profil = "Lourd / Confort"; notes = { amorti: 10.0, dynamisme: 5.0, confort: 10.0, stabilite: 9.0 };
                pForts = ["Amorti XXL ultra-moelleux (Stack 46mm !)", "Confort maximal garanti", "Absorption des chocs parfaite"]; pFaibles = ["Chaussure très lourde (326g)", "Pas du tout conçue pour la vitesse"];
            } else if (t.includes('ultra glide')) {
                specs.prix = "250 €"; specs.poids = "~270 g"; specs.drop = "6 mm"; specs.stack = "35 mm / 29 mm"; 
                specs.usage = "Compétition ultra-trail. Modèle unisexe élite ultra amorti pour tenir la distance.";
                specs.profil = "Trail Elite"; notes = { amorti: 9.0, dynamisme: 8.5, confort: 9.0, stabilite: 8.5 };
                pForts = ["Idéale pour encaisser les distances ultra", "Excellent compromis amorti/dynamisme", "Finition S/LAB haut de gamme"]; pFaibles = ["Prix très élitiste (250€)"];
            } else if (t.includes('kayano 31')) {
                specs.prix = "200 €"; specs.poids = "305 g"; specs.drop = "10 mm"; specs.stack = "40 mm / 30 mm";
                specs.usage = "Référence de la stabilité. Entraînement quotidien et sorties longues pour pronateurs.";
                specs.profil = "Pronateur"; notes = { amorti: 9.0, dynamisme: 5.5, confort: 9.5, stabilite: 10.0 };
                pForts = ["Stabilité absolue (10/10)", "Confort premium", "Excellent maintien"]; pFaibles = ["Poids conséquent (305g)", "Manque de dynamisme"];
            } else if (t.includes('sl2') || t.includes('sl 2')) {
                specs.prix = "130 €"; specs.poids = "235 g"; specs.drop = "9 mm"; specs.stack = "36 mm / 27 mm";
                specs.usage = "Entraînement quotidien hyper polyvalent avec mousse Lightstrike Pro.";
                specs.profil = "Universel"; notes = { amorti: 8.0, dynamisme: 8.5, confort: 8.5, stabilite: 8.0 };
                pForts = ["Rapport qualité/prix imbattable", "Mousse très dynamique", "Grande polyvalence"]; pFaibles = ["Maintien du talon perfectible"];
            } else if (t.includes('pegasus 41')) {
                specs.prix = "140 €"; specs.poids = "281 g"; specs.drop = "10 mm"; specs.stack = "37 mm / 27 mm";
                specs.usage = "Classique indémodable pour tous les footings (mousse ReactX et Zoom Air).";
                specs.profil = "Neutre"; notes = { amorti: 8.5, dynamisme: 7.5, confort: 9.0, stabilite: 8.5 };
                pForts = ["Valeur sûre et robuste", "Mousse ReactX confortable", "Double unité Zoom Air"]; pFaibles = ["Un peu lourde pour la VMA (281g)"];
            } else if (t.includes('skyward x')) {
                specs.prix = "225 €"; specs.poids = "320 g"; specs.drop = "5 mm"; specs.stack = "48 mm / 43 mm";
                specs.usage = "Super-Trainer maximaliste (48mm) avec plaque carbone convexe pour l'ultra-confort.";
                specs.profil = "Lourd / Confort"; notes = { amorti: 10.0, dynamisme: 8.0, confort: 10.0, stabilite: 8.5 };
                pForts = ["Stack massif inédit (48mm)", "Plaque carbone soulageant la foulée", "Protection ultime"]; pFaibles = ["Poids très important (320g)", "Prix premium (225€)"];
            } else if (t.includes('spectur')) {
                specs.prix = "210 €"; specs.poids = "235 g"; specs.drop = "8 mm"; specs.stack = "38 mm / 30 mm";
                specs.usage = "Plaque carbone pensée spécifiquement pour les marathoniens amateurs (3h - 4h30).";
                specs.profil = "Universel Rapide"; notes = { amorti: 8.0, dynamisme: 9.0, confort: 8.5, stabilite: 8.5 };
                pForts = ["Carbone adapté aux allures intermédiaires", "Très bonne stabilité", "Finition S/Lab"]; pFaibles = ["Moins propulsive que les modèles élites purs"];
            } else if (t.includes('zegama')) {
                specs.prix = "180 €"; specs.poids = "320 g"; specs.drop = "4 mm"; specs.stack = "36 mm / 32 mm";
                specs.usage = "Trail longue distance et Ultra. Mousse ZoomX et semelle Vibram Megagrip.";
                specs.profil = "Trail Ultra"; notes = { amorti: 9.0, dynamisme: 7.5, confort: 9.5, stabilite: 8.5 };
                pForts = ["Amorti ZoomX hyper confortable", "Semelle Vibram redoutable", "Idéale sur Ultra"]; pFaibles = ["Assez lourde (320g)", "Drop de 4mm"];
            } else if (t.includes('mach 6')) {
                specs.prix = "160 €"; specs.poids = "232 g"; specs.drop = "5 mm"; specs.stack = "37 mm / 32 mm";
                specs.usage = "Entraînement rythmé et tempo sans plaque. Légère et dynamique.";
                specs.profil = "Universel Rapide"; notes = { amorti: 8.0, dynamisme: 9.0, confort: 8.5, stabilite: 8.0 };
                pForts = ["Légèreté et dynamisme", "Alternative parfaite au carbone", "Très bonne relance"]; pFaibles = ["Durabilité de la semelle externe"];
            } else if (t.includes('triumph 22')) {
                specs.prix = "190 €"; specs.poids = "285 g"; specs.drop = "10 mm"; specs.stack = "37 mm / 27 mm";
                specs.usage = "Modèle cruiser premium en mousse PWRRUN PB pour l'endurance fondamentale.";
                specs.profil = "Neutre / Confort"; notes = { amorti: 9.5, dynamisme: 6.5, confort: 9.5, stabilite: 8.5 };
                pForts = ["Mousse PWRRUN PB ultra-moelleuse", "Confort premium", "Idéale pour accumuler les bornes"]; pFaibles = ["Poids (285g)", "Manque de réactivité à haute vitesse"];
            } else if (t.includes('kd900x ld') || t.includes('kd 900x ld')) {
                specs.prix = "180 €"; specs.poids = "207 g"; specs.drop = "4 mm"; specs.stack = "38 mm / 34 mm";
                specs.usage = "Compétition carbone Longue Distance de Decathlon pour le marathon.";
                specs.profil = "Elite"; notes = { amorti: 8.0, dynamisme: 9.5, confort: 8.0, stabilite: 7.5 };
                pForts = ["Rapport prix/carbone imbattable (180€)", "Poids plume (207g)", "Très propulsive sur marathon"]; pFaibles = ["Confort d'accueil ferme", "Drop 4mm exigeant"];
            } else if (t.includes('hierro')) {
                specs.prix = "160 €"; specs.poids = "318 g"; specs.drop = "6 mm"; specs.stack = "32 mm / 26 mm";
                specs.usage = "Trail confort, rando-course et door-to-trail. Semelle Vibram.";
                specs.profil = "Trail Confort"; notes = { amorti: 9.0, dynamisme: 6.0, confort: 9.5, stabilite: 9.0 };
                pForts = ["Confort Fresh Foam X", "Semelle Vibram polyvalente", "Design très réussi"]; pFaibles = ["Lourde (318g)", "Pas pour terrains hyper techniques"];
            } else if (t.includes('alphafly')) {
                specs.prix = "310 €"; specs.poids = "220 g"; specs.drop = "8 mm"; specs.stack = "40 mm / 32 mm";
                specs.usage = "L'arme absolue pour le marathon. Plaque carbone et unités Air Zoom.";
                specs.profil = "Elite"; notes = { amorti: 9.0, dynamisme: 10.0, confort: 8.0, stabilite: 8.0 };
                pForts = ["Transition parfaite (semelle continue)", "Propulsion exceptionnelle", "Plus stable que les versions précédentes"]; pFaibles = ["Prix prohibitif (310€)", "Fit voûte plantaire très particulier"];
            } else if (t.includes('cloudmonster hyper')) {
                specs.prix = "220 €"; specs.poids = "265 g"; specs.drop = "6 mm"; specs.stack = "37.5 mm / 31.5 mm";
                specs.usage = "Super-Trainer sans plaque avec mousse élite Helion HF pour les gros blocs.";
                specs.profil = "Universel Rapide"; notes = { amorti: 9.5, dynamisme: 9.0, confort: 9.0, stabilite: 8.5 };
                pForts = ["Mousse Helion HF hyper dynamique", "Amorti massif protecteur", "Moins traumatisante (pas de plaque)"]; pFaibles = ["Prix d'un modèle carbone (220€)"];
            } else if (t.includes('agravic speed ultra')) {
                specs.prix = "220 €"; specs.poids = "260 g"; specs.drop = "8 mm"; specs.stack = "38 mm / 30 mm";
                specs.usage = "Compétition ultra-trail, rocker très prononcé et tiges EnergyRods.";
                specs.profil = "Trail Elite"; notes = { amorti: 8.5, dynamisme: 9.5, confort: 8.0, stabilite: 7.5 };
                pForts = ["Rocker agressif pour une relance folle", "Mousse Lightstrike Pro", "Tiges EnergyRods efficaces"]; pFaibles = ["Instable dans les devers", "Usure rapide"];
            } else if (t.includes('metaspeed paris')) {
                specs.prix = "250 €"; specs.poids = "185 g"; specs.drop = "5 mm"; specs.stack = "39.5 mm / 34.5 mm";
                specs.usage = "Compétition route ultime du 10 km au marathon (mousse FF Turbo+).";
                specs.profil = "Elite"; notes = { amorti: 8.0, dynamisme: 10.0, confort: 8.0, stabilite: 7.5 };
                pForts = ["Poids ultra léger (185g)", "Nouvelle mousse FF Turbo+ magique", "Adaptation selon la foulée (Sky ou Edge)"]; pFaibles = ["Durabilité limitée pour l'entraînement"];
            } else if (t.includes('endorphin pro 4')) {
                specs.prix = "250 €"; specs.poids = "212 g"; specs.drop = "8 mm"; specs.stack = "39.5 mm / 31.5 mm";
                specs.usage = "Compétition carbone sur route avec un confort exceptionnel (Double amorti).";
                specs.profil = "Elite"; notes = { amorti: 9.0, dynamisme: 9.5, confort: 9.0, stabilite: 8.0 };
                pForts = ["Confort incroyable pour une carbone", "Double amorti PWRRUN HG et PB", "Semelle de propreté SRS"]; pFaibles = ["Un poil moins radicale que la concurrence directe"];
            } else if (t.includes('supercomp elite v4')) {
                specs.prix = "280 €"; specs.poids = "237 g"; specs.drop = "4 mm"; specs.stack = "40 mm / 36 mm";
                specs.usage = "Compétition carbone avec géométrie agressive et 100% PEBA.";
                specs.profil = "Elite"; notes = { amorti: 8.5, dynamisme: 9.5, confort: 8.5, stabilite: 7.5 };
                pForts = ["Nouvelle mousse 100% PEBA", "Design agressif et racé", "Effet rebond très marqué"]; pFaibles = ["Poids en hausse (237g)", "Drop 4mm exigeant"];
            } else if (t.includes('cloudmonster 2')) {
                specs.prix = "190 €"; specs.poids = "295 g"; specs.drop = "6 mm"; specs.stack = "35 mm / 29 mm";
                specs.usage = "Entraînement quotidien maximaliste. Roulement ferme et protecteur.";
                specs.profil = "Neutre"; notes = { amorti: 9.0, dynamisme: 7.0, confort: 9.0, stabilite: 8.5 };
                pForts = ["Amorti très massif", "Roulement vers l'avant agréable", "Bonne stabilité globale"]; pFaibles = ["Amorti assez ferme", "Lourdeur relative (295g)"];
            } else if (t.includes('nimbus 26')) {
                specs.prix = "200 €"; specs.poids = "305 g"; specs.drop = "8 mm"; specs.stack = "42 mm / 34 mm";
                specs.usage = "Le roi du confort chez Asics (PureGEL) pour footings de récupération.";
                specs.profil = "Lourd / Confort"; notes = { amorti: 10.0, dynamisme: 5.0, confort: 10.0, stabilite: 8.5 };
                pForts = ["Effet pantoufle inégalé", "Technologie PureGEL ultra douce", "Col en maille très agréable"]; pFaibles = ["Zéro dynamisme", "Poids conséquent (305g)"];
            } else if (t.includes('takumi sen')) {
                specs.prix = "200 €"; specs.poids = "200 g"; specs.drop = "6 mm"; specs.stack = "33 mm / 27 mm";
                specs.usage = "Le scalpel pour les courtes distances sur piste, 5 km et 10 km.";
                specs.profil = "Elite Courte Distance"; notes = { amorti: 6.5, dynamisme: 10.0, confort: 7.0, stabilite: 7.0 };
                pForts = ["Légèreté et précision absolues (200g)", "Idéale 5k et 10k", "Adhérence Continental"]; pFaibles = ["Manque d'amorti pour le long", "Fit très étroit"];
            } else if (t.includes('fast-r')) {
                specs.prix = "260 €"; specs.poids = "240 g"; specs.drop = "8 mm"; specs.stack = "40 mm / 32 mm";
                specs.usage = "Compétition marathon radicale avec talon séparé et carbone apparent.";
                specs.profil = "Elite"; notes = { amorti: 8.0, dynamisme: 10.0, confort: 7.5, stabilite: 7.0 };
                pForts = ["Design féroce", "Plaque carbone ultra-visible et propulsive", "Mousse Aliphatic rebondissante"]; pFaibles = ["Look très polarisant", "Stabilité arrière délicate"];
            } else if (t.includes('cloudflow 4')) {
                specs.prix = "160 €"; specs.poids = "235 g"; specs.drop = "8 mm"; specs.stack = "31 mm / 23 mm";
                specs.usage = "Entraînement très dynamique (tempo, fractionné) avec Speedboard nylon.";
                specs.profil = "Universel Rapide"; notes = { amorti: 7.0, dynamisme: 8.5, confort: 8.0, stabilite: 8.5 };
                pForts = ["Transitions très rapides", "Légèreté et fluidité", "Speedboard efficace"]; pFaibles = ["Manque d'amorti pour les longues sorties", "Sensation ferme"];
            } else if (t.includes('kairos 2')) {
                specs.prix = "150 €"; specs.poids = "295 g"; specs.drop = "8 mm"; specs.stack = "30 mm / 22 mm";
                specs.usage = "Entraînement quotidien avec un focus majeur sur la stabilité (pronateurs).";
                specs.profil = "Pronateur"; notes = { amorti: 7.5, dynamisme: 6.0, confort: 8.0, stabilite: 9.5 };
                pForts = ["Excellente stabilité structurelle", "Prix raisonnable", "Robuste"]; pFaibles = ["Lourde et pataude (295g)"];
            } else if (t.includes('supernova rise')) {
                specs.prix = "150 €"; specs.poids = "275 g"; specs.drop = "10 mm"; specs.stack = "36 mm / 26 mm";
                specs.usage = "Confort quotidien pour footings de récupération (mousse Dreamstrike+).";
                specs.profil = "Neutre"; notes = { amorti: 8.5, dynamisme: 6.5, confort: 9.0, stabilite: 8.5 };
                pForts = ["Mousse Dreamstrike+ très agréable", "Chausson confortable", "Polyvalence footing"]; pFaibles = ["Dynamisme classique", "Drop 10mm"];
            } else if (t.includes('novablast 4')) {
                specs.prix = "150 €"; specs.poids = "260 g"; specs.drop = "8 mm"; specs.stack = "41.5 mm / 33.5 mm";
                specs.usage = "Polyvalence absolue, rebondissante (FF Blast+ Eco) du lent au semi.";
                specs.profil = "Neutre"; notes = { amorti: 9.0, dynamisme: 8.5, confort: 9.0, stabilite: 8.0 };
                pForts = ["Gros succès critique", "Mousse très joueuse", "Excellente géométrie trampoline"]; pFaibles = ["Adhérence sur sol mouillé parfaiteible"];
            } else if (t.includes('cloudeclipse')) {
                specs.prix = "190 €"; specs.poids = "285 g"; specs.drop = "6 mm"; specs.stack = "37 mm / 31 mm";
                specs.usage = "Amorti maximal chez On pour absorber un maximum de chocs sur route.";
                specs.profil = "Lourd / Confort"; notes = { amorti: 9.5, dynamisme: 6.5, confort: 9.5, stabilite: 8.5 };
                pForts = ["Double couche CloudTec très efficace", "Douceur d'amorti inédite chez On", "Look ravageur"]; pFaibles = ["Poids (285g)", "Prix élevé (190€)"];
            } else if (t.includes('adios pro 3')) {
                specs.prix = "250 €"; specs.poids = "215 g"; specs.drop = "6.5 mm"; specs.stack = "39.5 mm / 33 mm";
                specs.usage = "L'ancienne reine des marathons. Très performante et stable.";
                specs.profil = "Elite"; notes = { amorti: 8.5, dynamisme: 9.5, confort: 8.0, stabilite: 8.0 };
                pForts = ["Relance exceptionnelle (EnergyRods)", "Très bonne stabilité pour une carbone", "Prix souvent cassé"]; pFaibles = ["Laçage et confort du mesh"];
            } else if (t.includes('hyperion max')) {
                specs.prix = "170 €"; specs.poids = "220 g"; specs.drop = "8 mm"; specs.stack = "34 mm / 26 mm";
                specs.usage = "Entraînement rapide ultra-léger et très incurvé vers l'avant (sans plaque).";
                specs.profil = "Universel Rapide"; notes = { amorti: 7.5, dynamisme: 9.0, confort: 8.0, stabilite: 8.0 };
                pForts = ["Très légère (220g)", "Rocker agressif pour la vitesse", "Alternative sans carbone"]; pFaibles = ["Amorti très ferme"];
            } else if (t.includes('phantasm 2') && t.includes('s/lab')) {
                specs.prix = "250 €"; specs.poids = "219 g"; specs.drop = "9 mm"; specs.stack = "37 mm / 28 mm";
                specs.usage = "Modèle élite à plaque carbone pour la compétition sur route (Energy Foam+).";
                specs.profil = "Elite"; notes = { amorti: 8.0, dynamisme: 9.5, confort: 8.0, stabilite: 7.5 };
                pForts = ["Mousse Energy Foam+ très réactive", "Fit excellent", "Légèreté compétitive"]; pFaibles = ["Drop de 9mm un peu haut"];
            } else if (t.includes('vaporfly 2') || t.includes('vaporfly next% 2')) {
                specs.prix = "250 €"; specs.poids = "195 g"; specs.drop = "8 mm"; specs.stack = "40 mm / 32 mm";
                specs.usage = "Une légende du carbone, bascule agressive et mousse ZoomX ferme.";
                specs.profil = "Elite"; notes = { amorti: 8.0, dynamisme: 10.0, confort: 7.0, stabilite: 6.5 };
                pForts = ["Rocker hyper agressif d'anthologie", "Mousse ZoomX avec pop inégalé", "Légère comme une plume"]; pFaibles = ["Très instable", "Quasi introuvable"];
            } else if (t.includes('kinvara pro')) {
                specs.prix = "220 €"; specs.poids = "269 g"; specs.drop = "8 mm"; specs.stack = "42 mm / 34 mm";
                specs.usage = "Super-Trainer hybride avec plaque carbone 3/4 pour fluidifier la foulée.";
                specs.profil = "Universel Rapide"; notes = { amorti: 9.0, dynamisme: 8.5, confort: 8.5, stabilite: 8.0 };
                pForts = ["Plaque carbone tolérante (3/4)", "Stack très généreux", "Fluidité de transition"]; pFaibles = ["Lourde pour une Kinvara", "Usure semelle externe"];
            } else if (t.includes('tecton x2')) {
                specs.prix = "220 €"; specs.poids = "252 g"; specs.drop = "5 mm"; specs.stack = "32 mm / 27 mm";
                specs.usage = "Trail rapide et compétition avec plaques carbone parallèles.";
                specs.profil = "Trail Elite"; notes = { amorti: 8.5, dynamisme: 9.5, confort: 8.5, stabilite: 8.5 };
                pForts = ["Plaques carbone parallèles intelligentes", "Tige Matryx hyper résistante", "Excellente relance"]; pFaibles = ["Amorti un peu ferme sur l'ultra", "Prix (220€)"];
            } else if (t.includes('drx bliss')) {
                specs.prix = "160 €"; specs.poids = "266 g"; specs.drop = "8 mm"; specs.stack = "34 mm / 26 mm";
                specs.usage = "Entraînement quotidien guidé avec Active Chassis pour limiter la pronation.";
                specs.profil = "Pronateur"; notes = { amorti: 8.0, dynamisme: 7.0, confort: 8.5, stabilite: 9.5 };
                pForts = ["Guidage en douceur", "Sécurisante avec la fatigue", "Bon confort"]; pFaibles = ["Dynamisme en retrait", "Look un peu pataud"];
            } else if (t.includes('ultrafly trail')) {
                specs.prix = "270 €"; specs.poids = "300 g"; specs.drop = "8.5 mm"; specs.stack = "38.5 mm / 30 mm";
                specs.usage = "Ultra-trail compétition avec plaque carbone, ZoomX et semelle Vibram.";
                specs.profil = "Trail Ultra Elite"; notes = { amorti: 9.5, dynamisme: 9.0, confort: 9.0, stabilite: 8.0 };
                pForts = ["Mousse ZoomX sur trail", "Plaque carbone protectrice et propulsive", "Semelle Vibram"]; pFaibles = ["Poids lourd (300g)", "Prix astronomique (270€)", "Tige salissante"];
            } else if (t.includes('phantasm 2') && !t.includes('s/lab')) {
                specs.prix = "170 €"; specs.poids = "255 g"; specs.drop = "9 mm"; specs.stack = "35 mm / 26 mm";
                specs.usage = "Entraînement rapide avec plaque fibre de verre plus tolérante.";
                specs.profil = "Universel Rapide"; notes = { amorti: 7.5, dynamisme: 8.5, confort: 8.0, stabilite: 8.0 };
                pForts = ["Plaque Energy Blade tolérante", "Idéale pour fractionné amateur", "Prix abordable"]; pFaibles = ["Drop 9mm", "Moins agressive que la S/Lab"];
            } else if (t.includes('pegasus 40')) {
                specs.prix = "130 €"; specs.poids = "288 g"; specs.drop = "10 mm"; specs.stack = "33 mm / 23 mm";
                specs.usage = "Polyvalence à l'ancienne. Daily trainer classique et robuste.";
                specs.profil = "Neutre"; notes = { amorti: 7.5, dynamisme: 6.5, confort: 8.0, stabilite: 8.5 };
                pForts = ["Solidité légendaire", "Prix souvent bradé", "Ajustement classique"]; pFaibles = ["Mousse React ancienne", "Manque de peps"];
            } else if (t.includes('endorphin rift')) {
                specs.prix = "170 €"; specs.poids = "244 g"; specs.drop = "6 mm"; specs.stack = "33 mm / 27 mm";
                specs.usage = "Trail rapide, léger et agile avec mousse PWRRUN PB (sans plaque).";
                specs.profil = "Trail Rapide"; notes = { amorti: 8.0, dynamisme: 9.0, confort: 8.5, stabilite: 8.0 };
                pForts = ["Très légère et agile (244g)", "Mousse PWRRUN PB géniale sur sentiers", "Crampons agressifs"]; pFaibles = ["Manque de plaque anti-roche"];
            } else if (t.includes('cloudboom echo 3')) {
                specs.prix = "290 €"; specs.poids = "215 g"; specs.drop = "9 mm"; specs.stack = "37 mm / 28 mm";
                specs.usage = "Compétition route élite très ferme et racée (5 km au semi).";
                specs.profil = "Elite"; notes = { amorti: 6.5, dynamisme: 9.5, confort: 7.0, stabilite: 7.5 };
                pForts = ["Propulsion extrême sur courte distance", "Look incroyable", "Légèreté"]; pFaibles = ["Trop ferme pour le marathon", "Prix délirant (290€)"];
            } else if (t.includes('aero volt')) {
                specs.prix = "150 €"; specs.poids = "213 g"; specs.drop = "8 mm"; specs.stack = "32 mm / 24 mm";
                specs.usage = "Chaussure urbaine hyper légère pour footings courts et bitume l'été.";
                specs.profil = "Universel Léger"; notes = { amorti: 7.0, dynamisme: 8.0, confort: 8.0, stabilite: 8.0 };
                pForts = ["Mesh ultra-respirant", "Légèreté absolue (213g)", "Sensation de liberté"]; pFaibles = ["Pas pour les sorties longues", "Amorti limité"];
            } else if (t.includes('mach x')) {
                specs.prix = "180 €"; specs.poids = "266 g"; specs.drop = "5 mm"; specs.stack = "39 mm / 34 mm";
                specs.usage = "Entraînement tempo avec plaque en Pebax souple pour les blocs d'allure.";
                specs.profil = "Universel Rapide"; notes = { amorti: 8.5, dynamisme: 8.5, confort: 8.5, stabilite: 8.0 };
                pForts = ["Plaque Pebax douce et agréable", "Super évolution de la Mach", "Parfaite pour le tempo long"]; pFaibles = ["Un peu plus lourde que la Mach standard"];
            } else if (t.includes('kd 900')) {
                specs.prix = "120 €"; specs.poids = "218 g"; specs.drop = "8 mm"; specs.stack = "32 mm / 24 mm";
                specs.usage = "VMA, piste et entraînement rythmé avec mousse VFOAM (Pebax).";
                specs.profil = "Universel Rapide"; notes = { amorti: 7.0, dynamisme: 8.5, confort: 7.5, stabilite: 8.0 };
                pForts = ["Prix incroyable (120€) pour du Pebax", "Légèreté (218g)", "Excellente relance"]; pFaibles = ["Confort un peu spartiate", "Usure du mesh"];
            }

            

    if (specs.poids === "Voir article") {
        if (t.includes('adios pro 4')) {
            specs = { prix: "250 €", poids: "200 g", drop: "6 mm", stack: "39 mm / 33 mm", profil: "Elite", usage: "Compétition route du 5 km au marathon (Lightstrike Pro + EnergyRods 2.0)." };
            notes = { amorti: 9.5, dynamisme: 10.0, confort: 8.5, stabilite: 8.0 };
            pForts = ["Retour d'énergie bluffant", "Poids plume (200g)", "Adhérence Lighttraxion Continental"]; pFaibles = ["Fit étroit de compétition", "Léger frottement possible au talon"];
        } else if (t.includes('evo 1') || t.includes('évo 1')) {
            specs = { prix: "500 €", poids: "138 g", drop: "6 mm", stack: "39 mm / 33 mm", profil: "Hyper-Elite", usage: "Super-shoe ultime de marathon conçue pour les records absolus." };
            notes = { amorti: 8.5, dynamisme: 10.0, confort: 8.0, stabilite: 7.0 };
            pForts = ["Poids irréel (138g !)", "Économie de course hors norme", "Rocker avant agressif"]; pFaibles = ["Prix stratosphérique (500€)", "Durabilité très limitée"];
        } else if (t.includes('adios 9')) {
            specs = { prix: "140 €", poids: "175 g", drop: "7 mm", stack: "27 mm / 20 mm", profil: "Léger / Piste", usage: "Piste, VMA, fractionné court et travail de pied (100% Lightstrike Pro sans plaque)." };
            notes = { amorti: 6.5, dynamisme: 9.5, confort: 8.0, stabilite: 8.0 };
            pForts = ["Sensation du sol exceptionnelle (175g)", "100% mousse Lightstrike Pro", "Tarif contenu (140€)"]; pFaibles = ["Stack bas exigeant pour les mollets"];
        } else if (t.includes('boston 13')) {
            specs = { prix: "160 €", poids: "255 g", drop: "6 mm", stack: "36 mm / 30 mm", profil: "Universel Rapide", usage: "Super-trainer polyvalent pour tempo, seuil et sorties longues rythmées." };
            notes = { amorti: 8.5, dynamisme: 9.0, confort: 8.5, stabilite: 8.5 };
            pForts = ["Plus de mousse Lightstrike Pro à l'avant", "Tiges EnergyRods 2.0", "Semelle Continental ultra durable"]; pFaibles = ["Un peu ferme à très basse allure"];
        } else if (t.includes('novablast 5')) {
            specs = { prix: "150 €", poids: "255 g", drop: "8 mm", stack: "41.5 mm / 33.5 mm", profil: "Neutre", usage: "Daily trainer ultra-polyvalent et rebondissant (nouvelle mousse FF Blast MAX)." };
            notes = { amorti: 9.5, dynamisme: 8.5, confort: 9.5, stabilite: 8.5 };
            pForts = ["Mousse FF Blast MAX encore plus douce", "Polyvalence du footing au tempo", "Rapport qualité/prix top (150€)"]; pFaibles = ["Moins incisive sur VMA courte"];
        } else if (t.includes('superblast 2')) {
            specs = { prix: "220 €", poids: "249 g", drop: "8 mm", stack: "45 mm / 37 mm", profil: "Super-Trainer", usage: "Le roi des Super-Trainers sans plaque : sorties longues, marathon et tempo." };
            notes = { amorti: 9.5, dynamisme: 9.5, confort: 9.0, stabilite: 9.0 };
            pForts = ["Mousse élite FF Turbo+ sans plaque", "Rapport stack (45mm) / poids (249g) fou", "Stabilité remarquable"]; pFaibles = ["Prix élevé (220€)", "Souvent en rupture de stock"];
        } else if (t.includes('vaporfly 4')) {
            specs = { prix: "260 €", poids: "190 g", drop: "6 mm", stack: "35 mm / 29 mm", profil: "Elite", usage: "Compétition élite agile du 5 km au marathon (ZoomX + plaque Flyplate carbone)." };
            notes = { amorti: 8.5, dynamisme: 10.0, confort: 8.0, stabilite: 7.5 };
            pForts = ["Plus légère que jamais (190g)", "Relance explosive sur 5k/10k/semi", "Mousse ZoomX ultra réactive"]; pFaibles = ["Moins protectrice qu'une Alphafly sur marathon"];
        } else if (t.includes('zoom fly 6')) {
            specs = { prix: "170 €", poids: "265 g", drop: "8 mm", stack: "42 mm / 34 mm", profil: "Universel Rapide", usage: "Entraînement carbone et compétition accessible (ZoomX + plaque Flyplate)." };
            notes = { amorti: 9.0, dynamisme: 9.0, confort: 9.0, stabilite: 8.5 };
            pForts = ["Allégée et bien plus dynamique que la v5", "Excellente paire d'entraînement carbone", "Prix contenu (170€)"]; pFaibles = ["Poids encore au-dessus des pures élites"];
        } else if (t.includes('pegasus premium')) {
            specs = { prix: "210 €", poids: "310 g", drop: "10 mm", stack: "45 mm / 35 mm", profil: "Maxi Confort", usage: "Cruiser futuriste combinant ZoomX, ReactX et unité Air Zoom sculptée intégrale." };
            notes = { amorti: 9.5, dynamisme: 8.5, confort: 9.5, stabilite: 8.0 };
            pForts = ["Unité Air Zoom intégrale unique", "Effet trampoline ultra fun", "Design spectaculaire"]; pFaibles = ["Poids élevé (310g)", "Tarif premium (210€)"];
        } else if (t.includes('pegasus plus')) {
            specs = { prix: "180 €", poids: "245 g", drop: "10 mm", stack: "35 mm / 25 mm", profil: "Universel Rapide", usage: "L'héritière de la Pegasus Turbo : 100% ZoomX sans plaque pour le tempo quotidien." };
            notes = { amorti: 8.5, dynamisme: 8.5, confort: 9.0, stabilite: 8.0 };
            pForts = ["Semelle 100% ZoomX joueuse", "Souplesse naturelle sans plaque", "Look racé"]; pFaibles = ["Prix un peu haut (180€)"];
        } else if (t.includes('bondi 9')) {
            specs = { prix: "180 €", poids: "297 g", drop: "5 mm", stack: "43 mm / 38 mm", profil: "Maxi Confort", usage: "Ultra-amorti maximaliste (mousse supercritique) pour footings et récupération." };
            notes = { amorti: 10.0, dynamisme: 6.5, confort: 10.0, stabilite: 9.0 };
            pForts = ["Nouvelle mousse supercritique plus vivante", "Protection articulaire totale (43mm)", "Stabilité royale"]; pFaibles = ["Gabarit imposant"];
        } else if (t.includes('cielo x1')) {
            specs = { prix: "275 €", poids: "228 g", drop: "7 mm", stack: "40 mm / 33 mm", profil: "Elite", usage: "Fusée carbone Hoka à double couche PEBA et rocker agressif pour le marathon." };
            notes = { amorti: 9.5, dynamisme: 10.0, confort: 8.5, stabilite: 7.5 };
            pForts = ["Bascule vers l'avant phénoménale", "Rebond PEBA ultra généreux", "Plaque carbone ailée"]; pFaibles = ["Prix très élevé (275€)"];
        } else if (t.includes('speedgoat 6')) {
            specs = { prix: "160 €", poids: "278 g", drop: "5 mm", stack: "40 mm / 35 mm", profil: "Trail Polyvalent", usage: "La référence polyvalente du trail technique au long cours (Vibram Megagrip)." };
            notes = { amorti: 9.0, dynamisme: 8.0, confort: 8.5, stabilite: 9.0 };
            pForts = ["Accroche Vibram Megagrip 5mm", "Plus légère et précise que la v5", "Polyvalence montagne"]; pFaibles = ["Mousse un peu plus ferme qu'avant"];
        } else if (t.includes('deviate nitro elite 3')) {
            specs = { prix: "230 €", poids: "194 g", drop: "8 mm", stack: "40 mm / 32 mm", profil: "Elite", usage: "Compétition route élite (mousse Nitrofoam Elite + plaque carbone PWRPLATE)." };
            notes = { amorti: 9.0, dynamisme: 10.0, confort: 8.5, stabilite: 8.0 };
            pForts = ["Rapport perf/prix exceptionnel (230€)", "194g seulement", "Grip PumaGrip imbattable sous la pluie"]; pFaibles = ["Disponibilité parfois limitée"];
        } else if (t.includes('deviate nitro 3')) {
            specs = { prix: "170 €", poids: "265 g", drop: "10 mm", stack: "39 mm / 29 mm", profil: "Universel Rapide", usage: "Entraînement dynamique à plaque carbone souple et grip tous temps." };
            notes = { amorti: 8.5, dynamisme: 8.5, confort: 8.5, stabilite: 8.5 };
            pForts = ["Semelle PumaGrip royale sur sol mouillé", "Plaque PWRPLATE polyvalente", "Très durable"]; pFaibles = ["Un peu lourde (265g)"];
        } else if (t.includes('cloudboom strike')) {
            specs = { prix: "280 €", poids: "210 g", drop: "4 mm", stack: "39.5 mm / 35.5 mm", profil: "Elite", usage: "Compétition marathon élite avec insert amovible BounceBoard en Helion HF." };
            notes = { amorti: 9.5, dynamisme: 9.5, confort: 8.5, stabilite: 7.5 };
            pForts = ["Rebond massif BounceBoard sans première de montage", "Mousse Helion HF ultra tendre", "Propulsion marathon"]; pFaibles = ["Prix élite (280€)"];
        } else if (t.includes('neo vista')) {
            specs = { prix: "180 €", poids: "265 g", drop: "8 mm", stack: "44.5 mm / 36.5 mm", profil: "Super-Trainer", usage: "Super-trainer ultra-confort à chausson tricoté et plaque fibre de verre." };
            notes = { amorti: 9.5, dynamisme: 8.5, confort: 9.5, stabilite: 8.0 };
            pForts = ["Douceur Enerzy NXT exceptionnelle", "Géométrie Smooth Speed Assist fluide", "Chausson knit hyper doux"]; pFaibles = ["Maintien latéral souple dans les virages serrés"];
        } else if (t.includes('ride 18') || t.includes('ride 17')) {
            specs = { prix: "150 €", poids: "259 g", drop: "8 mm", stack: "35 mm / 27 mm", profil: "Neutre", usage: "Le couteau suisse quotidien en mousse PWRRUN+ pour tout faire sereinement." };
            notes = { amorti: 8.5, dynamisme: 7.5, confort: 9.0, stabilite: 9.0 };
            pForts = ["Fiabilité et durabilité exemplaires", "Mousse PWRRUN+ constante hiver comme été", "Stabilité naturelle"]; pFaibles = ["Sensations sages"];
        } else if (t.includes('glycerin max')) {
            specs = { prix: "200 €", poids: "298 g", drop: "6 mm", stack: "45 mm / 39 mm", profil: "Maxi Confort", usage: "Maxi-cruiser doté de la mousse DNA Tuned à double cellules d'azote." };
            notes = { amorti: 10.0, dynamisme: 7.5, confort: 9.5, stabilite: 9.0 };
            pForts = ["Mousse DNA Tuned hyper protectrice", "Rocker GlideRoll fluide malgré les 45mm", "Finition luxueuse"]; pFaibles = ["Poids proche des 300g", "Prix (200€)"];
        }
    }

    return { specs, notes, pForts, pFaibles };
}
