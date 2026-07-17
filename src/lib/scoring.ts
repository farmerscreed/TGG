// Shared judging math so the judge UI, the admin submission detail, and the
// leaderboard all compute a judge's total the same way.
//
// Scores are stored one row per (judge, submission, criterion) in judge_scores.
// A judge's total is the weighted sum of their per-criterion scores, where each
// criterion contributes (score / max_points) * weight.

export interface ScoringCriterion {
    id: string
    max_points: number
    weight: number
}

/** Weighted total for one judge given their per-criterion scores. */
export function computeJudgeTotal(
    scores: Record<string, number>,
    criteria: ScoringCriterion[]
): number {
    return criteria.reduce((acc, c) => {
        const s = scores[c.id] ?? 0
        return acc + (c.max_points > 0 ? (s / c.max_points) * c.weight : 0)
    }, 0)
}

/** Group flat judge_scores rows into { judgeId: { criterionId: score } }. */
export function groupScoresByJudge(
    rows: { judge_id: string; criterion_id: string; score: number | string }[]
): Map<string, Record<string, number>> {
    const byJudge = new Map<string, Record<string, number>>()
    for (const r of rows) {
        const map = byJudge.get(r.judge_id) ?? {}
        map[r.criterion_id] = Number(r.score)
        byJudge.set(r.judge_id, map)
    }
    return byJudge
}
