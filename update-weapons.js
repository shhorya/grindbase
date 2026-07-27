const fs = require('fs');
const path = 'lib/weapons.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /image: ("[^"]+"),\r?\n(\s*)\},/g,
  'image: $1,\r\n$2  eligibleSeasonalCamos: 36,\r\n$2},'
);
fs.writeFileSync(path, content);
console.log('Done');