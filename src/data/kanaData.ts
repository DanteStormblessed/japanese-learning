import type { KanaCharacter, KanaRow, ScriptType } from '../types/kana';

// Helper to build character
const c = (
  script: ScriptType,
  char: string,
  romaji: string,
  category: KanaCharacter['category'],
  rowGroup: string,
  rowLabel: string,
  alternatives: string[] = [],
  mnemonic?: string
): KanaCharacter => ({
  id: `${script[0]}-${romaji.replace('/', '_')}-${char}`,
  script,
  character: char,
  romaji,
  alternatives: Array.from(new Set([romaji.toLowerCase(), ...alternatives.map(a => a.toLowerCase())])),
  category,
  rowGroup,
  rowLabel,
  mnemonic,
});

// HIRAGANA
export const HIRAGANA_CHARACTERS: KanaCharacter[] = [
  // Basic Gojūon
  c('hiragana', 'あ', 'a', 'basic', 'vowel', 'Vowels', [], 'Looks like an apple with a stem'),
  c('hiragana', 'い', 'i', 'basic', 'vowel', 'Vowels', [], 'Two trees standing upright'),
  c('hiragana', 'う', 'u', 'basic', 'vowel', 'Vowels', [], 'Bent over from an "Oof!" punch'),
  c('hiragana', 'え', 'e', 'basic', 'vowel', 'Vowels', [], 'An exotic bird with an energetic posture'),
  c('hiragana', 'お', 'o', 'basic', 'vowel', 'Vowels', [], 'A golfer swinging onto the green'),

  c('hiragana', 'か', 'ka', 'basic', 'k', 'K-row', [], 'A kite soaring with its tail'),
  c('hiragana', 'き', 'ki', 'basic', 'k', 'K-row', [], 'Looks like a classic key'),
  c('hiragana', 'く', 'ku', 'basic', 'k', 'K-row', [], 'A bird cuckoo beak pointing left'),
  c('hiragana', 'け', 'ke', 'basic', 'k', 'K-row', [], 'A keg with wooden slats'),
  c('hiragana', 'こ', 'ko', 'basic', 'k', 'K-row', [], 'Two koi fish swimming together'),

  c('hiragana', 'さ', 'sa', 'basic', 's', 'S-row', [], 'A samurai sword slashing down'),
  c('hiragana', 'し', 'shi', 'basic', 's', 'S-row', ['si'], 'A fishing hook dangling into water'),
  c('hiragana', 'す', 'su', 'basic', 's', 'S-row', [], 'A soup noodle loop'),
  c('hiragana', 'せ', 'se', 'basic', 's', 'S-row', [], 'People sitting next to each other saying "se"'),
  c('hiragana', 'そ', 'so', 'basic', 's', 'S-row', [], 'A zigzag sewing needle stitch'),

  c('hiragana', 'た', 'ta', 'basic', 't', 'T-row', [], 'Spells out "ta" in English letters'),
  c('hiragana', 'ち', 'chi', 'basic', 't', 'T-row', ['ti'], 'A cheerleader waving pom-poms'),
  c('hiragana', 'つ', 'tsu', 'basic', 't', 'T-row', ['tu'], 'A huge tsunami wave cresting'),
  c('hiragana', 'て', 'te', 'basic', 't', 'T-row', [], 'A dog wagging its curly tail'),
  c('hiragana', 'と', 'to', 'basic', 't', 'T-row', [], 'A thorn stuck in a big toe'),

  c('hiragana', 'な', 'na', 'basic', 'n', 'N-row', [], 'A nun praying before a cross'),
  c('hiragana', 'に', 'ni', 'basic', 'n', 'N-row', [], 'A needle and thread'),
  c('hiragana', 'ぬ', 'nu', 'basic', 'n', 'N-row', [], 'Noodles being twirled with chopsticks'),
  c('hiragana', 'ね', 'ne', 'basic', 'n', 'N-row', [], 'A cat (neko) curled up sleeping'),
  c('hiragana', 'の', 'no', 'basic', 'n', 'N-row', [], 'A "No entry" prohibition sign curve'),

  c('hiragana', 'は', 'ha', 'basic', 'h', 'H-row', [], 'A hockey stick and puck'),
  c('hiragana', 'ひ', 'hi', 'basic', 'h', 'H-row', [], 'A big smiling laughing face "hee hee"'),
  c('hiragana', 'ふ', 'fu', 'basic', 'h', 'H-row', ['hu'], 'Mt. Fuji with snow at the peak'),
  c('hiragana', 'へ', 'he', 'basic', 'h', 'H-row', [], 'The pointy peak of a mountain hill'),
  c('hiragana', 'ほ', 'ho', 'basic', 'h', 'H-row', [], 'A home chimney with smoke'),

  c('hiragana', 'ま', 'ma', 'basic', 'm', 'M-row', [], 'Four fingers in a baseball mitt'),
  c('hiragana', 'み', 'mi', 'basic', 'm', 'M-row', [], 'Looks like the number 21 (twenty-one)'),
  c('hiragana', 'む', 'mu', 'basic', 'm', 'M-row', [], 'A cow face saying "moooo"'),
  c('hiragana', 'め', 'me', 'basic', 'm', 'M-row', [], 'An eye with an eyebrow (me = eye in Japanese)'),
  c('hiragana', 'も', 'mo', 'basic', 'm', 'M-row', [], 'A fishhook with more worms caught'),

  c('hiragana', 'や', 'ya', 'basic', 'y', 'Y-row', [], 'A yak with sturdy horns'),
  c('hiragana', 'ゆ', 'yu', 'basic', 'y', 'Y-row', [], 'A unique fish swimming in water'),
  c('hiragana', 'よ', 'yo', 'basic', 'y', 'Y-row', [], 'A toy yo-yo with the string'),

  c('hiragana', 'ら', 'ra', 'basic', 'r', 'R-row', [], 'A rabbit sitting on its haunches'),
  c('hiragana', 'り', 'ri', 'basic', 'r', 'R-row', [], 'A flowing river with reeds'),
  c('hiragana', 'る', 'ru', 'basic', 'r', 'R-row', [], 'A road with a circular roundabout loop'),
  c('hiragana', 'れ', 're', 'basic', 'r', 'R-row', [], 'A person resting against a tree'),
  c('hiragana', 'ろ', 'ro', 'basic', 'r', 'R-row', [], 'A road with the loop robbed away'),

  c('hiragana', 'わ', 'wa', 'basic', 'w', 'W-row', [], 'A white swan with gracefully folded wings'),
  c('hiragana', 'を', 'wo', 'basic', 'w', 'W-row', ['o'], 'A cheerleader jumping whoa!'),
  c('hiragana', 'ん', 'n', 'basic', 'w', 'W-row', ['nn'], 'Looks just like a lowercase cursive "n"'),

  // Dakuten (Voiced)
  c('hiragana', 'が', 'ga', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('hiragana', 'ぎ', 'gi', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('hiragana', 'ぐ', 'gu', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('hiragana', 'げ', 'ge', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('hiragana', 'ご', 'go', 'dakuten', 'g', 'G-row (Dakuten)', []),

  c('hiragana', 'ざ', 'za', 'dakuten', 'z', 'Z-row (Dakuten)', []),
  c('hiragana', 'じ', 'ji', 'dakuten', 'z', 'Z-row (Dakuten)', ['zi']),
  c('hiragana', 'ず', 'zu', 'dakuten', 'z', 'Z-row (Dakuten)', []),
  c('hiragana', 'ぜ', 'ze', 'dakuten', 'z', 'Z-row (Dakuten)', []),
  c('hiragana', 'ぞ', 'zo', 'dakuten', 'z', 'Z-row (Dakuten)', []),

  c('hiragana', 'だ', 'da', 'dakuten', 'd', 'D-row (Dakuten)', []),
  c('hiragana', 'ぢ', 'ji', 'dakuten', 'd', 'D-row (Dakuten)', ['di', 'dji']),
  c('hiragana', 'づ', 'zu', 'dakuten', 'd', 'D-row (Dakuten)', ['du', 'dzu']),
  c('hiragana', 'で', 'de', 'dakuten', 'd', 'D-row (Dakuten)', []),
  c('hiragana', 'ど', 'do', 'dakuten', 'd', 'D-row (Dakuten)', []),

  c('hiragana', 'ば', 'ba', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('hiragana', 'び', 'bi', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('hiragana', 'ぶ', 'bu', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('hiragana', 'べ', 'be', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('hiragana', 'ぼ', 'bo', 'dakuten', 'b', 'B-row (Dakuten)', []),

  // Handakuten (Semi-voiced)
  c('hiragana', 'ぱ', 'pa', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('hiragana', 'ぴ', 'pi', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('hiragana', 'ぷ', 'pu', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('hiragana', 'ぺ', 'pe', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('hiragana', 'ぽ', 'po', 'handakuten', 'p', 'P-row (Handakuten)', []),

  // Combinations (Yōon)
  c('hiragana', 'きゃ', 'kya', 'combination', 'comb-k', 'Kya Combos', []),
  c('hiragana', 'きゅ', 'kyu', 'combination', 'comb-k', 'Kya Combos', []),
  c('hiragana', 'きょ', 'kyo', 'combination', 'comb-k', 'Kya Combos', []),

  c('hiragana', 'しゃ', 'sha', 'combination', 'comb-s', 'Sha Combos', ['sya']),
  c('hiragana', 'しゅ', 'shu', 'combination', 'comb-s', 'Sha Combos', ['syu']),
  c('hiragana', 'しょ', 'sho', 'combination', 'comb-s', 'Sha Combos', ['syo']),

  c('hiragana', 'ちゃ', 'cha', 'combination', 'comb-t', 'Cha Combos', ['tya', 'cya']),
  c('hiragana', 'ちゅ', 'chu', 'combination', 'comb-t', 'Cha Combos', ['tyu', 'cyu']),
  c('hiragana', 'ちょ', 'cho', 'combination', 'comb-t', 'Cha Combos', ['tyo', 'cyo']),

  c('hiragana', 'にゃ', 'nya', 'combination', 'comb-n', 'Nya Combos', []),
  c('hiragana', 'にゅ', 'nyu', 'combination', 'comb-n', 'Nya Combos', []),
  c('hiragana', 'にょ', 'nyo', 'combination', 'comb-n', 'Nya Combos', []),

  c('hiragana', 'ひゃ', 'hya', 'combination', 'comb-h', 'Hya Combos', []),
  c('hiragana', 'ひゅ', 'hyu', 'combination', 'comb-h', 'Hya Combos', []),
  c('hiragana', 'ひょ', 'hyo', 'combination', 'comb-h', 'Hya Combos', []),

  c('hiragana', 'みゃ', 'mya', 'combination', 'comb-m', 'Mya Combos', []),
  c('hiragana', 'みゅ', 'myu', 'combination', 'comb-m', 'Mya Combos', []),
  c('hiragana', 'みょ', 'myo', 'combination', 'comb-m', 'Mya Combos', []),

  c('hiragana', 'りゃ', 'rya', 'combination', 'comb-r', 'Rya Combos', []),
  c('hiragana', 'りゅ', 'ryu', 'combination', 'comb-r', 'Rya Combos', []),
  c('hiragana', 'りょ', 'ryo', 'combination', 'comb-r', 'Rya Combos', []),

  c('hiragana', 'ぎゃ', 'gya', 'combination', 'comb-g', 'Gya Combos', []),
  c('hiragana', 'ぎゅ', 'gyu', 'combination', 'comb-g', 'Gya Combos', []),
  c('hiragana', 'ぎょ', 'gyo', 'combination', 'comb-g', 'Gya Combos', []),

  c('hiragana', 'じゃ', 'ja', 'combination', 'comb-j', 'Ja Combos', ['jya', 'zya']),
  c('hiragana', 'じゅ', 'ju', 'combination', 'comb-j', 'Ja Combos', ['jyu', 'zyu']),
  c('hiragana', 'じょ', 'jo', 'combination', 'comb-j', 'Ja Combos', ['jyo', 'zyo']),

  c('hiragana', 'びゃ', 'bya', 'combination', 'comb-b', 'Bya Combos', []),
  c('hiragana', 'びゅ', 'byu', 'combination', 'comb-b', 'Bya Combos', []),
  c('hiragana', 'びょ', 'byo', 'combination', 'comb-b', 'Bya Combos', []),

  c('hiragana', 'ぴゃ', 'pya', 'combination', 'comb-p', 'Pya Combos', []),
  c('hiragana', 'ぴゅ', 'pyu', 'combination', 'comb-p', 'Pya Combos', []),
  c('hiragana', 'ぴょ', 'pyo', 'combination', 'comb-p', 'Pya Combos', []),
];

// KATAKANA
export const KATAKANA_CHARACTERS: KanaCharacter[] = [
  // Basic Gojūon
  c('katakana', 'ア', 'a', 'basic', 'vowel', 'Vowels', [], 'An axe chopping wood'),
  c('katakana', 'イ', 'i', 'basic', 'vowel', 'Vowels', [], 'An easel standing for painting'),
  c('katakana', 'ウ', 'u', 'basic', 'vowel', 'Vowels', [], 'An umbrella catching rain'),
  c('katakana', 'エ', 'e', 'basic', 'vowel', 'Vowels', [], 'An engineer I-beam girder'),
  c('katakana', 'オ', 'o', 'basic', 'vowel', 'Vowels', [], 'An opera singer performing with arm extended'),

  c('katakana', 'カ', 'ka', 'basic', 'k', 'K-row', [], 'Sharp edge of a card or card-cutter'),
  c('katakana', 'キ', 'ki', 'basic', 'k', 'K-row', [], 'Top part of a key'),
  c('katakana', 'ク', 'ku', 'basic', 'k', 'K-row', [], 'A cook hat or chef wedge'),
  c('katakana', 'ケ', 'ke', 'basic', 'k', 'K-row', [], 'A kettle silhouette'),
  c('katakana', 'コ', 'ko', 'basic', 'k', 'K-row', [], 'Corner of a square cardboard box'),

  c('katakana', 'サ', 'sa', 'basic', 's', 'S-row', [], 'Sardines on a platter'),
  c('katakana', 'シ', 'shi', 'basic', 's', 'S-row', ['si'], 'She is looking up with lovely eyelashes'),
  c('katakana', 'ス', 'su', 'basic', 's', 'S-row', [], 'A suit hanger angle'),
  c('katakana', 'セ', 'se', 'basic', 's', 'S-row', [], 'A set of steps'),
  c('katakana', 'ソ', 'so', 'basic', 's', 'S-row', [], 'A needle sewing downwards'),

  c('katakana', 'タ', 'ta', 'basic', 't', 'T-row', [], 'A tall kite in the breeze'),
  c('katakana', 'チ', 'chi', 'basic', 't', 'T-row', ['ti'], 'A cheerleader doing a split'),
  c('katakana', 'ツ', 'tsu', 'basic', 't', 'T-row', ['tu'], 'Two drops of tsunami water falling down'),
  c('katakana', 'テ', 'te', 'basic', 't', 'T-row', [], 'A telephone pole antenna'),
  c('katakana', 'ト', 'to', 'basic', 't', 'T-row', [], 'A totem pole pointing right'),

  c('katakana', 'ナ', 'na', 'basic', 'n', 'N-row', [], 'A cross needle'),
  c('katakana', 'ニ', 'ni', 'basic', 'n', 'N-row', [], 'Two parallel needles (ni = 2)'),
  c('katakana', 'ヌ', 'nu', 'basic', 'n', 'N-row', [], 'Chopsticks grabbing noodles'),
  c('katakana', 'ネ', 'ne', 'basic', 'n', 'N-row', [], 'A neon arrow sign'),
  c('katakana', 'ノ', 'no', 'basic', 'n', 'N-row', [], 'A clean single slash "No!"'),

  c('katakana', 'ハ', 'ha', 'basic', 'h', 'H-row', [], 'A haystack or roof beam'),
  c('katakana', 'ヒ', 'hi', 'basic', 'h', 'H-row', [], 'He is holding his arms high'),
  c('katakana', 'フ', 'fu', 'basic', 'h', 'H-row', ['hu'], 'A sharp owl beak whistling "foo"'),
  c('katakana', 'ヘ', 'he', 'basic', 'h', 'H-row', [], 'A hill peak (identical to hiragana へ)'),
  c('katakana', 'ホ', 'ho', 'basic', 'h', 'H-row', [], 'A holy cross with lights'),

  c('katakana', 'マ', 'ma', 'basic', 'm', 'M-row', [], 'A glass of martini angle'),
  c('katakana', 'ミ', 'mi', 'basic', 'm', 'M-row', [], 'Three missile streaks (mi = 3)'),
  c('katakana', 'ム', 'mu', 'basic', 'm', 'M-row', [], 'A moose snout triangle'),
  c('katakana', 'メ', 'me', 'basic', 'm', 'M-row', [], 'A metal cross mark'),
  c('katakana', 'モ', 'mo', 'basic', 'm', 'M-row', [], 'More monitor screens stacked'),

  c('katakana', 'ヤ', 'ya', 'basic', 'y', 'Y-row', [], 'A sharp yacht sail'),
  c('katakana', 'ユ', 'yu', 'basic', 'y', 'Y-row', [], 'Looks like the number 1 (you are #1)'),
  c('katakana', 'ヨ', 'yo', 'basic', 'y', 'Y-row', [], 'A shelf of yo-yo boxes'),

  c('katakana', 'ラ', 'ra', 'basic', 'r', 'R-row', [], 'A radio antenna'),
  c('katakana', 'リ', 'ri', 'basic', 'r', 'R-row', [], 'Two reeds in a river'),
  c('katakana', 'ル', 'ru', 'basic', 'r', 'R-row', [], 'Two routes diverging'),
  c('katakana', 'レ', 're', 'basic', 'r', 'R-row', [], 'A red checkmark'),
  c('katakana', 'ロ', 'ro', 'basic', 'r', 'R-row', [], 'A square robotic box mouth'),

  c('katakana', 'ワ', 'wa', 'basic', 'w', 'W-row', [], 'A wine glass silhouette'),
  c('katakana', 'ヲ', 'wo', 'basic', 'w', 'W-row', ['o'], 'A warrior raising a sword'),
  c('katakana', 'ン', 'n', 'basic', 'w', 'W-row', ['nn'], 'An eye glancing upwards "n"'),

  // Dakuten (Voiced)
  c('katakana', 'ガ', 'ga', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('katakana', 'ギ', 'gi', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('katakana', 'グ', 'gu', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('katakana', 'ゲ', 'ge', 'dakuten', 'g', 'G-row (Dakuten)', []),
  c('katakana', 'ゴ', 'go', 'dakuten', 'g', 'G-row (Dakuten)', []),

  c('katakana', 'ザ', 'za', 'dakuten', 'z', 'Z-row (Dakuten)', []),
  c('katakana', 'ジ', 'ji', 'dakuten', 'z', 'Z-row (Dakuten)', ['zi']),
  c('katakana', 'ズ', 'zu', 'dakuten', 'z', 'Z-row (Dakuten)', []),
  c('katakana', 'ゼ', 'ze', 'dakuten', 'z', 'Z-row (Dakuten)', []),
  c('katakana', 'ゾ', 'zo', 'dakuten', 'z', 'Z-row (Dakuten)', []),

  c('katakana', 'ダ', 'da', 'dakuten', 'd', 'D-row (Dakuten)', []),
  c('katakana', 'ヂ', 'ji', 'dakuten', 'd', 'D-row (Dakuten)', ['di', 'dji']),
  c('katakana', 'ヅ', 'zu', 'dakuten', 'd', 'D-row (Dakuten)', ['du', 'dzu']),
  c('katakana', 'デ', 'de', 'dakuten', 'd', 'D-row (Dakuten)', []),
  c('katakana', 'ド', 'do', 'dakuten', 'd', 'D-row (Dakuten)', []),

  c('katakana', 'バ', 'ba', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('katakana', 'ビ', 'bi', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('katakana', 'ブ', 'bu', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('katakana', 'ベ', 'be', 'dakuten', 'b', 'B-row (Dakuten)', []),
  c('katakana', 'ボ', 'bo', 'dakuten', 'b', 'B-row (Dakuten)', []),

  // Handakuten (Semi-voiced)
  c('katakana', 'パ', 'pa', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('katakana', 'ピ', 'pi', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('katakana', 'プ', 'pu', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('katakana', 'ペ', 'pe', 'handakuten', 'p', 'P-row (Handakuten)', []),
  c('katakana', 'ポ', 'po', 'handakuten', 'p', 'P-row (Handakuten)', []),

  // Combinations (Yōon)
  c('katakana', 'キャ', 'kya', 'combination', 'comb-k', 'Kya Combos', []),
  c('katakana', 'キュ', 'kyu', 'combination', 'comb-k', 'Kya Combos', []),
  c('katakana', 'キョ', 'kyo', 'combination', 'comb-k', 'Kya Combos', []),

  c('katakana', 'シャ', 'sha', 'combination', 'comb-s', 'Sha Combos', ['sya']),
  c('katakana', 'シュ', 'shu', 'combination', 'comb-s', 'Sha Combos', ['syu']),
  c('katakana', 'ショ', 'sho', 'combination', 'comb-s', 'Sha Combos', ['syo']),

  c('katakana', 'チャ', 'cha', 'combination', 'comb-t', 'Cha Combos', ['tya', 'cya']),
  c('katakana', 'チュ', 'chu', 'combination', 'comb-t', 'Cha Combos', ['tyu', 'cyu']),
  c('katakana', 'チョ', 'cho', 'combination', 'comb-t', 'Cha Combos', ['tyo', 'cyo']),

  c('katakana', 'ニャ', 'nya', 'combination', 'comb-n', 'Nya Combos', []),
  c('katakana', 'ニュ', 'nyu', 'combination', 'comb-n', 'Nya Combos', []),
  c('katakana', 'ニョ', 'nyo', 'combination', 'comb-n', 'Nya Combos', []),

  c('katakana', 'ヒャ', 'hya', 'combination', 'comb-h', 'Hya Combos', []),
  c('katakana', 'ヒュ', 'hyu', 'combination', 'comb-h', 'Hya Combos', []),
  c('katakana', 'ヒョ', 'hyo', 'combination', 'comb-h', 'Hya Combos', []),

  c('katakana', 'ミャ', 'mya', 'combination', 'comb-m', 'Mya Combos', []),
  c('katakana', 'ミュ', 'myu', 'combination', 'comb-m', 'Mya Combos', []),
  c('katakana', 'ミョ', 'myo', 'combination', 'comb-m', 'Mya Combos', []),

  c('katakana', 'リャ', 'rya', 'combination', 'comb-r', 'Rya Combos', []),
  c('katakana', 'リュ', 'ryu', 'combination', 'comb-r', 'Rya Combos', []),
  c('katakana', 'リョ', 'ryo', 'combination', 'comb-r', 'Rya Combos', []),

  c('katakana', 'ギャ', 'gya', 'combination', 'comb-g', 'Gya Combos', []),
  c('katakana', 'ギュ', 'gyu', 'combination', 'comb-g', 'Gya Combos', []),
  c('katakana', 'ギョ', 'gyo', 'combination', 'comb-g', 'Gya Combos', []),

  c('katakana', 'ジャ', 'ja', 'combination', 'comb-j', 'Ja Combos', ['jya', 'zya']),
  c('katakana', 'ジュ', 'ju', 'combination', 'comb-j', 'Ja Combos', ['jyu', 'zyu']),
  c('katakana', 'ジョ', 'jo', 'combination', 'comb-j', 'Ja Combos', ['jyo', 'zyo']),

  c('katakana', 'ビャ', 'bya', 'combination', 'comb-b', 'Bya Combos', []),
  c('katakana', 'ビュ', 'byu', 'combination', 'comb-b', 'Bya Combos', []),
  c('katakana', 'ビョ', 'byo', 'combination', 'comb-b', 'Bya Combos', []),

  c('katakana', 'ピャ', 'pya', 'combination', 'comb-p', 'Pya Combos', []),
  c('katakana', 'ピュ', 'pyu', 'combination', 'comb-p', 'Pya Combos', []),
  c('katakana', 'ピョ', 'pyo', 'combination', 'comb-p', 'Pya Combos', []),
];

export const ALL_CHARACTERS: KanaCharacter[] = [
  ...HIRAGANA_CHARACTERS,
  ...KATAKANA_CHARACTERS,
];

export const CHARACTER_MAP = new Map<string, KanaCharacter>(
  ALL_CHARACTERS.map(c => [c.id, c])
);

// Standard 5-column grid builders for Hiragana & Katakana
export function getGridRows(script: ScriptType, category: 'basic' | 'dakuten' | 'handakuten'): KanaRow[] {
  const chars = script === 'hiragana' ? HIRAGANA_CHARACTERS : KATAKANA_CHARACTERS;
  const filtered = chars.filter(c => c.category === category);

  if (category === 'basic') {
    return [
      {
        groupId: `${script}-vowel`,
        label: 'Vowels',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'a') || null,
          filtered.find(c => c.romaji === 'i') || null,
          filtered.find(c => c.romaji === 'u') || null,
          filtered.find(c => c.romaji === 'e') || null,
          filtered.find(c => c.romaji === 'o') || null,
        ],
      },
      {
        groupId: `${script}-k`,
        label: 'K-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'ka') || null,
          filtered.find(c => c.romaji === 'ki') || null,
          filtered.find(c => c.romaji === 'ku') || null,
          filtered.find(c => c.romaji === 'ke') || null,
          filtered.find(c => c.romaji === 'ko') || null,
        ],
      },
      {
        groupId: `${script}-s`,
        label: 'S-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'sa') || null,
          filtered.find(c => c.romaji === 'shi') || null,
          filtered.find(c => c.romaji === 'su') || null,
          filtered.find(c => c.romaji === 'se') || null,
          filtered.find(c => c.romaji === 'so') || null,
        ],
      },
      {
        groupId: `${script}-t`,
        label: 'T-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'ta') || null,
          filtered.find(c => c.romaji === 'chi') || null,
          filtered.find(c => c.romaji === 'tsu') || null,
          filtered.find(c => c.romaji === 'te') || null,
          filtered.find(c => c.romaji === 'to') || null,
        ],
      },
      {
        groupId: `${script}-n`,
        label: 'N-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'na') || null,
          filtered.find(c => c.romaji === 'ni') || null,
          filtered.find(c => c.romaji === 'nu') || null,
          filtered.find(c => c.romaji === 'ne') || null,
          filtered.find(c => c.romaji === 'no') || null,
        ],
      },
      {
        groupId: `${script}-h`,
        label: 'H-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'ha') || null,
          filtered.find(c => c.romaji === 'hi') || null,
          filtered.find(c => c.romaji === 'fu') || null,
          filtered.find(c => c.romaji === 'he') || null,
          filtered.find(c => c.romaji === 'ho') || null,
        ],
      },
      {
        groupId: `${script}-m`,
        label: 'M-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'ma') || null,
          filtered.find(c => c.romaji === 'mi') || null,
          filtered.find(c => c.romaji === 'mu') || null,
          filtered.find(c => c.romaji === 'me') || null,
          filtered.find(c => c.romaji === 'mo') || null,
        ],
      },
      {
        groupId: `${script}-y`,
        label: 'Y-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'ya') || null,
          null,
          filtered.find(c => c.romaji === 'yu') || null,
          null,
          filtered.find(c => c.romaji === 'yo') || null,
        ],
      },
      {
        groupId: `${script}-r`,
        label: 'R-row',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'ra') || null,
          filtered.find(c => c.romaji === 'ri') || null,
          filtered.find(c => c.romaji === 'ru') || null,
          filtered.find(c => c.romaji === 're') || null,
          filtered.find(c => c.romaji === 'ro') || null,
        ],
      },
      {
        groupId: `${script}-w`,
        label: 'W & N',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'wa') || null,
          null,
          null,
          null,
          filtered.find(c => c.romaji === 'wo') || null,
        ],
      },
      {
        groupId: `${script}-singlen`,
        label: 'N (ん/ン)',
        category: 'basic',
        characters: [
          filtered.find(c => c.romaji === 'n') || null,
          null,
          null,
          null,
          null,
        ],
      },
    ];
  }

  if (category === 'dakuten') {
    return [
      {
        groupId: `${script}-g`,
        label: 'G-row',
        category: 'dakuten',
        characters: [
          filtered.find(c => c.romaji === 'ga') || null,
          filtered.find(c => c.romaji === 'gi') || null,
          filtered.find(c => c.romaji === 'gu') || null,
          filtered.find(c => c.romaji === 'ge') || null,
          filtered.find(c => c.romaji === 'go') || null,
        ],
      },
      {
        groupId: `${script}-z`,
        label: 'Z-row',
        category: 'dakuten',
        characters: [
          filtered.find(c => c.romaji === 'za') || null,
          filtered.find(c => c.romaji === 'ji' && c.rowGroup === 'z') || null,
          filtered.find(c => c.romaji === 'zu' && c.rowGroup === 'z') || null,
          filtered.find(c => c.romaji === 'ze') || null,
          filtered.find(c => c.romaji === 'zo') || null,
        ],
      },
      {
        groupId: `${script}-d`,
        label: 'D-row',
        category: 'dakuten',
        characters: [
          filtered.find(c => c.romaji === 'da') || null,
          filtered.find(c => c.romaji === 'ji' && c.rowGroup === 'd') || null,
          filtered.find(c => c.romaji === 'zu' && c.rowGroup === 'd') || null,
          filtered.find(c => c.romaji === 'de') || null,
          filtered.find(c => c.romaji === 'do') || null,
        ],
      },
      {
        groupId: `${script}-b`,
        label: 'B-row',
        category: 'dakuten',
        characters: [
          filtered.find(c => c.romaji === 'ba') || null,
          filtered.find(c => c.romaji === 'bi') || null,
          filtered.find(c => c.romaji === 'bu') || null,
          filtered.find(c => c.romaji === 'be') || null,
          filtered.find(c => c.romaji === 'bo') || null,
        ],
      },
    ];
  }

  // handakuten
  return [
    {
      groupId: `${script}-p`,
      label: 'P-row',
      category: 'handakuten',
      characters: [
        filtered.find(c => c.romaji === 'pa') || null,
        filtered.find(c => c.romaji === 'pi') || null,
        filtered.find(c => c.romaji === 'pu') || null,
        filtered.find(c => c.romaji === 'pe') || null,
        filtered.find(c => c.romaji === 'po') || null,
      ],
    },
  ];
}

// 3-column rows for combinations (Yōon: -ya, -yu, -yo)
export function getCombinationRows(script: ScriptType): KanaRow[] {
  const chars = script === 'hiragana' ? HIRAGANA_CHARACTERS : KATAKANA_CHARACTERS;
  const filtered = chars.filter(c => c.category === 'combination');

  const groups = [
    { key: 'comb-k', label: 'Ky-' },
    { key: 'comb-s', label: 'Sh-' },
    { key: 'comb-t', label: 'Ch-' },
    { key: 'comb-n', label: 'Ny-' },
    { key: 'comb-h', label: 'Hy-' },
    { key: 'comb-m', label: 'My-' },
    { key: 'comb-r', label: 'Ry-' },
    { key: 'comb-g', label: 'Gy-' },
    { key: 'comb-j', label: 'J-' },
    { key: 'comb-b', label: 'By-' },
    { key: 'comb-p', label: 'Py-' },
  ];

  return groups.map(g => {
    const rowChars = filtered.filter(c => c.rowGroup === g.key);
    return {
      groupId: `${script}-${g.key}`,
      label: g.label,
      category: 'combination',
      characters: rowChars,
    };
  });
}
