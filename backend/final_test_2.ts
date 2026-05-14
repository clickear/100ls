function patternToRegex(pattern) {
  let escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let regexStr = escaped.replace(/ /g, '\\s+');
  regexStr = regexStr.replace(/\\\*/g, '.*?');
  regexStr = regexStr.replace(/\\s\+\.\*\?/g, '\\s*.*?');
  const trailingBoundary = pattern.endsWith('*') ? '' : '\\b';
  return new RegExp(`\\b${regexStr}${trailingBoundary}`, 'i');
}

const p = "going to *";
const s = "is this going to take a while?";
console.log("Regex:", patternToRegex(p));
console.log("Match:", s.match(patternToRegex(p))?.[0]);
