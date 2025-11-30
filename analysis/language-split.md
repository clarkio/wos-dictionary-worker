# Language Split Summary

Source: https://gist.githubusercontent.com/clarkio/516e0f266e94136c2c8abfd46892777d/raw/ac5a7f451ad9bdb8e225529c88e9d1a3782d1ded/words-list.json
Generated: 2025-11-30T04:55:59.988Z

## Counts
- Total: 10138
- English: 9248
- Portuguese: 890
- Unknown: 0

## Files
- analysis/language-split.json contains the full lists grouped by language.
- analysis/language-split.md is this summary file.

## Notes
- English detection blends wordlist-english data with hunspell dictionary-en entries and a few overrides for short modern terms.
- Portuguese detection uses hunspell dictionary-pt entries, diacritic checks, and common suffix markers, with franc-min only as a lightweight tie breaker.
- Unknown would be used for cases without a clear scoring advantage.
