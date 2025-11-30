#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { franc } = require('franc-min');
const wordlistEnglish = require('wordlist-english');
const { ProxyAgent, setGlobalDispatcher } = require('undici');

const WORDS_URL = 'https://gist.githubusercontent.com/clarkio/516e0f266e94136c2c8abfd46892777d/raw/ac5a7f451ad9bdb8e225529c88e9d1a3782d1ded/words-list.json';
const OUTPUT_PATH = path.join(__dirname, '..', 'analysis', 'language-split.json');
const SUMMARY_PATH = path.join(__dirname, '..', 'analysis', 'language-split.md');

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

let englishWords;
const portugueseAccentPattern = /[áâàãéêíóôõúüç]/i;
const portugueseSuffixPattern = /(ção|ções|mente|dade|agem|eiro|eira|inha|inho|íssim[oa]s?|zinho|zinha)$/i;
const englishSuffixPattern = /(ing|ed|tion|sion|ness|ment|less|able|ible|ous|ize|ise|ful|ally|ically)$/i;
const englishOverrides = new Set(['repo', 'cafe', 'colour', 'colors', 'colours', 'flyer', 'flyers']);

function toWord(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function detectWithFranc(word) {
  const result = franc(word, { whitelist: ['eng', 'por'], minLength: 2 });
  if (result === 'eng') return 'english';
  if (result === 'por') return 'portuguese';
  return 'unknown';
}

async function loadPortugueseWords() {
  const dictionaryModule = await import('dictionary-pt');
  const dictionary = dictionaryModule.default || dictionaryModule;
  const raw = Buffer.from(dictionary.dic).toString('utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);

  const words = new Set();
  for (const line of lines.slice(1)) {
    const [entry] = line.split(/[\s/]/);
    if (entry) {
      words.add(entry.toLowerCase());
    }
  }
  return words;
}

async function loadEnglishWords() {
  const baseWords = new Set(wordlistEnglish['english'].map((word) => word.toLowerCase()));
  const dictionaryModule = await import('dictionary-en');
  const dictionary = dictionaryModule.default || dictionaryModule;
  const raw = Buffer.from(dictionary.dic).toString('utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);

  for (const line of lines.slice(1)) {
    const [entry] = line.split(/[\s/]/);
    if (entry) {
      baseWords.add(entry.toLowerCase());
    }
  }

  return baseWords;
}

function classifyWord(rawWord, portugueseWords) {
  const word = toWord(rawWord);
  if (!word) return 'unknown';

  const lowered = word.toLowerCase();
  const englishMatch = englishWords.has(lowered);
  const portugueseMatch = portugueseWords.has(lowered);
  const accentPortuguese = portugueseAccentPattern.test(lowered);
  const portugueseMarkers = accentPortuguese || /(nh|lh|ç)/i.test(lowered) || portugueseSuffixPattern.test(lowered);
  const francGuess = lowered.length >= 4 ? detectWithFranc(lowered) : 'unknown';

  let englishScore = 0;
  let portugueseScore = 0;

  if (englishMatch) englishScore += 2;
  if (portugueseMatch) portugueseScore += 2;
  if (englishOverrides.has(lowered)) englishScore += 3;

  if (englishSuffixPattern.test(lowered)) englishScore += 1;
  if (portugueseMarkers) portugueseScore += 3;
  if (accentPortuguese && !englishMatch) portugueseScore += 2;

  if (francGuess === 'english') englishScore += 1;
  if (francGuess === 'portuguese') portugueseScore += 1;

  if (englishScore === 0 && portugueseScore === 0) return 'unknown';
  if (englishScore >= portugueseScore + 2) return 'english';
  if (portugueseScore >= englishScore + 2) return 'portuguese';

  if (englishScore === portugueseScore) {
    return francGuess !== 'unknown' ? francGuess : 'unknown';
  }

  return englishScore > portugueseScore ? 'english' : 'portuguese';
}

async function fetchWords() {
  const response = await fetch(WORDS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch words: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data || !Array.isArray(data.words)) {
    throw new Error('Unexpected payload shape from words list');
  }
  return data.words.map(toWord).filter(Boolean);
}

function summarize(groups) {
  const { english, portuguese, unknown } = groups;
  return {
    source: WORDS_URL,
    generatedAt: new Date().toISOString(),
    counts: {
      total: english.length + portuguese.length + unknown.length,
      english: english.length,
      portuguese: portuguese.length,
      unknown: unknown.length,
    },
    english,
    portuguese,
    unknown,
  };
}

function createMarkdownSummary(summary) {
  return [
    '# Language Split Summary',
    '',
    `Source: ${summary.source}`,
    `Generated: ${summary.generatedAt}`,
    '',
    '## Counts',
    `- Total: ${summary.counts.total}`,
    `- English: ${summary.counts.english}`,
    `- Portuguese: ${summary.counts.portuguese}`,
    `- Unknown: ${summary.counts.unknown}`,
    '',
    '## Files',
    '- analysis/language-split.json contains the full lists grouped by language.',
    '- analysis/language-split.md is this summary file.',
    '',
    '## Notes',
    '- English detection blends wordlist-english data with hunspell dictionary-en entries and a few overrides for short modern terms.',
    '- Portuguese detection uses hunspell dictionary-pt entries, diacritic checks, and common suffix markers, with franc-min only as a lightweight tie breaker.',
    '- Unknown would be used for cases without a clear scoring advantage.',
  ].join('\n') + '\n';
}

async function main() {
  englishWords = await loadEnglishWords();
  const portugueseWords = await loadPortugueseWords();
  const words = await fetchWords();
  const groups = { english: [], portuguese: [], unknown: [] };

  for (const word of words) {
    const classification = classifyWord(word, portugueseWords);
    groups[classification].push(word);
  }

  const summary = summarize(groups);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
  fs.writeFileSync(SUMMARY_PATH, createMarkdownSummary(summary));

  console.log('Analysis complete:');
  console.log(`English: ${summary.counts.english}`);
  console.log(`Portuguese: ${summary.counts.portuguese}`);
  console.log(`Unknown: ${summary.counts.unknown}`);
}

main().catch((error) => {
  console.error('Failed to analyze words:', error);
  process.exit(1);
});
