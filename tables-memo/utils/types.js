// Data Types & Structures for Table Exercises

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
  ['hablar', 'comer', 'vivir', 'cantar', 'bailar', 'correr', 'saltar'],
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
