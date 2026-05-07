const WEEK = 7 * 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 60;

export function computeGoalProgress(goal, transactions) {
  const since = goal.created_at || 0;

  const saved = transactions
    .filter((t) => t.kind === 'savings'
      && t.occurred_at >= since
      && (!goal.wallet_id || t.wallet_id === goal.wallet_id))
    .reduce((s, t) => s + t.amount, 0);

  const target = goal.target || 0;
  const remaining = Math.max(0, target - saved);
  const percent = target > 0 ? Math.min(1, saved / target) : 0;
  const complete = saved >= target;

  const windowStart = Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentSaved = transactions
    .filter((t) => t.kind === 'savings'
      && t.occurred_at >= windowStart
      && (!goal.wallet_id || t.wallet_id === goal.wallet_id))
    .reduce((s, t) => s + t.amount, 0);

  const weeksObserved = RECENT_WINDOW_DAYS / 7;
  const weeklyRate = recentSaved / weeksObserved;

  let weeksLeft = null;
  let eta = null;
  if (!complete && weeklyRate > 0) {
    weeksLeft = Math.ceil(remaining / weeklyRate);
    eta = Date.now() + weeksLeft * WEEK;
  }

  let deadlineStatus = null;
  if (goal.deadline) {
    if (complete) deadlineStatus = 'done';
    else if (eta && eta <= goal.deadline) deadlineStatus = 'on-track';
    else if (eta && eta > goal.deadline) deadlineStatus = 'behind';
    else deadlineStatus = 'unknown';
  }

  return {
    saved,
    target,
    remaining,
    percent,
    complete,
    weeklyRate,
    weeksLeft,
    eta,
    deadlineStatus,
  };
}
