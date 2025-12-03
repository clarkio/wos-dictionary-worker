# Word Language Classification Report

## Summary

**Total Words Analyzed:** 10,138
**Confidence Threshold:** 75%
**Date:** 2025-12-03

## Results

| Category | Count | Percentage | Status |
|----------|-------|------------|--------|
| **English** | 2,312 | 22.8% | ≥75% confidence |
| **Portuguese** | 12 | 0.1% | ≥75% confidence |
| **Unknown/Uncertain** | 7,814 | 77.1% | <75% confidence - requires manual review |

## Portuguese Words Identified

The following Portuguese words were detected with high confidence (≥75%):

1. bilhar (98%)
2. brilha (98%)
3. brilhar (98%)
4. cada (98%)
5. calha (98%)
6. casa (98%)
7. ilha (98%)
8. ilhar (98%)
9. nome (98%)
10. onde (98%)
11. outro (98%)
12. para (98%)

## English Word Samples

Sample English words classified with high confidence (≥75%):

- anything (92%)
- clothing (92%)
- nothing (92%)
- thinking (92%)
- thing (92%)
- brother (85%)
- father (85%)
- mother (85%)
- together (85%)

## Unknown/Uncertain Words

7,814 words scored below the 75% confidence threshold. These are flagged for manual review.

**Common characteristics of uncertain words:**
- Many are scoring 70-73% confidence (just below threshold)
- Most appear to be English words based on linguistic patterns
- They lack strong English markers (like 'th', common endings, etc.)

**Sample uncertain words:**
- accent (73%)
- agent (73%)
- ancient (73%)
- project (70%)
- finance (70%)
- change (70%)

## Recommendations

### Option 1: Manual Review (Current Approach)
- Review the 7,814 words in `output/words_unknown.json`
- Words are sorted by confidence score (highest first)
- Focus on words with confidence ≥70% first (likely English)

### Option 2: Adjust Confidence Threshold
If manually reviewing 7,814 words is impractical, consider:

- **70% threshold:** Would classify 4,138 as English, leaving 5,988 for review
- **65% threshold:** Would classify more words, but with lower confidence

### Option 3: Hybrid Approach
1. Auto-accept words ≥75% (current results)
2. Manually review words in 70-74% range (approximately 1,826 words)
3. Flag words <70% for deeper investigation

## Output Files

1. **`output/words_english.json`** - 2,312 English words (≥75% confidence)
2. **`output/words_portuguese.json`** - 12 Portuguese words (≥75% confidence)
3. **`output/words_unknown.json`** - 7,814 uncertain words (<75% confidence)
4. **`output/classification_summary.json`** - Statistical summary

## Classification Methodology

The classifier uses multiple linguistic indicators:

### Portuguese Detection (High Specificity)
- Portuguese-exclusive characters (ã, õ, ç, á, é, etc.)
- Strong Portuguese endings (-ção, -ssão, -ões, etc.)
- Portuguese digraphs (lh, nh) in specific patterns
- Common Portuguese words

### English Detection (Pattern-Based)
- Common English endings (-ing, -ed, -er, -tion, etc.)
- English letter combinations ('th', 'tch', 'dge', etc.)
- Pronunciation patterns
- Vowel distribution
- Word structure analysis

## Notes

- The classifier prioritizes **precision over recall** to minimize false positives
- Portuguese words with accents or unique patterns are detected with ~98% confidence
- English words with strong markers (like 'th') score highest
- Words lacking distinctive features require manual review
- False positives (English words incorrectly marked as Portuguese) have been minimized through exception handling

## Next Steps

1. Review the classification results in the output files
2. Decide on threshold adjustment if needed
3. Begin manual review of uncertain words
4. Optionally, create allowlists/blocklists to improve future classifications
