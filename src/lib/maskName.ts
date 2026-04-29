/**
 * 실장명 프라이버시 마스킹
 * - 첫 글자 + 가운데 모두 O + 마지막 글자 보존
 * - 단어 구분(공백) 보존: "ZOAO HAIYAN" → "ZOOO HOOOON"
 * - 한글 3자: "김철수" → "김O수"
 * - 한글 4자: "김철수아" → "김OO아"
 * - 영문 4자: "ZOAO" → "ZOOO"
 * - 2자: "이민" → "이O" / "AB" → "AO"
 */
function maskWord(w: string): string {
  if (w.length <= 1) return w;
  if (w.length === 2) return w[0] + 'O';
  // 3자 이상: 첫글자 + O*(len-2) + 마지막글자
  return w[0] + 'O'.repeat(w.length - 2) + w[w.length - 1];
}

export function maskName(name: string): string {
  if (!name) return name;
  // 공백/특수문자 보존하고 단어별로 마스킹
  return name.split(/(\s+)/).map(seg => {
    if (/^\s*$/.test(seg)) return seg;
    return maskWord(seg);
  }).join('');
}
