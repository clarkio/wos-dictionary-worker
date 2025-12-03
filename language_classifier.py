#!/usr/bin/env python3
"""
Practical language classifier for word lists.
Uses adjusted scoring to properly categorize English words while maintaining
strict Portuguese detection. Designed for word game dictionaries.
"""

import json
import re
from typing import Tuple, Dict, Set

class WordLanguageClassifier:
    def __init__(self):
        # Portuguese exclusive indicators
        self.pt_exclusive_chars = set('ãõáéíóúâêôàç')

        self.portuguese_markers = {
            'strong_endings': ['ção', 'ssão', 'ões', 'ães', 'ãos', 'ência', 'ância'],
            'common_words': {
                'que', 'não', 'com', 'uma', 'para', 'por', 'mais', 'dos', 'das',
                'como', 'mas', 'foi', 'ele', 'ela', 'seu', 'sua', 'isso', 'ser',
                'tem', 'são', 'pelo', 'pela', 'nos', 'nas', 'aos', 'bem', 'sem',
                'até', 'muito', 'também', 'quando', 'outro', 'todos', 'está',
                'fazer', 'onde', 'poder', 'casa', 'cada', 'ainda', 'assim',
                'coisa', 'dia', 'vez', 'nem', 'tal', 'aqui', 'pois', 'nome',
                'ilha', 'calha', 'ilhar', 'bilhar', 'brilha', 'brilhar',
                'filho', 'filha', 'olhar', 'melhor', 'mulher', 'trabalho',
                'conselho', 'velho', 'velha', 'joelho', 'coelho'
            },
            # Known English words with 'nh' or 'lh' - NOT Portuguese
            'english_exceptions': {
                'inhale', 'inhaled', 'inhaler', 'inhaling', 'inhere', 'inherent',
                'inherit', 'inherits', 'inherited', 'enhance', 'enhanced',
                'enhances', 'enhancing', 'enhancement', 'pinhead', 'pinhole',
                'skinhead', 'manhood', 'womanhood', 'manhole', 'unhappy',
                'unhang', 'unhanged', 'unhanded', 'unhand', 'bullhead',
                'bullheaded', 'fullhead', 'schoolhouse', 'coolheaded',
                'foolhardy', 'woolhat', 'inhales', 'unhinge', 'unhinged'
            }
        }

    def is_portuguese(self, word: str) -> Tuple[bool, float, str]:
        """
        Strictly determine if a word is Portuguese.
        Returns: (is_portuguese, confidence, reason)
        """
        word_lower = word.lower()

        # Strong indicator: Portuguese exclusive characters
        if any(char in word_lower for char in self.pt_exclusive_chars):
            return (True, 99.0, 'portuguese_characters')

        # Strong indicator: Portuguese endings
        for ending in self.portuguese_markers['strong_endings']:
            if word_lower.endswith(ending):
                return (True, 96.0, f'portuguese_ending_{ending}')

        # Strong indicator: Common Portuguese words
        if word_lower in self.portuguese_markers['common_words']:
            return (True, 98.0, 'common_portuguese_word')

        # Portuguese digraph patterns (vowel-lh/nh-vowel) - excluding English exceptions
        if word_lower not in self.portuguese_markers['english_exceptions']:
            # Portuguese 'lh' sound pattern
            if re.search(r'[aeiou]lh[aeiou]', word_lower):
                # Check it's not just an English compound
                if not any(word_lower.startswith(p) for p in ['un', 'in', 'en', 'full']):
                    return (True, 92.0, 'portuguese_lh_pattern')

            # Portuguese 'nh' sound pattern
            if re.search(r'[aeiou]nh[aeiou]', word_lower):
                # Exclude English prefixes
                if not any(word_lower.startswith(p) for p in ['un', 'in', 'en', 'pin', 'man']):
                    # Piranha is used in English despite Portuguese origin
                    if word_lower != 'piranha':
                        return (True, 92.0, 'portuguese_nh_pattern')

        return (False, 0, '')

    def calculate_english_confidence(self, word: str) -> Tuple[float, list]:
        """
        Calculate English confidence score with generous scoring.
        Returns: (confidence_score, list_of_indicators)
        """
        word_lower = word.lower()
        score = 0
        indicators = []

        # Base score for having basic English structure
        base_score = 50  # Adjusted for practical classification of word game dictionaries
        score += base_score
        indicators.append('basic_structure')

        # Contains vowels (essential)
        if any(v in word_lower for v in 'aeiouy'):
            score += 10
            indicators.append('has_vowels')

        # Common English letter patterns
        # 'th' - very characteristic of English
        if 'th' in word_lower:
            score += 15
            indicators.append('contains_th')

        # Common English endings
        english_endings = {
            'ing': 12, 'ed': 12, 'er': 10, 'ly': 10, 'tion': 15, 'sion': 15,
            'ness': 12, 'ment': 12, 'ful': 10, 'less': 10, 'able': 10,
            'ible': 10, 'ous': 10, 'ious': 12, 'est': 8, 'ish': 8,
            'ize': 10, 'ise': 10, 'ive': 8, 'age': 8, 'ance': 10,
            'ence': 10, 'ant': 8, 'ent': 8, 'ity': 10, 'ty': 6
        }

        for ending, points in english_endings.items():
            if word_lower.endswith(ending) and len(word_lower) > len(ending) + 1:
                score += points
                indicators.append(f'ending_{ending}')
                break  # Only count one ending

        # English trigraphs and letter combinations
        if any(tri in word_lower for tri in ['tch', 'dge', 'sch', 'chr']):
            score += 10
            indicators.append('english_trigraph')

        # Double consonants (common in English)
        if re.search(r'([bcdfghjklmnpqrstvwxyz])\1', word_lower):
            score += 5
            indicators.append('double_consonant')

        # Silent 'e' pattern (common in English)
        if len(word_lower) > 3 and word_lower.endswith('e'):
            if word_lower[-2] not in 'aeiou':  # consonant before final 'e'
                score += 5
                indicators.append('silent_e_pattern')

        # Pronounceable check (reduce score if not pronounceable)
        if not self._is_english_pronounceable(word_lower):
            score -= 15
            indicators.append('non_standard_pattern')

        # Bonus for common word lengths (3-12 characters)
        if 3 <= len(word) <= 12:
            score += 5

        return (min(100, max(0, score)), indicators)

    def _is_english_pronounceable(self, word: str) -> bool:
        """Check if word follows English pronunciation patterns"""
        # Must have at least one vowel
        if not any(v in word for v in 'aeiouy'):
            return False

        # Not too many consecutive consonants (English typically max 3-4)
        if re.search(r'[bcdfghjklmnpqrstvwxz]{5,}', word):
            return False

        # Vowel ratio check (English typically 20-60% vowels)
        if len(word) > 0:
            vowel_count = sum(1 for c in word if c in 'aeiouy')
            ratio = vowel_count / len(word)
            if ratio < 0.15 or ratio > 0.7:
                return False

        return True

    def classify(self, word: str) -> Tuple[str, float, dict]:
        """
        Classify a word as English, Portuguese, or Unknown.
        Returns: (language, confidence, details)
        """
        if len(word) < 2:
            return ('unknown', 0, {'reason': 'too_short'})

        # First, check for Portuguese
        is_pt, pt_conf, pt_reason = self.is_portuguese(word)
        if is_pt:
            return ('portuguese', pt_conf, {'reason': pt_reason})

        # Calculate English confidence
        en_conf, en_indicators = self.calculate_english_confidence(word)

        return ('english', en_conf, {
            'indicators': en_indicators,
            'score_breakdown': f'{len(en_indicators)} factors'
        })


def process_word_list(input_file: str, output_dir: str = '.', confidence_threshold: float = 75.0):
    """Process word list and categorize by language"""

    # Load words
    print(f"📖 Loading words from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    words = data.get('words', [])
    print(f"✓ Loaded {len(words):,} words\n")

    # Initialize classifier
    classifier = WordLanguageClassifier()

    # Results storage
    results = {
        'english': [],
        'portuguese': [],
        'unknown': []
    }

    stats = {
        'total': len(words),
        'english': 0,
        'portuguese': 0,
        'unknown': 0
    }

    # Process words
    print(f"🔍 Classifying words (threshold: {confidence_threshold}%)...")
    for i, word in enumerate(words):
        if (i + 1) % 2000 == 0:
            print(f"   Progress: {i + 1:,}/{len(words):,} ({(i+1)/len(words)*100:.1f}%)")

        language, confidence, details = classifier.classify(word)

        # Apply threshold
        if confidence < confidence_threshold:
            final_category = 'unknown'
        else:
            final_category = language

        results[final_category].append({
            'word': word,
            'language': language,
            'confidence': round(confidence, 2),
            'details': details
        })
        stats[final_category] += 1

    print(f"✓ Classification complete!\n")

    # Sort by confidence
    for category in results:
        results[category].sort(key=lambda x: (-x['confidence'], x['word']))

    # Save results
    import os
    os.makedirs(output_dir, exist_ok=True)

    for category, word_list in results.items():
        output_file = os.path.join(output_dir, f'words_{category}.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'category': category,
                'count': len(word_list),
                'confidence_threshold': f'{confidence_threshold}%',
                'words': word_list
            }, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved: {output_file} ({len(word_list):,} words)")

    # Save summary
    summary_file = os.path.join(output_dir, 'classification_summary.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump({
            'total_words': stats['total'],
            'threshold': f'{confidence_threshold}%',
            'categories': stats
        }, f, indent=2)
    print(f"💾 Saved: {summary_file}\n")

    # Print summary
    print("=" * 70)
    print("CLASSIFICATION SUMMARY")
    print("=" * 70)
    print(f"Total words: {stats['total']:,}\n")
    print(f"📘 English (≥{confidence_threshold}%):     {stats['english']:,} ({stats['english']/stats['total']*100:5.1f}%)")
    print(f"📗 Portuguese (≥{confidence_threshold}%):  {stats['portuguese']:,} ({stats['portuguese']/stats['total']*100:5.1f}%)")
    print(f"❓ Unknown (<{confidence_threshold}%):      {stats['unknown']:,} ({stats['unknown']/stats['total']*100:5.1f}%)")
    print("=" * 70)

    # Show samples
    print("\n📘 Sample ENGLISH words (highest confidence):")
    for item in results['english'][:10]:
        ind = ', '.join(item['details'].get('indicators', [])[:3])
        print(f"   {item['word']:<18} {item['confidence']:>5.1f}%   [{ind}]")

    if results['portuguese']:
        print("\n📗 Sample PORTUGUESE words:")
        for item in results['portuguese'][:10]:
            reason = item['details'].get('reason', '')
            print(f"   {item['word']:<18} {item['confidence']:>5.1f}%   [{reason}]")

    if results['unknown']:
        print(f"\n❓ Sample UNKNOWN/UNCERTAIN words (for manual review):")
        for item in results['unknown'][:20]:
            lang = item['language'][:2].upper()
            print(f"   {item['word']:<18} {item['confidence']:>5.1f}%   [detected: {lang}]")

    print(f"\n✅ Processing complete!\n")

    return stats


if __name__ == '__main__':
    import sys

    # Default parameters
    input_file = sys.argv[1] if len(sys.argv) > 1 else '/tmp/words-list.json'
    output_dir = sys.argv[2] if len(sys.argv) > 2 else './output'
    threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 75.0

    print("=" * 70)
    print("WORD LANGUAGE CLASSIFIER")
    print("=" * 70)
    print(f"Input: {input_file}")
    print(f"Output: {output_dir}/")
    print(f"Threshold: {threshold}%")
    print("=" * 70)
    print()

    process_word_list(input_file, output_dir, threshold)
