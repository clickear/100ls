function patternToRegex(pattern) {
  let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  let regexStr = escaped.replace(/ /g, '\\s+');
  regexStr = regexStr.replace(/\\\*/g, '.*?');
  regexStr = regexStr.replace(/\\s\+\.\*\?/g, '\\s*.*?');
  const trailingBoundary = pattern.endsWith('*') ? '' : '\\b';
  return new RegExp(`\\b${regexStr}${trailingBoundary}`, 'i');
}

const p1 = "going to *";
const s1 = "is this going to take a while?";

const p2 = "You know *";
const s2 = "You know, ever since college, it's been Marshall and Lillie and me.";

console.log("P1 Regex:", patternToRegex(p1));
console.log("P1 Match:", s1.match(patternToRegex(p1))?.[0]);

console.log("P2 Regex:", patternToRegex(p2));
console.log("P2 Match:", s2.match(patternToRegex(p2))?.[0]);
