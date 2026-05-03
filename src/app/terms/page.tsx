import Link from 'next/link';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '제1조 (목적)',
    content: '이 약관은 야사장이 운영하는 위치기반 유흥업소 정보 서비스 "밤길"(www.bamgil.kr, 이하 "서비스")의 이용 조건 및 절차를 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (서비스의 내용)',
    content: '서비스는 아래와 같은 기능을 제공합니다.\n\n· 로그인 없이 업소 정보 열람 가능\n· 현재 위치 또는 검색 조건 기반 업소 조회 및 정렬\n· 카테고리·지역 필터링\n· 업소 영업시간, 연락처, 위치 안내\n· 찜하기, 리뷰 작성 (로그인 필요)\n\n서비스에 표시되는 업소 정보는 야사장(www.yasajang.kr)에 등록된 데이터를 기반으로 하며, 밤길은 이를 조회·제공하는 플랫폼입니다.',
  },
  {
    title: '제3조 (이용자의 의무)',
    content: '이용자는 서비스를 이용함에 있어 아래 행위를 해서는 안 됩니다.\n\n· 서비스를 불법적인 목적으로 이용하는 행위\n· 서비스의 안정적 운영을 방해하는 행위 (과도한 요청, 크롤링 등)\n· 타인의 개인정보를 수집하거나 악용하는 행위\n· 허위 리뷰 작성 또는 서비스 신뢰도를 훼손하는 행위',
  },
  {
    title: '제4조 (지식재산권)',
    content: '서비스에 포함된 디자인, 텍스트, 로고 등 모든 콘텐츠의 저작권은 야사장 또는 해당 권리자에게 귀속됩니다.\n\n이용자는 서비스 내 콘텐츠를 서비스 운영자의 사전 동의 없이 복제, 배포, 전송, 수정하거나 상업적으로 이용할 수 없습니다.',
  },
  {
    title: '제5조 (책임 한계)',
    content: '① 서비스는 업소 정보의 정확성·최신성을 보장하지 않습니다. 업소 정보(영업시간, 위치, 연락처 등)는 야사장에 등록된 내용을 기반으로 하며, 실제와 다를 수 있습니다.\n② 서비스는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.\n③ 이용자가 서비스를 통해 업소를 방문하여 발생한 손해에 대해서 서비스는 책임지지 않습니다.',
  },
  {
    title: '제6조 (이용약관 변경)',
    content: '서비스는 합리적인 사유가 있을 때 약관을 변경할 수 있습니다.\n\n변경된 약관은 서비스 내 공지사항 또는 홈페이지를 통해 사전 공지하며, 공지 후 계속 서비스를 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.',
  },
  {
    title: '제7조 (분쟁해결)',
    content: '이 약관은 대한민국 법률에 따라 해석됩니다.\n\n서비스 이용과 관련하여 분쟁이 발생할 경우, 야사장의 본사 소재지를 관할하는 대한민국 법원을 전속 관할법원으로 합니다.',
  },
  {
    title: '제8조 (고객센터)',
    content: '서비스 이용 중 문의사항이 있으시면 아래 이메일로 연락해 주세요.\n\n이메일: bizsetter7@gmail.com\n운영 시간: 평일 10:00 ~ 18:00 (주말·공휴일 제외)',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="text-navy-600" size={22} style={{ color: '#1e3a5f' }} />
          <h1 className="text-2xl font-black text-gray-900">이용약관</h1>
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
          <Link href="/privacy" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors">개인정보처리방침 →</Link>
          <Link href="/location-terms" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors">위치기반서비스 이용약관 →</Link>
          <Link href="/" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors mt-4">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
