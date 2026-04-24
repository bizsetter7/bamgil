/**
 * 실장명 프라이버시 마스킹 — 2번째 글자를 O로 치환
 * 이민 → 이O / 김철훈 → 김O훈 / 김수아야 → 김O수아야
 */
export function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  return name[0] + 'O' + name.slice(2);
}
