export interface Question {
  qid: string;
  question_text: string;
  dimKey: string;
  irt_params: {
    a: number;
    b1: number;
    b2: number;
    b3: number;
    b4: number;
  };
  scoring_rule: {
    score_mapping: { [k: string]: number };
  };
}

export class QuestionGenerator {
  private questionsJson: any;

  constructor(questionsJson: any) {
    this.questionsJson = questionsJson;
  }

  generateQuestions(options: {
    totalQuestions?: number;
    questionsPerPage?: number;
    dimensionCounts?: { [dim: string]: number };
    shuffle?: boolean;
  } = {}): Question[] {
    const {
      totalQuestions = 100,
      questionsPerPage = 5,
      dimensionCounts = { 'E-I': 25, 'S-N': 25, 'T-F': 25, 'J-P': 25 },
      shuffle = false,
    } = options;

    const dims = this.questionsJson.mbti_question_bank.dimensions as any[];
    const dimMap: { [key: string]: any[] } = {};
    for (const d of dims) {
      const match = d.dimension_name.match(/[A-Z]-[A-Z]/);
      const dimKey = match ? match[0] : d.dimension_name;
      dimMap[dimKey] = d.questions;
    }

    const selected: Question[] = [];
    for (const [dim, count] of Object.entries(dimensionCounts)) {
      const available = dimMap[dim] || [];
      const toTake = Math.min(count, available.length);
      for (let i = 0; i < toTake; i++) {
        const q = available[i];
        selected.push({
          qid: q.qid,
          question_text: q.question_text,
          dimKey: dim,
          irt_params: q.irt_params,
          scoring_rule: q.scoring_rule,
        });
      }
    }

    // Shuffle if requested
    if (shuffle) {
      selected.sort(() => Math.random() - 0.5);
    }

    // Take up to totalQuestions
    return selected.slice(0, totalQuestions);
  }

  getTotalPages(totalQuestions: number, questionsPerPage: number): number {
    return Math.ceil(totalQuestions / questionsPerPage);
  }
}