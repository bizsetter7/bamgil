import Link from 'next/link';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '1. 개인정보 수집 항목',
    content: '[로그인 시 수집 — Google OAuth]\n· 이메일 주소, 프로필 이름\n\n[서비스 이용 시 자동 수집]\n· 접속 IP 주소\n· 기기 정보 (OS, 브라우저 종류·버전)\n· 서비스 이용 기록 (조회 업소, 찜하기, 리뷰 작성)\n\n[위치 정보 — 내 주변 기능 사용 시]\n· 현재 위치 (위도/경도) — 브라우저 Geolocation API로만 사용\n· 서버에 저장하지 않으며 서비스 이용 종료 시 자동 폐기',
  },
  {
    title: '2. 개인정보 이용 목적',
    content: '수집된 개인정보는 아래 목적으로만 이용됩니다.\n\n· 로그인 및 회원 식별\n· 찜하기·리뷰 기능 제공\n· 잘못된 정보 제보 접수 및 처리\n· 서비스 개선 및 이용 현황 분석',
  },
  {
    title: '3. 업소 광고 정보에 대하여',
    content: '밤길에 표시되는 업소 광고 정보(업소명, 위치, 연락처, 사진 등)는 야사장(www.yasajang.kr)에 등록된 데이터를 기반으로 합니다.\n\n밤길은 업소 광고 정보를 직접 수집하거나 저장하지 않으며, 이에 관한 개인정보 처리는 야사장의 개인정보처리방침을 따릅니다.',
  },
  {
    title: '4. 개인정보 보유 및 이용 기간',
    content: '· 회원 탈퇴 시: 즉시 삭제\n· 자동 수집 정보 (IP, 이용 기록 등): 1년 보관 후 삭제\n· 단, 관계 법령에 의해 보존이 필요한 경우 해당 기간까지 보관\n  - 전자상거래 관련 기록: 5년 (전자상거래법)\n  - 소비자 불만·분쟁 기록: 3년 (전자상거래법)',
  },
  {
    title: '5. 개인정보 제3자 제공',
    content: '밤길은 이용자의 개인정보를 외부에 제공하지 않습니다.\n\n단, 아래의 경우 예외로 합니다.\n· 이용자가 사전에 동의한 경우\n· 수사기관의 법령에 따른 요청이 있는 경우',
  },
  {
    title: '6. 쿠키 및 분석 도구',
    content: '밤길은 서비스 개선을 위해 쿠키 및 로컬스토리지를 사용할 수 있습니다.\n\n· 브라우저 설정에서 쿠키 거부 가능 (일부 기능 이용 제한될 수 있음)\n· 로그인 상태 유지를 위해 Supabase 인증 토큰이 로컬스토리지에 저장됩니다',
  },
  {
    title: '7. 이용자의 권리',
    content: '이용자는 언제든지 아래 권리를 행사할 수 있습니다.\n\n· 개인정보 열람 요청\n· 개인정보 수정·삭제 요청\n· 서비스 탈퇴 (마이페이지에서 직접 가능)\n\n문의: bizsetter7@gmail.com',
  },
  {
    title: '8. 개인정보 보호책임자',
    content: '서비스 이용 중 개인정보 관련 문의사항이 있으시면 아래로 연락해 주세요.\n\n담당: 야사장 운영팀\n이메일: bizsetter7@gmail.com\n운영 시간: 평일 10:00 ~ 18:00',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={22} style={{ color: '#1e3a5f' }} />
          <h1 className="text-2xl font-black text-gray-900">개인정보처리방침</h1>
        </div>
        <p className="text-xs text-gray-400 mb-6">시행일: 2026년 5월 1일</p>

        <p className="text-sm text-gray-600 mb-8 leading-relaxed p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          밤길(www.bamgil.kr)은 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수합니다. 본 방침은 밤길이 수집하는 개인정보와 그 이용 방법을 안내합니다.
        </p>

        <div className="space-y-4">
          {sections.map((sec, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 mb-3">{sec.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center space-y-2">
          <Link href="/terms" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors">이용약관 →</Link>
          <Link href="/location-terms" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors">위치기반서비스 이용약관 →</Link>
          <Link href="/" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors mt-4">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
