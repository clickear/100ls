import React from 'react';

interface HighlightedTextProps {
  text: string;
  patterns?: {
    patternId: number;
    patternText: string;
    exactText: string;
  }[];
  className?: string;
}

// Predefined luxury colors for different patterns
const PATTERN_COLORS = [
  '#4ADE80', // Green
  '#60A5FA', // Blue
  '#F472B6', // Pink
  '#FB923C', // Orange
  '#A78BFA', // Purple
  '#FACC15', // Yellow
  '#2DD4BF', // Teal
  '#F87171', // Red
];

export default function HighlightedText({ text, patterns, className }: HighlightedTextProps) {
  if (!patterns || patterns.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort patterns by length (descending) to avoid overlapping issues in a simple way
  // or by their position in the text.
  // We'll use a simple regex replacement approach.
  
  let parts: (string | React.ReactNode)[] = [text];

  patterns.forEach((p, idx) => {
    const color = PATTERN_COLORS[p.patternId % PATTERN_COLORS.length];
    const newParts: (string | React.ReactNode)[] = [];

    parts.forEach(part => {
      if (typeof part !== 'string') {
        newParts.push(part);
        return;
      }

      // Escape exactText for regex
      const escaped = p.exactText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const split = part.split(regex);

      split.forEach((sub, i) => {
        if (i % 2 === 1) {
          newParts.push(
            <span 
              key={`${p.patternId}-${idx}-${i}`} 
              style={{ 
                color: color, 
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: `${color}44`,
                textUnderlineOffset: '4px'
              }}
            >
              {sub}
            </span>
          );
        } else if (sub) {
          newParts.push(sub);
        }
      });
    });
    parts = newParts;
  });

  return <span className={className}>{parts}</span>;
}
