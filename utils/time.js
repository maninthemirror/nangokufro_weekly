
/**
 * 對標時間用
 */
const JST_OFFSET = 9 * 60 * 60 * 1000;

function toJST(date) {
  return new Date(date.getTime() + JST_OFFSET);
}

/**
 * 上週四 00:00 JST ～ 本週三 23:59 JST
 */
export function getWeeklyRange(base = new Date()) {
  const jstNow = toJST(base);

  // 0=Sun, 1=Mon, ... 6=Sat
  const day = jstNow.getUTCDay();

  // 本週三
  const diffToWed = (day >= 3) ? day - 3 : day + 4;
  const end = new Date(jstNow);
  end.setUTCDate(jstNow.getUTCDate() - diffToWed);
  end.setUTCHours(23, 59, 59, 999);

  // 上週四
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);

  return { start, end };
}

export { toJST };