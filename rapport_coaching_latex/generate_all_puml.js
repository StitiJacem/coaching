const fs = require('fs');
const path = require('path');
const plantuml = require('node-plantuml');
const { classDefs, assocDefs, sprintClasses, manualUseCases } = require('./generate_professional_staruml');

const latexDir = __dirname;
const diagramsDir = path.join(latexDir, 'diagrams');

function makeSafeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

function isSecondaryActor(name) {
  const n = name.toLowerCase();
  return n.includes('service') || 
         n.includes('provider') || 
         n.includes('catalogue') || 
         n.includes('database') || 
         n.includes('postgresql') || 
         n.includes('docker') || 
         n.includes('api') || 
         n.includes('socket') || 
         n.includes('ia');
}

// 1. Generate Use Case PUML
function generateUseCasePuml(title, spec, filename) {
  let puml = `@startuml\n`;
  puml += `title ${title}\n`;
  puml += `left to right direction\n`;
  puml += `skinparam monochrome true\n`;
  puml += `skinparam shadowing false\n`;
  puml += `skinparam packageStyle rectangle\n`;
  puml += `skinparam actorStyle stickman\n\n`;

  // Declare actors
  spec.actors.forEach(act => {
    puml += `actor "${act}" as ${makeSafeId(act)}\n`;
  });
  puml += `\n`;

  // Declare system boundary and use cases
  puml += `rectangle "Plateforme GOSPORT" {\n`;
  spec.cases.forEach(c => {
    puml += `  usecase "${c.name}" as ${makeSafeId(c.name)}\n`;
  });
  puml += `}\n\n`;

  // Draw actor relationships
  spec.cases.forEach(c => {
    const ucId = makeSafeId(c.name);
    c.actors.forEach(act => {
      const actId = makeSafeId(act);
      if (isSecondaryActor(act)) {
        puml += `${ucId} --> ${actId}\n`;
      } else {
        puml += `${actId} --> ${ucId}\n`;
      }
    });
  });
  puml += `\n`;

  // Draw includes
  (spec.includes || []).forEach(([from, to]) => {
    puml += `${makeSafeId(from)} .> ${makeSafeId(to)} : <<include>>\n`;
  });

  // Draw extends
  (spec.extends || []).forEach(([from, to]) => {
    puml += `${makeSafeId(to)} <. ${makeSafeId(from)} : <<extend>>\n`;
  });

  puml += `@enduml\n`;

  fs.writeFileSync(path.join(latexDir, filename), puml, 'utf8');
  console.log(`Generated: ${filename}`);
}

// 2. Generate Class PUML
function generateClassPuml(title, classes, filename) {
  let puml = `@startuml\n`;
  puml += `title ${title}\n`;
  puml += `left to right direction\n`;
  puml += `hide circle\n`;
  puml += `skinparam monochrome true\n`;
  puml += `skinparam shadowing false\n`;
  puml += `skinparam classAttributeIconSize 0\n\n`;

  const classSet = new Set(classes);

  // Declare classes
  classes.forEach(clsName => {
    const def = classDefs[clsName];
    if (!def) return;
    puml += `class ${clsName} {\n`;
    def.attrs.forEach(attr => {
      puml += `  +${attr}\n`;
    });
    def.ops.forEach(op => {
      puml += `  +${op}\n`;
    });
    puml += `}\n\n`;
  });

  // Draw associations
  assocDefs.forEach(([a, b, m1, m2, label]) => {
    if (classSet.has(a) && classSet.has(b)) {
      puml += `${a} "${m1}" --> "${m2}" ${b} : ${label}\n`;
    }
  });

  puml += `@enduml\n`;

  fs.writeFileSync(path.join(latexDir, filename), puml, 'utf8');
  console.log(`Generated: ${filename}`);
}

// Main execution
async function main() {
  // Use cases
  generateUseCasePuml("Diagramme de cas d'utilisation global - GOSPORT", manualUseCases.global, "Global_Cas_Utilisation.puml");
  for (let s = 1; s <= 4; s++) {
    generateUseCasePuml(`Diagramme de cas d'utilisation - Sprint ${s}`, manualUseCases[s], `Sprint${s}_Cas_Utilisation.puml`);
  }

  // Classes
  generateClassPuml("Diagramme de classes global - GOSPORT", sprintClasses.global, "Global_Classes.puml");
  for (let s = 1; s <= 4; s++) {
    generateClassPuml(`Diagramme de classes - Sprint ${s}`, sprintClasses[s], `Sprint${s}_Classes.puml`);
  }

  // Compile to PNG using node-plantuml
  const pumlFiles = [
    'Global_Cas_Utilisation.puml',
    'Global_Classes.puml',
    'Sprint1_Cas_Utilisation.puml',
    'Sprint1_Classes.puml',
    'Sprint2_Cas_Utilisation.puml',
    'Sprint2_Classes.puml',
    'Sprint3_Cas_Utilisation.puml',
    'Sprint3_Classes.puml',
    'Sprint4_Cas_Utilisation.puml',
    'Sprint4_Classes.puml',
    // Also compile the sequence diagrams
    'Sprint1_Sequence_Auth.puml',
    'Sprint2_Sequence_CoachingRequest.puml',
    'Sprint2_Sequence_Programme.puml',
    'Sprint3_Sequence_SaveProgram.puml',
    'Sprint4_Sequence_LogMeal.puml',
    'Sprint4_Sequence_Physiologique.puml',
  ];

  if (!fs.existsSync(diagramsDir)) {
    fs.mkdirSync(diagramsDir, { recursive: true });
  }

  function generatePng(pumlFile) {
    return new Promise((resolve, reject) => {
      const inputPath = path.join(latexDir, pumlFile);
      const outputName = pumlFile.replace('.puml', '.png');
      const outputPath = path.join(diagramsDir, outputName);

      if (!fs.existsSync(inputPath)) {
        console.log(`SKIP (not found): ${pumlFile}`);
        return resolve();
      }

      console.log(`Generating PNG for ${pumlFile}...`);
      const gen = plantuml.generate(inputPath, { format: 'png', charset: 'utf-8' });
      const out = fs.createWriteStream(outputPath);
      gen.out.pipe(out);
      out.on('finish', () => {
        console.log(`  ✓ Done: ${outputName}`);
        resolve();
      });
      out.on('error', err => reject(err));
      gen.out.on('error', err => reject(err));
    });
  }

  console.log('\nCompiling all PlantUML diagrams to PNG...');
  for (const file of pumlFiles) {
    try {
      await generatePng(file);
    } catch (e) {
      console.error(`  ✗ Error compiling ${file}: ${e.message}`);
    }
  }

  console.log('\nAll diagrams generated and compiled successfully.');
}

main().catch(err => console.error(err));
