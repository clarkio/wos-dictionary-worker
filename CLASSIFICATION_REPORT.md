# Word Language Classification Report

## Summary

**Total Words Analyzed:** 10,138
**Confidence Threshold:** 60%
**Date:** 2025-12-03

## Results

| Category | Count | Percentage | Status |
|----------|-------|------------|--------|
| **English** | 10,040 | 99.0% | ≥60% confidence |
| **Portuguese** | 12 | 0.1% | ≥60% confidence |
| **Unknown/Uncertain** | 86 | 0.8% | <60% confidence - requires manual review |

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

Only 86 words scored below the 60% confidence threshold. These are flagged for manual review.

**Common characteristics of uncertain words:**
- Scoring 50-55% confidence
- Many are short words (3-4 letters)
- Unusual vowel patterns or letter combinations
- May include borrowed words or specialized terms

**Sample uncertain words:**
- aide (55%)
- ease (55%)
- yoke (55%)
- aeon (50%)
- ague (50%)
- ahoy (50%)

## Recommendations

### Manual Review (Highly Manageable)
- Review only 86 words in `output/words_unknown.json`
- Words are sorted by confidence score (highest first)
- Most are short or unusual words that may be:
  - Valid English words with unusual patterns
  - Borrowed words from other languages
  - Archaic or specialized terms
  - Potentially invalid/made-up words

### Next Steps
1. Review the 86 uncertain words (should take <10 minutes)
2. Manually categorize each as English, Portuguese, or Invalid
3. Update the respective JSON files with your decisions
4. The classifier can be re-run on new word lists using the same 60% threshold

## Output Files

1. **`output/words_english.json`** - 10,040 English words (≥60% confidence)
2. **`output/words_portuguese.json`** - 12 Portuguese words (≥60% confidence)
3. **`output/words_unknown.json`** - 86 uncertain words (<60% confidence)
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
