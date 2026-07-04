const fs=require('fs'); 
const t=fs.readFileSync('swagger-init.js', 'utf8'); 
const m=t.match(/"paths":\s*(\{[\s\S]*?\})\s*,\s*"components"/); 
if(m){ 
  const p=JSON.parse(m[1]); 
  for(let k in p) {
    if(k.includes('rekap')) {
       console.log("ENDPOINT:", k);
       console.log(JSON.stringify(p[k], null, 2));
    }
  }
}
