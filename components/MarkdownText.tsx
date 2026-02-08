import React from 'react';
import { Text, TextStyle } from 'react-native';
import { typography } from '../theme';

interface MarkdownTextProps {
  text: string;
  style?: TextStyle;
}

export default function MarkdownText({ text, style }: MarkdownTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Match **bold** patterns
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <Text key={key++} style={style}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    // Add the bold text
    parts.push(
      <Text key={key++} style={[style, { fontFamily: typography.fontFamily.bold, fontWeight: undefined }]}>
        {match[1]}
      </Text>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <Text key={key++} style={style}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  // If no bold found, just return the text
  if (parts.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return <Text style={style}>{parts}</Text>;
}
