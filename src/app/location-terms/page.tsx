import Link from 'next/link';
import { MapPin } from 'lucide-react';

const sections = [
  {
    title: '제1조 (목적)',
    content: '이 약관은 야사장이 운영하는 "밤길"(www.bamgil.kr, 이하 "서비스")이 제공하는 위치기반서비스의 이용과 관련하여 서비스와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (서비스의 내용)',
    content: '서비스는 아래와 같은 위치기반 기능을 제공합니다.\n\n· 이용자의 현재 위치를 기반으로 주변 업소 정보 제공\n· 지도에 업소 위치 마커로 표시\n· 거리순 정렬 기능\n\n위치 정보는 이용자의 브라우저 Geolocation API를 통해 수집되며, 기기 GPS 또는 네트워크 기반으로 측정됩니다.',
  },
  {
    title: '제3조 (위치정보의 수집 및 이용)',
    content: '① 서비스는 이용자가 "내 주변" 기능을 사용할 때에만 위치 정보를 수집합니다.\n② 수집된 위치 정보(위도/경도)는 주변 업소 검색·거리 계산에만 사용되며, 서버에 저장하지 않습니다.\n③ 위치 정보는 해당 세션에서만 메모리에 임시 보관되며, 페이지 이탈 또는 서비스 종료 시 자동 폐기됩니다.\n④ 제3자에게 위치 정보를 제공하지 않습니다.',
  },
  {
    title: '제4조 (위치정보 이용 거부 및 제한)',
    content: '① 이용자는 브라우저 또는 기기 설정에서 위치 정보 제공을 언제든지 거부할 수 있습니다.\n\n[브라우저 설정 방법]\n· Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 위치\n· Safari: 환경설정 → 개인정보 보호 → 위치 서비스\n· 기기 설정: 설정 → 개인정보 보호 → 위치 서비스\n\n② 위치 정보 제공을 거부하더라도 지역·카테고리 기반 업소 검색 등 기본 서비스는 계속 이용할 수 있습니다. 단, "내 주변" 기능 및 거리 표시 기능 이용이 제한됩니다.',
  },
  {
    title: '제5조 (위치정보의 보호)',
    content: '① 서비스는 위치 정보를 서버에 저장하지 않으므로 별도의 보관 보안 조치가 적용되지 않습니다.\n② 브라우저 메모리 내에서 처리되는 위치 정보는 기기의 운영체제 보안 정책에 따라 보호됩니다.',
  },
  {
    title: '제6조 (위치정보 파기)',
    content: '서비스는 위치 정보를 서버에 저장하지 않습니다. 브라우저 세션 메모리에만 임시 보관되며, 아래의 경우 자동 폐기됩니다.\n\n· 페이지를 벗어나거나 브라우저 탭을 닫을 때\n· 브라우저를 종료할 때\n· 서비스 이용 세션이 만료될 때',
  },
  {
    title: '제7조 (약관 변경)',
    content: '서비스는 위치기반서비스 이용약관을 변경할 경우 서비스 내 공지사항을 통해 사전 공지합니다.\n\n공지 후 계속 서비스를 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.',
  },
  {
    title: '제8조 (고객센터)',
    content: '위치기반서비스 이용 관련 문의사항이 있으시면 아래로 연락해 주세요.\n\n이메일: bizsetter7@gmail.com\n운영 시간: 평일 10:00 ~ 18:00 (주말·공휴일 제외)',
  },
];

export default function LocationTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <MapPin size={22} style={{ color: '#1e3a5f' }} />
          <h1 className="text-2xl font-black text-gray-900">위치기반서비스 이용약관</h1>
        </div>
        <p className="text-xs text-gray-400 mb-8">시행일: 2026년 5월 1일</p>

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
          <Link href="/privacy" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors">개인정보처리방침 →</Link>
          <Link href="/" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors mt-4">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
