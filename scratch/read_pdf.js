const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('../rapport_pfe__Copy.pdf');

pdf(dataBuffer).then(function(data) {
    const text = data.text;
    
    // Find index of "Chapitre 3."
    let index = text.indexOf("Chapitre 3.   Sprint 1 — Gestion des Comptes et Authentification Sécurisée");
    if (index === -1) {
        index = text.indexOf("Sprint 1 — Gestion des Comptes");
    }
    
    // find second or third occurrence (the one in the actual chapter body, not Table of Contents)
    let occurrences = [];
    let idx = text.indexOf("Sprint 1");
    while (idx !== -1) {
        occurrences.push(idx);
        idx = text.indexOf("Sprint 1", idx + 1);
    }
    
    console.log(`Found ${occurrences.length} occurrences of "Sprint 1".`);
    occurrences.forEach((index, i) => {
        console.log(`Occurrence ${i+1} at index ${index}:`);
        console.log(text.substring(index, index + 2000));
        console.log("======================================\n");
    });
}).catch(err => {
    console.error("Error parsing pdf:", err);
});
