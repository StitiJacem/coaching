const plantuml = require('node-plantuml');
const fs = require('fs');
const path = require('path');

const latexDir = "c:\\Users\\yassin\\OneDrive\\Desktop\\coaching-main\\rapport_coaching_latex";
const diagramsDir = path.join(latexDir, 'diagrams');

// All sequence diagram PUML files to generate
const pumlFiles = [
    'Sprint1_Sequence_Auth.puml',
    'Sprint2_Sequence_CoachingRequest.puml',
    'Sprint2_Sequence_Programme.puml',
    'Sprint3_Sequence_Message.puml',
    'Sprint3_Sequence_SaveProgram.puml',
    'Sprint4_Sequence_LogMeal.puml',
    'Sprint4_Sequence_Physiologique.puml',
    'Sprint5_Sequence_Message.puml',
    'Sprint5_Sequence_Reservation.puml',
];

// Sprint5_Sequence_Message.puml doesn't exist yet, skip if missing
function generatePng(pumlFile) {
    return new Promise((resolve, reject) => {
        const inputPath = path.join(latexDir, pumlFile);
        const outputName = pumlFile.replace('.puml', '.png');
        const outputPath = path.join(diagramsDir, outputName);

        if (!fs.existsSync(inputPath)) {
            console.log(`SKIP (not found): ${pumlFile}`);
            return resolve();
        }

        console.log(`Generating ${outputName}...`);
        const gen = plantuml.generate(inputPath, { format: 'png', charset: 'utf-8' });
        const out = fs.createWriteStream(outputPath);
        gen.out.pipe(out);
        out.on('finish', () => {
            console.log(`  ✓ Done: ${outputName}`);
            resolve();
        });
        out.on('error', (err) => reject(err));
        gen.out.on('error', (err) => reject(err));
    });
}

async function main() {
    for (const file of pumlFiles) {
        try {
            await generatePng(file);
        } catch (e) {
            console.error(`  ✗ Error generating ${file}: ${e.message}`);
        }
    }
    console.log('\nAll sequence diagrams generated successfully.');
}

main();
