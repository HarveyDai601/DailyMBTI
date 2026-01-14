export type IRTItem = {
  qid: string;
  a: number;
  b: number[]; // thresholds b1..b4 length 4
  scoreMapping: { [k: string]: number };
};

export class IRTModel {
  // logistic helper
  private static sigmoid(x: number) {
    return 1 / (1 + Math.exp(-x));
  }

  // probability of responding in category k (1..5) given theta for graded response 2PL
  private static categoryProb(theta: number, item: IRTItem, k: number) {
    const a = item.a;
    const bs = item.b; // b1..b4
    // P*(m) = Prob(response >= m)
    const Pstar = (m: number) => {
      if (m <= 1) return 1;
      if (m >= 6) return 0;
      const idx = m - 2; // m=2 -> b1 -> idx 0
      const b = bs[idx];
      return this.sigmoid(a * (theta - b));
    };
    const p = Pstar(k) - Pstar(k + 1);
    // clamp
    return Math.max(1e-12, Math.min(1 - 1e-12, p));
  }

  // log-likelihood of observed responses for a set of items given theta
  private static logLikelihood(theta: number, items: IRTItem[], responses: number[]) {
    let ll = 0;
    for (let i = 0; i < items.length; i++) {
      const resp = responses[i];
      if (resp == null) continue;
      const p = this.categoryProb(theta, items[i], resp);
      ll += Math.log(p);
    }
    return ll;
  }

  // Estimate theta by grid search with refinement
  static estimateTheta(items: IRTItem[], responses: number[]) {
    // Grid search coarse
    const low = -4;
    const high = 4;
    const coarseStep = 0.1;
    let bestTheta = 0;
    let bestLL = -Infinity;
    for (let t = low; t <= high; t += coarseStep) {
      const ll = this.logLikelihood(t, items, responses);
      if (ll > bestLL) {
        bestLL = ll;
        bestTheta = t;
      }
    }
    // Refine around best with finer step
    let refineLow = Math.max(low, bestTheta - coarseStep);
    let refineHigh = Math.min(high, bestTheta + coarseStep);
    const fineStep = 0.01;
    bestLL = -Infinity;
    let refined = bestTheta;
    for (let t = refineLow; t <= refineHigh; t += fineStep) {
      const ll = this.logLikelihood(t, items, responses);
      if (ll > bestLL) {
        bestLL = ll;
        refined = t;
      }
    }
    return refined;
  }

  // Given the questions grouped by dimension and answers map, compute theta per dimension and final MBTI
  // questionsByDim: { dimKey: IRTItem[] }
  // answersByQid: { [qid]: number }
  static computeMBTI(questionsByDim: { [dimKey: string]: IRTItem[] }, answersByQid: { [qid: string]: number }) {
    const summary: { [dimKey: string]: { theta: number; letter: string } } = {};
    // dimKey formatted like "E-I" or "S-N" etc
    for (const dimKey of Object.keys(questionsByDim)) {
      const items = questionsByDim[dimKey];
      const filteredItems: IRTItem[] = [];
      const responses: number[] = [];
      for (const it of items) {
        const r = answersByQid[it.qid];
        if (r != null) {
          filteredItems.push(it);
          responses.push(r);
        }
      }
      // If no responses, default theta 0
      let theta = 0;
      if (filteredItems.length > 0) {
        theta = this.estimateTheta(filteredItems, responses);
      }
      // derive letters
      // get left and right letters from dimKey like "E-I"
      const parts = dimKey.split('-');
      const left = parts[0].trim().charAt(0) || '?';
      const right = (parts[1] || '').trim().charAt(0) || '?';
      const letter = theta >= 0 ? left : right;
      summary[dimKey] = { theta, letter };
    }
    // Compose MBTI string in order E/I, S/N, T/F, J/P if available
    const order = ['E-I', 'S-N', 'T-F', 'J-P'];
    const code = order.map(k => (summary[k] ? summary[k].letter : '?')).join('');
    return { summary, code };
  }
}
