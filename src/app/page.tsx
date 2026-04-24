import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 font-mono">KAKAO MAP LOAD PENDING...</p>
      </div>

      {/* Overlay UI */}
      <div className="relative z-10 p-6 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full max-w-md pointer-events-auto shadow-2xl">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-yellow-400">📍</span> 밤길 (Bamgil)
          </h1>
          <p className="text-slate-400 mb-6">
            내 주변 가장 핫한 업소를 지도로 한눈에.<br />
            실제 방문자의 리얼 리뷰를 확인하세요.
          </p>
          
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input 
                type="text" 
                placeholder="지역 또는 업소명 검색" 
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation (Mock) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
        <button className="px-6 py-2 bg-yellow-400 text-black font-bold rounded-xl">지도</button>
        <button className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all">목록</button>
        <button className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all">커뮤니티</button>
        <button className="px-6 py-2 hover:bg-white/5 rounded-xl transition-all">내정보</button>
      </div>
    </div>
  );
}
