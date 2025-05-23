export async function isProfane(word: string): Promise<boolean> {
  if (!word) return false;

  try {
    // Use PurgoMalum's API to check if the word contains profanity
    const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(word)}`);

    if (!response.ok) {
      console.error(`Error calling PurgoMalum API: ${response.status} ${response.statusText}`);
      return false;
    }

    const result = await response.text();
    return result.trim() === 'true';
  } catch (error) {
    console.error('Error in profanity check:', error);
    return false;
  }
}

// Main function to determine if a word should be blocked
export async function shouldBlockWord(word: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!word || typeof word !== 'string') {
    return { allowed: false, reason: 'Invalid input' };
  }

  if (word.trim() === '') {
    return { allowed: false, reason: 'Empty string not allowed' };
  }

  // Check if the word is too long (prevents abuse via very long submissions)
  if (word.length > 50) {
    return { allowed: false, reason: 'Word exceeds maximum length (50 characters)' };
  }

  // Check if the word contains spaces (ensures we're getting single words)
  if (/\s/.test(word)) {
    return { allowed: false, reason: 'Spaces not allowed (single words only)' };
  }

  // Only allow lowercase and uppercase letters
  const hasNonLetters = /[^a-zA-Z]/.test(word);
  console.log(`Word: '${word}', contains non-letters: ${hasNonLetters}`);

  if (hasNonLetters) {
    return { allowed: false, reason: 'Only letters are allowed' };
  }

  // Check for inappropriate content with external API
  const isProfaneResult = await isProfane(word);
  if (isProfaneResult) {
    return { allowed: false, reason: 'Word contains inappropriate content' };
  }

  // All checks passed
  return { allowed: true };
}
