const fs = require('fs');
const html = fs.readFileSync('_legacy/index.html', 'utf-8');

const startIndex = html.indexOf("if (t.includes('hyperboost')) {");
const endIndex = html.indexOf("let pointsFortsHTML");

if (startIndex > -1 && endIndex > -1) {
    let logic = html.substring(startIndex, endIndex);

    // Fix the drop bug
    logic = logic.replace('drop = "10 mm";', 'specs.drop = "10 mm";');

    const tsCode = `
export interface ShoeSpecs {
    specs: { poids: string; drop: string; stack: string; prix: string; profil: string; usage: string; };
    notes: { amorti: number; dynamisme: number; confort: number; stabilite: number; };
    pForts: string[];
    pFaibles: string[];
}

export function getSpecsForArticle(title: string): ShoeSpecs {
    const t = title.toLowerCase();
    
    let specs = { poids: "Voir article", drop: "Voir article", stack: "NC", prix: "Voir article", profil: "Neutre", usage: "Polyvalent" };
    let notes = { amorti: 8.0, dynamisme: 8.0, confort: 8.0, stabilite: 8.0 };
    let pForts = ["Chaussure réputée", "Bonne accroche"];
    let pFaibles = ["Prix", "Durabilité"];

    ${logic}

    return { specs, notes, pForts, pFaibles };
}
`;

    fs.writeFileSync('src/lib/specsData.ts', tsCode);
    console.log("Successfully extracted specs to src/lib/specsData.ts");
} else {
    console.log("Could not find boundaries.");
}
