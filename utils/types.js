// Data Types & Structures for Table Exercises
import DiffMatchPatch from 'diff-match-patch';

// Vocabulary Data Structures
export const createVocabularyWord = (
  id,
  nativeWord,
  studiedWord,
  topic,
  difficulty = 'beginner'
) => ({
  id,
  nativeWord,
  studiedWord,
  topic,
  difficulty,
  correctCount: 0,
  incorrectCount: 0,
});

export const createVocabularyTopic = (
  id,
  name,
  description,
  words
) => ({
  id,
  name,
  description,
  words,
});

// Sample vocabulary data
export const sampleVocabularyTopics = [
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

export const getWordsForTopics = (topicIds) => {
  return sampleVocabularyTopics
    .filter(topic => topicIds.includes(topic.id))
    .flatMap(topic => topic.words);
};

export const createMultipleChoiceExercise = (words, direction = 'native-to-studied') => {
  // Shuffle words for random order
  const shuffledWords = shuffleArray([...words]);

  // Create questions with multiple choices
  const questions = shuffledWords.map((word, index) => {
    // Determine question and correct answer based on direction
    const questionWord = direction === 'native-to-studied' ? word.nativeWord : word.studiedWord;
    const correctAnswer = direction === 'native-to-studied' ? word.studiedWord : word.nativeWord;

    // Get 3 other wrong answers from the same topic
    const sameTopicWords = words.filter(w => w.topic === word.topic && w.id !== word.id);
    const wrongAnswers = shuffleArray(sameTopicWords)
      .slice(0, 3)
      .map(w => direction === 'native-to-studied' ? w.studiedWord : w.nativeWord);

    // Combine correct and wrong answers and shuffle
    const allChoices = shuffleArray([correctAnswer, ...wrongAnswers]);

    return {
      id: `q${index}`,
      wordId: word.id,
      question: questionWord,
      correctAnswer,
      choices: allChoices,
      isCorrect: null, // null = not answered, true = correct, false = incorrect
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

export const createTypingExercise = (words, direction = 'native-to-studied') => {
  // Shuffle words for random order
  const shuffledWords = shuffleArray([...words]);

  // Create questions with text input
  const questions = shuffledWords.map((word, index) => {
    // Determine question and correct answer based on direction
    const questionWord = direction === 'native-to-studied' ? word.nativeWord : word.studiedWord;
    const correctAnswer = direction === 'native-to-studied' ? word.studiedWord : word.nativeWord;

    // Set max input length to twice the length of correct answer
    const maxLength = correctAnswer.length * 2;

    return {
      id: `q${index}`,
      wordId: word.id,
      question: questionWord,
      correctAnswer,
      userInput: '',
      isCorrect: null, // null = not answered, true = correct, false = incorrect
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

export const createMatchingColumnsExercise = (words, direction = 'native-to-studied') => {
  // Determine which side is native and which is studied
  const leftIsNative = direction === 'native-to-studied';

  // Create word objects with display text and correct pairing
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

  // Shuffle left and right separately to create mismatched display
  const leftWords = shuffleArray(wordPairs.map(pair => ({
    id: pair.leftId,
    text: pair.leftText,
    wordIndex: pair.index,
    correctMatch: pair.rightId,
  })));

  const rightWords = shuffleArray(wordPairs.map(pair => ({
    id: pair.rightId,
    text: pair.rightText,
    wordIndex: pair.index,
    correctMatch: pair.leftId,
  })));

  // Create correct matches array (pairs of [leftId, rightId])
  const matches = wordPairs.map(pair => [pair.leftId, pair.rightId]);

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


// CellData structure
export const createCellData = (
  row,
  col,
  correctValue
) => ({
  row,
  col,
  correctValue,
  currentValue: null,
  isFilled: false,
  isCorrect: false,
});

// TableData structure
export const createTableData = (
  id,
  name,
  rows,
  columns,
  cellValues
) => {
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

// Sample Spanish conjugation table data
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

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createFillCellsExercise = (table) => {
  // Extract all correct values and shuffle them
  const allValues = table.cells.flat().map(cell => cell.correctValue);
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

// Word Transformations Exercise Types

// Operation types from diff
export const OPERATION_TYPES = {
  INSERT: 'insert',
  DELETE: 'delete'
};

// Grammar rules explanations - complete transformation instructions
export const allGrammarRulesExplanations = {
  'spanish-present': [
    "For -ar verbs like 'hablar': Remove -ar ending to get stem, then add: Yo(-o), Tú(-as), Él(-a), Nosotros(-amos), Vosotros(-áis), Ellos(-an)",
    "For -er verbs like 'comer': Remove -er ending to get stem, then add: Yo(-o), Tú(-es), Él(-e), Nosotros(-emos), Vosotros(-éis), Ellos(-en)",
    "For -ir verbs like 'vivir': Remove -ir ending to get stem, then add: Yo(-o), Tú(-es), Él(-e), Nosotros(-imos), Vosotros(-ís), Ellos(-en)"
  ]
};

// Table grammar rule mapping (one rule index per verb)
export const tableGrammarRuleMapping = {
  'spanish-present-hablar': [0, 1, 2, 0, 0, 0, 0] // hablar(0), comer(1), vivir(2), cantar(0), bailar(0), correr(0), saltar(0)
};



// Generate wrong variants for insert operations
export const generateWrongVariants = (correctText, allTableOperations, operationType, maxVariants = 4) => {
  const wrongVariants = new Set();

  // Find other insert operations from the same table
  allTableOperations.forEach(op => {
    if (op.type === operationType && op.text !== correctText && op.text.length === correctText.length) {
      wrongVariants.add(op.text);
    }
  });

  // If not enough variants from table, generate random strings of same length
  while (wrongVariants.size < maxVariants - 1) {
    const randomText = generateRandomString(correctText.length);
    if (randomText !== correctText) {
      wrongVariants.add(randomText);
    }
  }

  return shuffleArray([correctText, ...Array.from(wrongVariants)].slice(0, maxVariants));
};

// Generate random string of given length
const generateRandomString = (length) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate operations for a word transformation pair
export const generateWordOperations = (baseWord, targetWord, allTableOperations = []) => {
  const dmp = new DiffMatchPatch();
  const diff = dmp.diff_main(baseWord, targetWord);
  dmp.diff_cleanupSemantic(diff);

  const operations = diffToOps(baseWord, diff);

  // Pre-generate variants for insert operations
  operations.forEach(op => {
    if (op.type === OPERATION_TYPES.INSERT) {
      op.variants = generateWrongVariants(op.text, allTableOperations, OPERATION_TYPES.INSERT);
    }
  });

  return operations;
};

// Create word transformation exercise state
export const createWordTransformationExercise = (table) => {
  // First pass: generate all operations without variants
  let allTableOperations = [];

  table.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(baseWord, targetWord);

      // Collect all operations for variant generation
      allTableOperations = allTableOperations.concat(operations);
    });
  });

  // Second pass: regenerate operations with variants
  const allSequences = [];

  table.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(baseWord, targetWord, allTableOperations);

      allSequences.push({
        rowIndex,
        colIndex,
        baseWord,
        targetWord,
        operations,
        currentOperation: 0,
        currentWord: baseWord
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

export const diffToOps = (from, diffs) => {
  let index = 0;
  const ops = [];

  for (const [op, text] of diffs) {
    if (op === 0) { // equal
      index += text.length;
    }

    if (op === -1) { // delete
      ops.push({
        type: "delete",
        index,
        length: text.length,
        text
      });
      // do NOT move index
    }

    if (op === 1) { // insert
      ops.push({
        type: "insert",
        index,
        text
      });
      index += text.length;
    }
  }

  return ops;
}

// Sentence Fitting Exercise Data

export const sentenceTemplates = [
  "Yo _____ en la casa todos los días.",
  "Tú _____ mucho en la escuela.",
  "Él _____ con sus amigos.",
  "Nosotros _____ juntos en el parque.",
  "Vosotros _____ en el estadio.",
  "Ellos _____ todos los fines de semana.",
];

export const sentenceMappings = {
  'hablаr': {
    0: [0], // Yo
    1: [1], // Tú
    2: [2], // Él/Ella
    3: [3], // Nosotros
    4: [4], // Vosotros
    5: [5], // Ellos/Ellas
  },
  'comеr': {
    0: [0],
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5],
  },
  'vivіr': {
    0: [0],
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5],
  },
  'cantаr': {
    0: [0],
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5],
  },
  'bailаr': {
    0: [0],
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5],
  },
  'corrеr': {
    0: [0],
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5],
  },
  'saltаr': {
    0: [0],
    1: [1],
    2: [2],
    3: [3],
    4: [4],
    5: [5],
  },
};

// Create sentence fitting exercise state
export const createSentenceFittingExercise = (table) => {
  // First pass: generate all operations without variants
  let allTableOperations = [];

  table.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(baseWord, targetWord);

      // Collect all operations for variant generation
      allTableOperations = allTableOperations.concat(operations);
    });
  });

  // Second pass: create sequences with sentences
  const allSequences = [];

  table.cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const baseWord = table.columns[colIndex];
      const targetWord = cell.correctValue;
      const operations = generateWordOperations(baseWord, targetWord, allTableOperations);

      // Get compatible sentence indices for this infinitive and person
      const infinitiveMapping = sentenceMappings[baseWord];
      const compatibleSentences = infinitiveMapping ? infinitiveMapping[rowIndex] || [] : [];
      const sentenceIndex = compatibleSentences.length > 0
        ? compatibleSentences[Math.floor(Math.random() * compatibleSentences.length)]
        : 0; // fallback

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
