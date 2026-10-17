import type { VocabCategory, VocabWord } from '../types/vocab';

export const VOCAB_CATEGORY_LABELS: Record<VocabCategory, string> = {
  greetings: 'Greetings',
  food: 'Food & Drink',
  animals: 'Animals',
  people: 'People & Family',
  body: 'Body',
  nature: 'Nature',
  describing: 'Colors & Adjectives',
  numbers: 'Numbers',
  daily: 'Time & Places',
  verbs: 'Verbs',
  loanwords: 'Loanwords',
};

export const VOCAB_CATEGORIES = Object.keys(VOCAB_CATEGORY_LABELS) as VocabCategory[];

// Helper to build a word entry
const w = (
  category: VocabCategory,
  kana: string,
  meaning: string,
  extra: Partial<Pick<VocabWord, 'kanji' | 'readings' | 'note'>> = {}
): VocabWord => ({
  id: `${category}-${kana}`,
  kana,
  meaning,
  category,
  ...extra,
});

const PARTICLE_WA_NOTE = 'The final は is read "wa" here because it was originally the topic particle.';

export const VOCABULARY: VocabWord[] = [
  // Greetings & set phrases
  w('greetings', 'こんにちは', 'Hello / Good afternoon', { readings: ['konnichiwa'], note: PARTICLE_WA_NOTE }),
  w('greetings', 'こんばんは', 'Good evening', { readings: ['konbanwa', 'kombanwa'], note: PARTICLE_WA_NOTE }),
  w('greetings', 'おはよう', 'Good morning (casual)', { note: 'Add ございます (gozaimasu) to make it polite.' }),
  w('greetings', 'ありがとう', 'Thank you'),
  w('greetings', 'すみません', 'Excuse me / I\'m sorry'),
  w('greetings', 'さようなら', 'Goodbye', { readings: ['sayounara', 'sayonara'] }),
  w('greetings', 'おやすみ', 'Good night'),
  w('greetings', 'いただきます', 'Said before eating ("I humbly receive")'),
  w('greetings', 'はい', 'Yes'),
  w('greetings', 'いいえ', 'No'),

  // Food & drink
  w('food', 'みず', 'Water', { kanji: '水' }),
  w('food', 'おちゃ', 'Green tea', { kanji: 'お茶' }),
  w('food', 'ごはん', 'Cooked rice / meal', { kanji: 'ご飯' }),
  w('food', 'すし', 'Sushi', { kanji: '寿司' }),
  w('food', 'さかな', 'Fish', { kanji: '魚' }),
  w('food', 'にく', 'Meat', { kanji: '肉' }),
  w('food', 'たまご', 'Egg', { kanji: '卵' }),
  w('food', 'やさい', 'Vegetables', { kanji: '野菜' }),
  w('food', 'りんご', 'Apple'),
  w('food', 'パン', 'Bread', { note: 'From Portuguese "pão".' }),
  w('food', 'ラーメン', 'Ramen noodles'),
  w('food', 'コーヒー', 'Coffee'),
  w('food', 'ジュース', 'Juice'),
  w('food', 'ケーキ', 'Cake'),

  // Animals
  w('animals', 'いぬ', 'Dog', { kanji: '犬' }),
  w('animals', 'ねこ', 'Cat', { kanji: '猫' }),
  w('animals', 'とり', 'Bird', { kanji: '鳥' }),
  w('animals', 'うま', 'Horse', { kanji: '馬' }),
  w('animals', 'さる', 'Monkey', { kanji: '猿' }),
  w('animals', 'うさぎ', 'Rabbit'),
  w('animals', 'くま', 'Bear', { kanji: '熊' }),
  w('animals', 'かめ', 'Turtle', { kanji: '亀' }),
  w('animals', 'きつね', 'Fox', { kanji: '狐' }),
  w('animals', 'ライオン', 'Lion'),

  // People & family
  w('people', 'ひと', 'Person', { kanji: '人' }),
  w('people', 'ともだち', 'Friend', { kanji: '友達' }),
  w('people', 'こども', 'Child', { kanji: '子供' }),
  w('people', 'せんせい', 'Teacher', { kanji: '先生', note: 'Usually pronounced "sensee": えい sounds like a long e.' }),
  w('people', 'がくせい', 'Student', { kanji: '学生' }),
  w('people', 'はは', '(My) mother', { kanji: '母', note: 'Used for your own mother. Use おかあさん for someone else\'s.' }),
  w('people', 'ちち', '(My) father', { kanji: '父', note: 'Used for your own father. Use おとうさん for someone else\'s.' }),
  w('people', 'おかあさん', 'Mother (polite)', { kanji: 'お母さん' }),
  w('people', 'おとうさん', 'Father (polite)', { kanji: 'お父さん' }),
  w('people', 'おばあさん', 'Grandmother', { kanji: 'お祖母さん', note: 'The long "aa" matters: おばさん (obasan) means aunt.' }),
  w('people', 'おばさん', 'Aunt / middle-aged woman', { kanji: '叔母さん' }),

  // Body
  w('body', 'め', 'Eye', { kanji: '目' }),
  w('body', 'みみ', 'Ear', { kanji: '耳' }),
  w('body', 'くち', 'Mouth', { kanji: '口' }),
  w('body', 'はな', 'Nose', { kanji: '鼻', note: 'Same kana as はな (flower, 花) — kanji tell them apart in writing.' }),
  w('body', 'て', 'Hand', { kanji: '手' }),
  w('body', 'あし', 'Foot / leg', { kanji: '足' }),
  w('body', 'あたま', 'Head', { kanji: '頭' }),
  w('body', 'かお', 'Face', { kanji: '顔' }),

  // Nature
  w('nature', 'やま', 'Mountain', { kanji: '山' }),
  w('nature', 'かわ', 'River', { kanji: '川' }),
  w('nature', 'うみ', 'Sea', { kanji: '海' }),
  w('nature', 'そら', 'Sky', { kanji: '空' }),
  w('nature', 'あめ', 'Rain', { kanji: '雨', note: 'Same kana as あめ (candy, 飴).' }),
  w('nature', 'ゆき', 'Snow', { kanji: '雪' }),
  w('nature', 'かぜ', 'Wind', { kanji: '風' }),
  w('nature', 'き', 'Tree', { kanji: '木' }),
  w('nature', 'はな', 'Flower', { kanji: '花', note: 'Same kana as はな (nose, 鼻) — kanji tell them apart in writing.' }),
  w('nature', 'つき', 'Moon', { kanji: '月' }),
  w('nature', 'ほし', 'Star', { kanji: '星' }),

  // Colors & adjectives
  w('describing', 'あか', 'Red', { kanji: '赤' }),
  w('describing', 'あお', 'Blue', { kanji: '青' }),
  w('describing', 'しろ', 'White', { kanji: '白' }),
  w('describing', 'くろ', 'Black', { kanji: '黒' }),
  w('describing', 'おおきい', 'Big', { kanji: '大きい' }),
  w('describing', 'ちいさい', 'Small', { kanji: '小さい' }),
  w('describing', 'あつい', 'Hot (weather)', { kanji: '暑い' }),
  w('describing', 'さむい', 'Cold (weather)', { kanji: '寒い' }),
  w('describing', 'おいしい', 'Delicious', { kanji: '美味しい' }),
  w('describing', 'かわいい', 'Cute', { kanji: '可愛い' }),

  // Numbers
  w('numbers', 'いち', 'One', { kanji: '一' }),
  w('numbers', 'に', 'Two', { kanji: '二' }),
  w('numbers', 'さん', 'Three', { kanji: '三' }),
  w('numbers', 'よん', 'Four', { kanji: '四', note: 'Also read し (shi), often avoided because it sounds like "death".' }),
  w('numbers', 'ご', 'Five', { kanji: '五' }),
  w('numbers', 'ろく', 'Six', { kanji: '六' }),
  w('numbers', 'なな', 'Seven', { kanji: '七', note: 'Also read しち (shichi).' }),
  w('numbers', 'はち', 'Eight', { kanji: '八' }),
  w('numbers', 'きゅう', 'Nine', { kanji: '九', note: 'Also read く (ku).' }),
  w('numbers', 'じゅう', 'Ten', { kanji: '十' }),

  // Time & places
  w('daily', 'きょう', 'Today', { kanji: '今日' }),
  w('daily', 'あした', 'Tomorrow', { kanji: '明日' }),
  w('daily', 'きのう', 'Yesterday', { kanji: '昨日' }),
  w('daily', 'いま', 'Now', { kanji: '今' }),
  w('daily', 'あさ', 'Morning', { kanji: '朝' }),
  w('daily', 'よる', 'Night', { kanji: '夜' }),
  w('daily', 'いえ', 'House / home', { kanji: '家' }),
  w('daily', 'みせ', 'Shop', { kanji: '店' }),
  w('daily', 'えき', 'Train station', { kanji: '駅' }),
  w('daily', 'がっこう', 'School', { kanji: '学校' }),
  w('daily', 'でんしゃ', 'Train', { kanji: '電車' }),
  w('daily', 'くるま', 'Car', { kanji: '車' }),
  w('daily', 'ほん', 'Book', { kanji: '本' }),

  // Verbs (dictionary form)
  w('verbs', 'たべる', 'To eat', { kanji: '食べる' }),
  w('verbs', 'のむ', 'To drink', { kanji: '飲む' }),
  w('verbs', 'みる', 'To see / watch', { kanji: '見る' }),
  w('verbs', 'いく', 'To go', { kanji: '行く' }),
  w('verbs', 'くる', 'To come', { kanji: '来る' }),
  w('verbs', 'する', 'To do'),
  w('verbs', 'ねる', 'To sleep', { kanji: '寝る' }),
  w('verbs', 'かく', 'To write', { kanji: '書く' }),
  w('verbs', 'よむ', 'To read', { kanji: '読む' }),
  w('verbs', 'はなす', 'To speak', { kanji: '話す' }),

  // Katakana loanwords
  w('loanwords', 'テレビ', 'Television'),
  w('loanwords', 'カメラ', 'Camera'),
  w('loanwords', 'ホテル', 'Hotel'),
  w('loanwords', 'タクシー', 'Taxi'),
  w('loanwords', 'バス', 'Bus'),
  w('loanwords', 'トイレ', 'Toilet / restroom'),
  w('loanwords', 'ノート', 'Notebook'),
  w('loanwords', 'ペン', 'Pen'),
  w('loanwords', 'ゲーム', 'Game'),
  w('loanwords', 'アニメ', 'Anime'),
  w('loanwords', 'メール', 'Email'),
  w('loanwords', 'テスト', 'Test / exam'),
  w('loanwords', 'ピアノ', 'Piano'),
];
