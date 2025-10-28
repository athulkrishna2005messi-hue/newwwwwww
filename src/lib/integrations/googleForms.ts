export type GoogleFormsQuestion = {
  id: string;
  label: string;
};

export type GoogleFormsResponse = {
  respondent: string;
  submittedAt: string;
  answers: Record<string, string>;
};

export type GoogleFormsImportPreview = {
  title: string;
  questionCount: number;
  questions: GoogleFormsQuestion[];
  responses: GoogleFormsResponse[];
  isAuthenticated: boolean;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function generateQuestionId(index: number): string {
  return `question_${index + 1}`;
}

function normalizeLine(line: string): string | null {
  const trimmed = line.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildGoogleFormsPreview(csvContent: string): GoogleFormsImportPreview {
  if (!csvContent) {
    throw new Error('CSV content is required to build a Google Forms preview.');
  }

  const lines = csvContent
    .split(/\r?\n/g)
    .map(normalizeLine)
    .filter((line): line is string => Boolean(line));

  if (lines.length === 0) {
    throw new Error('The provided CSV content is empty.');
  }

  const headerCells = parseCsvLine(lines[0]);
  const questionHeaders = headerCells.slice(1);

  const questions: GoogleFormsQuestion[] = questionHeaders.map((label, index) => ({
    id: generateQuestionId(index),
    label: label || `Untitled question ${index + 1}`,
  }));

  const responses: GoogleFormsResponse[] = lines.slice(1).map((line, responseIndex) => {
    const cells = parseCsvLine(line);
    const submittedAt = cells[0] ?? '';
    const respondent = cells[1] || `Respondent ${responseIndex + 1}`;

    const answers: Record<string, string> = {};
    questions.forEach((question, questionIndex) => {
      const cellIndex = questionIndex + 1;
      answers[question.id] = cells[cellIndex] ?? '';
    });

    return {
      respondent,
      submittedAt,
      answers,
    };
  });

  const isAuthenticated = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  return {
    title: 'Google Forms CSV Preview',
    questionCount: questions.length,
    questions,
    responses,
    isAuthenticated,
  };
}
