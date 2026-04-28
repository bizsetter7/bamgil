const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

function timePeriod(h: number): string {
  if (h < 6) return '새벽';
  if (h < 12) return '오전';
  if (h < 18) return '오후';
  return '저녁';
}

function formatTimeKo(time: string, nextDay = false): string {
  const [hStr = '0', mStr = '0'] = time.split(':');
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const period = timePeriod(h);
  const displayH = h % 12 || 12;
  const mStr2 = m > 0 ? ` ${m}분` : '';
  return `${nextDay ? '다음날 ' : ''}${period} ${displayH}시${mStr2}`;
}

/**
 * business_hours JSON → 오늘 영업시간 해시태그 형식
 * 예) "#저녁 6시 ~ 다음날 새벽 4시" | "#24시간 영업"
 * 목록 카드용
 */
export function getTodayHoursHashtag(businessHours: string | null | undefined): string {
  if (!businessHours) return '';
  try {
    const hours: DaySchedule[] = JSON.parse(businessHours);
    if (!Array.isArray(hours) || hours.length < 7) return '';
    const today = hours[new Date().getDay()];
    if (!today) return '';
    if (today.isClosed) return '';
    if (today.is24h) return '#24시간 영업';
    if (!today.open || !today.close) return '';
    const openH = parseInt(today.open.split(':')[0]);
    const closeH = parseInt(today.close.split(':')[0]);
    const isNextDay = closeH < openH;
    return `#${formatTimeKo(today.open)} ~ ${formatTimeKo(today.close, isNextDay)}`;
  } catch { return ''; }
}

interface DaySchedule {
  open: string;
  close: string;
  is24h: boolean;
  isClosed: boolean;
}

/**
 * business_hours JSON 문자열 → 오늘 영업시간 텍스트
 * 예) "오늘(화) 18:00 ~ 04:00" | "오늘(화) 휴무" | "오늘(화) 24시간"
 * 브라우저 로컬 타임 기준 (클라이언트 컴포넌트에서 사용 권장)
 */
export function getTodayHours(businessHours: string | null | undefined): string {
  if (!businessHours) return '';
  try {
    const hours: DaySchedule[] = JSON.parse(businessHours);
    if (!Array.isArray(hours) || hours.length < 7) return '';
    const dayIndex = new Date().getDay(); // 0=일, 1=월 ... 6=토
    const today = hours[dayIndex];
    if (!today) return '';
    const dayName = DAY_NAMES[dayIndex];
    if (today.isClosed) return `오늘(${dayName}) 휴무`;
    if (today.is24h) return `오늘(${dayName}) 24시간`;
    if (!today.open || !today.close) return '';
    return `오늘(${dayName}) ${today.open} ~ ${today.close}`;
  } catch {
    return '';
  }
}
