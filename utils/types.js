// Data Types & Structures for Table Exercises
import DiffMatchPatch from 'diff-match-patch';

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
