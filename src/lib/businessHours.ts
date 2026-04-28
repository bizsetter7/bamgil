const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

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
