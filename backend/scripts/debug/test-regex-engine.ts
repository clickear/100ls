const pattern = "You know *";
const sentence = "You know, ever since college, it's been Marshall and Lillie and me.";

function patternToRegex(pattern) {
  let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  let regexStr = escaped.replace(/\*/g, '.*?');
  return new RegExp(`\\b${regexStr}\\b`, 'i');
}

const regex = patternToRegex(pattern);
const match = sentence.match(regex);

console.log("Regex:", regex);
console.log("Match:", match ? match[0] : "null");
