// Domain types & factories for table and word exercises
import DiffMatchPatch from 'diff-match-patch';

// --- Vocabulary ---

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface VocabularyWord {
  id: string;
  nativeWord: string;
  studiedWord: string;
  topic: string;
  difficulty: Difficulty;
  correctCount: number;
  incorrectCount: number;
}

export interface VocabularyTopic {
  id: string;
  name: string;
  description: string;
  words: VocabularyWord[];
}

export type TranslationDirection = 'native-to-studied' | 'studied-to-native';

export interface MultipleChoiceQuestion {
  id: string;
  wordId: string;
  question: string;
  correctAnswer: string;
  choices: string[];
  isCorrect: boolean | null;
}

export interface MultipleChoiceExercise {
  questions: MultipleChoiceQuestion[];
  currentQuestionIndex: number;
  direction: TranslationDirection;
  score: number;
  total: number;
  isCompleted: boolean;
}

export interface TypingQuestion {
  id: string;
  wordId: string;
  question: string;
  correctAnswer: string;
  userInput: string;
  isCorrect: boolean | null;
  maxLength: number;
}

export interface TypingExercise {
  questions: TypingQuestion[];
  currentQuestionIndex: number;
  direction: TranslationDirection;
  score: number;
  total: number;
  isCompleted: boolean;
}

export interface MatchingWord {
  id: string;
  text: string;
  wordIndex: number;
  correctMatch: string;
}

export interface MatchingColumnsExercise {
  leftWords: MatchingWord[];
  rightWords: MatchingWord[];
  matches: [string, string][];
  currentMatches: [string, string][];
  direction: TranslationDirection;
  score: number;
  total: number;
  isCompleted: boolean;
}

// --- Table data ---

export interface CellData {
  row: number;
  col: number;
  correctValue: string;
  currentValue: string | null;
  isFilled: boolean;
  isCorrect: boolean;
}

export interface TableData {
  id: string;
  name: string;
  rows: string[];
  columns: string[];
  cells: CellData[][];
  tags: string[];
}

export interface FillCellsExercise {
  table: TableData;
  variants: string[];
  selectedVariant: string | null;
  isCompleted: boolean;
  showHints: boolean;
  showAnswers: boolean;
}

// --- Word transformations ---

export const OPERATION_TYPES = {
  INSERT: 'insert',
  DELETE: 'delete',
} as const;

export type OperationType = (typeof OPERATION_TYPES)[keyof typeof OPERATION_TYPES];

export interface DeleteOperation {
  type: typeof OPERATION_TYPES.DELETE;
  index: number;
  length: number;
  text: string;
}

export interface InsertOperation {
  type: typeof OPERATION_TYPES.INSERT;
  index: number;
  text: string;
  variants?: string[];
}

export type Operation = DeleteOperation | InsertOperation;

export interface WordOperationSequence {
  rowIndex: number;
  colIndex: number;
  baseWord: string;
  targetWord: string;
  operations: Operation[];
  currentOperation: number;
  currentWord: string;
  isCompleted?: boolean;
  sentenceIndex?: number;
}

export interface WordTransformationExercise {
  table: TableData;
  sequences: WordOperationSequence[];
  currentSequenceIndex: number;
  isCompleted: boolean;
  showAnswers: boolean;
}

export interface SentenceFittingExercise {
  table: TableData;
  sequences: WordOperationSequence[];
  currentSequenceIndex: number;
  isCompleted: boolean;
}

export type DiffOp =
  | { type: 'delete'; index: number; length: number; text: string }
  | { type: 'insert'; index: number; text: string };

// --- Factories ---

export const createVocabularyWord = (
  id: string,
  nativeWord: string,
  studiedWord: string,
  topic: string,
  difficulty: Difficulty = 'beginner'
): VocabularyWord => ({
  id,
  nativeWord,
  studiedWord,
  topic,
  difficulty,
  correctCount: 0,
  incorrectCount: 0,
});

export const createVocabularyTopic = (
  id: string,
  name: string,
  description: string,
  words: VocabularyWord[]
): VocabularyTopic => ({
  id,
  name,
  description,
  words,
});

export const sampleVocabularyTopics: VocabularyTopic[] = [
  createVocabularyTopic(
    'greetings',
    'Greetings & Introductions',
    'Common phrases for meeting people',
    [
      createVocabularyWord('g1', 'Hello', 'Hola', 'greetings'),
      createVocabularyWord('g2', 'Good morning', 'Buenos días', 'greetings'),
      createVocabularyWord('g3', 'Good afternoon', 'Buenas tardes', 'greetings'),
      createVocabularyWord('g4', 'Good evening', 'Buenas noches', 'greetings'),
      createVocabularyWord('g5', 'Goodbye', 'Adiós', 'greetings'),
      createVocabularyWord('g6', 'Good night', 'Buenas noches', 'greetings'),
      createVocabularyWord('g7', 'See you later', 'Hasta luego', 'greetings'),
      createVocabularyWord('g8', 'See you tomorrow', 'Hasta mañana', 'greetings'),
      createVocabularyWord('g9', 'What is your name?', '¿Cómo te llamas?', 'greetings'),
      createVocabularyWord('g10', 'My name is...', 'Me llamo...', 'greetings'),
    ]
  ),
  createVocabularyTopic(
    'food_drink',
    'Food & Drink',
    'Vocabulary for restaurants and cooking',
    [
      createVocabularyWord('f1', 'Water', 'Agua', 'food_drink'),
      createVocabularyWord('f2', 'Bread', 'Pan', 'food_drink'),
      createVocabularyWord('f3', 'Cheese', 'Queso', 'food_drink'),
      createVocabularyWord('f4', 'Meat', 'Carne', 'food_drink'),
      createVocabularyWord('f5', 'Fish', 'Pescado', 'food_drink'),
      createVocabularyWord('f6', 'Vegetables', 'Verduras', 'food_drink'),
      createVocabularyWord('f7', 'Fruit', 'Fruta', 'food_drink'),
      createVocabularyWord('f8', 'Coffee', 'Café', 'food_drink'),
      createVocabularyWord('f9', 'Tea', 'Té', 'food_drink'),
      createVocabularyWord('f10', 'Wine', 'Vino', 'food_drink'),
      createVocabularyWord('f11', 'Beer', 'Cerveza', 'food_drink'),
      createVocabularyWord('f12', 'Milk', 'Leche', 'food_drink'),
      createVocabularyWord('f13', 'Eggs', 'Huevos', 'food_drink'),
      createVocabularyWord('f14', 'Rice', 'Arroz', 'food_drink'),
      createVocabularyWord('f15', 'Pasta', 'Pasta', 'food_drink'),
    ]
  ),
  createVocabularyTopic(
    'family',
    'Family Members',
    'Words for describing family relationships',
    [
      createVocabularyWord('fm1', 'Family', 'Familia', 'family'),
      createVocabularyWord('fm2', 'Father', 'Padre', 'family'),
      createVocabularyWord('fm3', 'Mother', 'Madre', 'family'),
      createVocabularyWord('fm4', 'Son', 'Hijo', 'family'),
      createVocabularyWord('fm5', 'Daughter', 'Hija', 'family'),
      createVocabularyWord('fm6', 'Brother', 'Hermano', 'family'),
      createVocabularyWord('fm7', 'Sister', 'Hermana', 'family'),
      createVocabularyWord('fm8', 'Grandfather', 'Abuelo', 'family'),
      createVocabularyWord('fm9', 'Grandmother', 'Abuela', 'family'),
      createVocabularyWord('fm10', 'Uncle', 'Tío', 'family'),
      createVocabularyWord('fm11', 'Aunt', 'Tía', 'family'),
      createVocabularyWord('fm12', 'Cousin (male)', 'Primo', 'family'),
      createVocabularyWord('fm13', 'Cousin (female)', 'Prima', 'family'),
    ]
  ),
];

export const getWordsForTopics = (topicIds: string[]): VocabularyWord[] => {
  return sampleVocabularyTopics
    .filter((topic) => topicIds.includes(topic.id))
    .flatMap((topic) => topic.words);
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createMultipleChoiceExercise = (
  words: VocabularyWord[],
  direction: TranslationDirection = 'native-to-studied'
): MultipleChoiceExercise => {
  const shuffledWords = shuffleArray([...words]);

  const questions: MultipleChoiceQuestion[] = shuffledWords.map((word, index) => {
    const questionWord =
      direction === 'native-to-studied' ? word.nativeWord : word.studiedWord;
    const correctAnswer =
      direction === 'native-to-studied' ? word.studiedWord : word.nativeWord;

    const sameTopicWords = words.filter(
      (w) => w.topic === word.topic && w.id !== word.id
    );
    const wrongAnswers = shuffleArray(sameTopicWords)
      .slice(0, 3)
      .map((w) =>
        direction === 'native-to-studied' ? w.studiedWord : w.nativeWord
      );

    const allChoices = shuffleArray([correctAnswer, ...wrongAnswers]);

    return {
      id: `q${index}`,
      wordId: word.id,
      question: questionWord,
      correctAnswer,
      choices: allChoices,
      isCorrect: null,
    };
  });

  return {
    questions,
    currentQuestionIndex: 0,
    direction,
    score: 0,
    total: questions.length,
    isCompleted: false,
  };
};

export const createTypingExercise = (
  words: VocabularyWord[],
  direction: TranslationDirection = 'native-to-studied'
): TypingExercise => {
  const shuffledWords = shuffleArray([...words]);

  const questions: TypingQuestion[] = shuffledWords.map((word, index) => {
    const questionWord =
      direction === 'native-to-studied' ? word.nativeWord : word.studiedWord;
    const correctAnswer =
      direction === 'native-to-studied' ? word.studiedWord : word.nativeWord;
    const maxLength = correctAnswer.length * 2;

    return {
      id: `q${index}`,
      wordId: word.id,
      question: questionWord,
      correctAnswer,
      userInput: '',
      isCorrect: null,
      maxLength,
    };
  });

  return {
    questions,
    currentQuestionIndex: 0,
    direction,
    score: 0,
    total: questions.length,
    isCompleted: false,
  };
};

export const createMatchingColumnsExercise = (
  words: VocabularyWord[],
  direction: TranslationDirection = 'native-to-studied'
): MatchingColumnsExercise => {
  const leftIsNative = direction === 'native-to-studied';

  const wordPairs = words.map((word, index) => {
    const leftText = leftIsNative ? word.nativeWord : word.studiedWord;
    const rightText = leftIsNative ? word.studiedWord : word.nativeWord;

    return {
      index,
      leftText,
      rightText,
      leftId: `left-${index}`,
      rightId: `right-${index}`,
      wordId: word.id,
      topic: word.topic,
    };
  });

  const leftWords: MatchingWord[] = shuffleArray(
    wordPairs.map((pair) => ({
      id: pair.leftId,
      text: pair.leftText,
      wordIndex: pair.index,
      correctMatch: pair.rightId,
    }))
  );

  const rightWords: MatchingWord[] = shuffleArray(
    wordPairs.map((pair) => ({
      id: pair.rightId,
      text: pair.rightText,
      wordIndex: pair.index,
      correctMatch: pair.leftId,
    }))
  );

  const matches: [string, string][] = wordPairs.map((pair) => [
    pair.leftId,
    pair.rightId,
  ]);

  return {
    leftWords,
    rightWords,
    matches,
    currentMatches: [],
    direction,
    score: 0,
    total: wordPairs.length,
    isCompleted: false,
  };
};

export const createCellData = (
  row: number,
  col: number,
  correctValue: string
): CellData => ({
  row,
  col,
  correctValue,
  currentValue: null,
  isFilled: false,
  isCorrect: false,
});

export const createTableData = (
  id: string,
  name: string,
  rows: string[],
  columns: string[],
  cellValues: string[][]
): TableData => {
  const cells = cellValues.map((rowValues, rowIndex) =>
    rowValues.map((correctValue, colIndex) =>
      createCellData(rowIndex, colIndex, correctValue)
    )
  );

  return {
    id,
    name,
    rows,
    columns,
    cells,
    tags: [],
  };
};

export const sampleSpanishTable = createTableData(
  'spanish-present-hablar',
  'Spanish Present Tense - hablar',
  ['Yo', 'Tú', 'Él/Ella', 'Nosotros', 'Vosotros', 'Ellos/Ellas'],
  ['hablаr', 'comеr', 'vivіr', 'cantаr', 'bailаr', 'corrеr', 'saltаr'],
  [
    ['hablo', 'como', 'vivo', 'canto', 'bailo', 'corro', 'salto'],
    ['hablas', 'comes', 'vives', 'cantas', 'bailas', 'corres', 'saltas'],
    ['habla', 'come', 'vive', 'canta', 'baila', 'corre', 'salta'],
    ['hablamos', 'comemos', 'vivimos', 'cantamos', 'bailamos', 'corremos', 'saltamos'],
    ['habláis', 'coméis', 'vivís', 'cantáis', 'bailáis', 'corréis', 'saltáis'],
    ['hablan', 'comen', 'viven', 'cantan', 'bailan', 'corren', 'saltan'],
  ]
);

export const createFillCellsExercise = (table: TableData): FillCellsExercise => {
  const allValues = table.cells.flat().map((cell) => cell.correctValue);
  const variants = shuffleArray(allValues);

  return {
    table,
    variants,
    selectedVariant: null,
    isCompleted: false,
    showHints: false,
    showAnswers: false,
  };
};

export const allGrammarRulesExplanations: Record<string, string[]> = {
  'spanish-present': [
    "For -ar verbs like 'hablar': Remove -ar ending to get stem, then add: Yo(-o), Tú(-as), Él(-a), Nosotros(-amos), Vosotros(-áis), Ellos(-an)",
    "For -er verbs like 'comer': Remove -er ending to get stem, then add: Yo(-o), Tú(-es), Él(-e), Nosotros(-emos), Vosotros(-éis), Ellos(-en)",
    "For -ir verbs like 'vivir': Remove -ir ending to get stem, then add: Yo(-o), Tú(-es), Él(-e), Nosotros(-imos), Vosotros(-ís), Ellos(-en)",
  ],
};

export const tableGrammarRuleMapping: Record<string, number[]> = {
  'spanish-present-hablar': [0, 1, 2, 0, 0, 0, 0],
};

export const generateWrongVariants = (
  correctText: string,
  allTableOperations: Operation[],
  operationType: OperationType,
  maxVariants = 4
): string[] => {
  const wrongVariants = new Set<string>();

  allTableOperations.forEach((op) => {
    if (
      op.type === operationType &&
      op.text !== correctText &&
      op.text.length === correctText.length
    ) {
      wrongVariants.add(op.text);
    }
  });

  while (wrongVariants.size < maxVariants - 1) {
    const randomText = generateRandomString(correctText.length);
    if (randomText !== correctText) {
      wrongVariants.add(randomText);
    }
  }

  return shuffleArray([correctText, ...Array.from(wrongVariants)]).slice(
    0,
    maxVariants
  );
};

const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const diffToOps = (from: string, diffs: [number, string][]): DiffOp[] => {
  let index = 0;
  const ops: DiffOp[] = [];

  for (const [op, text] of diffs) {
    if (op === 0) {
      index += text.length;
    }

    if (op === -1) {
      ops.push({
        type: 'delete',
        index,
        length: text.length,
        text,
      });
    }

    if (op === 1) {
      ops.push({
        type: 'insert',
        index,
        text,
      });
      index += text.length;
    }
  }

  return ops;
};

export const generateWordOperations = (
  baseWord: string,
  targetWord: string,
  allTableOperations: Operation[] = []
): Operation[] => {
  const dmp = new DiffMatchPatch();
  const diff = dmp.diff_main(baseWord, targetWord);
  dmp.diff_cleanupSemantic(diff);

  const rawOps = diffToOps(baseWord, diff);
  const operations: Operation[] = rawOps.map((op) => {
    if (op.type === 'delete') {
      return {
        type: OPERATION_TYPES.DELETE,
        index: op.index,
        length: op.length,
        text: op.text,
      };
    }
    return {
      type: OPERATION_TYPES.INSERT,
      index: op.index,
      text: op.text,
    };
  });

  operations.forEach((op) => {
    if (op.type === OPERATION_TYPES.INSERT) {
      op.variants = generateWrongVariants(
        op.text,
        allTableOperations,
        OPERATION_TYPES.INSERT
      );
    }
  });

  return operations;
};

export const createWordTransformationExercise = (
  table: TableData
): WordTransformationExercise => {
  let allTableOperations: Operation[] = [];

  table.cells.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(baseWord, targetWord);
      allTableOperations = allTableOperations.concat(operations);
    });
  });

  const allSequences: WordOperationSequence[] = [];

  table.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(
        baseWord,
        targetWord,
        allTableOperations
      );

      allSequences.push({
        rowIndex,
        colIndex,
        baseWord,
        targetWord,
        operations,
        currentOperation: 0,
        currentWord: baseWord,
      });
    });
  });

  return {
    table,
    sequences: allSequences,
    currentSequenceIndex: 0,
    isCompleted: false,
    showAnswers: false,
  };
};

export const sentenceTemplates: string[] = [
  'Yo _____ en la casa todos los días.',
  'Tú _____ mucho en la escuela.',
  'Él _____ con sus amigos.',
  'Nosotros _____ juntos en el parque.',
  'Vosotros _____ en el estadio.',
  'Ellos _____ todos los fines de semana.',
];

export const sentenceMappings: Record<string, Record<number, number[]>> = {
  'hablаr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
  'comеr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
  'vivіr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
  'cantаr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
  'bailаr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
  'corrеr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
  'saltаr': { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5] },
};

export const createSentenceFittingExercise = (
  table: TableData
): SentenceFittingExercise => {
  let allTableOperations: Operation[] = [];

  table.cells.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(baseWord, targetWord);
      allTableOperations = allTableOperations.concat(operations);
    });
  });

  const allSequences: WordOperationSequence[] = [];

  table.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(
        baseWord,
        targetWord,
        allTableOperations
      );

      const infinitiveMapping = sentenceMappings[baseWord];
      const compatibleSentences = infinitiveMapping
        ? infinitiveMapping[rowIndex] || []
        : [];
      const sentenceIndex =
        compatibleSentences.length > 0
          ? compatibleSentences[
              Math.floor(Math.random() * compatibleSentences.length)
            ]
          : 0;

      allSequences.push({
        rowIndex,
        colIndex,
        baseWord,
        targetWord,
        operations,
        currentOperation: 0,
        currentWord: baseWord,
        sentenceIndex,
      });
    });
  });

  return {
    table,
    sequences: allSequences,
    currentSequenceIndex: 0,
    isCompleted: false,
  };
};
