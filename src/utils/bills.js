import {
  addMonths,
  differenceInCalendarDays,
  format,
  lastDayOfMonth,
  setDate,
  startOfDay,
  subDays,
} from 'date-fns';

export function monthKey(date) {
  return format(date, 'yyyy-MM');
}

export function isPaid(bill, date = new Date()) {
  return (bill.paid_months || []).includes(monthKey(date));
}

export function dueDateInMonth(bill, date = new Date()) {
  const last = lastDayOfMonth(date).getDate();
  const day = Math.min(bill.day_of_month, last);
  return setDate(date, day);
}

export function nextDueDate(bill, ref = new Date()) {
  const today = startOfDay(ref);
  const thisMonthDue = startOfDay(dueDateInMonth(bill, ref));
  if (!isPaid(bill, ref) && thisMonthDue >= today) return thisMonthDue;
  if (isPaid(bill, ref)) return startOfDay(dueDateInMonth(bill, addMonths(ref, 1)));
  return thisMonthDue;
}

export function billStatus(bill, ref = new Date()) {
  if (isPaid(bill, ref)) return { id: 'paid', label: 'Paid' };
  const today = startOfDay(ref);
  const due = startOfDay(dueDateInMonth(bill, ref));
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return { id: 'overdue', label: `${Math.abs(days)}d overdue`, days };
  if (days === 0) return { id: 'today', label: 'Due today', days };
  if (days <= 2) return { id: 'soon', label: `In ${days}d`, days };
  return { id: 'upcoming', label: `In ${days}d`, days };
}

export function billsTotalsForMonth(bills, ref = new Date()) {
  let due = 0;
  let paid = 0;
  for (const b of bills) {
    if (isPaid(b, ref)) paid += b.amount;
    else due += b.amount;
  }
  return { due, paid, total: due + paid };
}

export function reminderDate(bill, ref = new Date()) {
  return subDays(nextDueDate(bill, ref), 2);
}
