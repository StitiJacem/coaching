const fs = require("fs");
const files = [
  "Global_Cas_Utilisation.drawio",
  "Sprint1_Cas_Utilisation.drawio",
  "Sprint2_Cas_Utilisation.drawio",
  "Sprint3_Cas_Utilisation.drawio",
  "Sprint4_Cas_Utilisation.drawio",
];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const includeLabels = (text.match(/&lt;&lt;include&gt;&gt;/g) || []).length;
  const extendLabels = (text.match(/&lt;&lt;extend&gt;&gt;/g) || []).length;
  const authTargets = (text.match(/target="uc_S_authentifier"/g) || []).length;
  console.log(`${file}: include=${includeLabels} extend=${extendLabels} includeToAuth=${authTargets}`);
}
