'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { maskName } from '@/lib/maskName';
import { getActivePlanFromList } from '@/lib/subscriptionPlan';

interface Business {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  address?: string | null;
  category: string;
  manager_name?: string | null;
  subscriptions?: { plan: string; status: string }[] | null;
}

// zoomTo(id): 해당 업소 위치로 맵 center + level 4
export type ZoomToFn = (id: string) => void;

// 업소별 geocoding 결과 (lat/lng + region 정보 — 거리·구동 배지용)
export type GeocodedInfo = {
  lat: number;
  lng: number;
  region2?: string;       // 시군구 (예: 천안시 서북구)
  region3?: string;       // 법정동 (예: 백석동)
  jibunAddress?: string;  // 지번주소(구주소)
};

interface KakaoMapProps {
  businesses: Business[];
  fullscreen?: boolean;
  onLoad?: (map: any, zoomTo: ZoomToFn) => void;
  onMarkerClick?: (id: string) => void;
  onGeocoded?: (data: Map<string, GeocodedInfo>) => void;
}

declare global {
  interface Window { kakao: any; }
}

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.9780;

// 클러스터 표시 기준 레벨 (이 레벨 이상이면 클러스터, 미만이면 라벨)
const CLUSTER_MIN_LEVEL = 6;

// 투명 1x1 GIF (클러스터용 invisible Marker 이미지)
const TRANSPARENT_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function KakaoMap({ businesses, fullscreen = false, onLoad, onMarkerClick, onGeocoded }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const positionsCache = useRef<Map<string, any>>(new Map());

  // ── props/router refs (useEffect 재실행 방지) ──
  const routerRef = useRef(router);
  const onLoadRef = useRef(onLoad);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onGeocodedRef = useRef(onGeocoded);
  useEffect(() => { routerRef.current = router; }, [router]);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { onGeocodedRef.current = onGeocoded; }, [onGeocoded]);

  // businesses 핵심 식별자 — id+lat+lng+plan 변경 시에만 지도 재초기화
  const bizSignature = useMemo(
    () => businesses.map(b => `${b.id}:${b.lat ?? ''}:${b.lng ?? ''}:${b.subscriptions?.[0]?.plan ?? ''}:${b.subscriptions?.[0]?.status ?? ''}`).join('|'),
    [businesses],
  );

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    // 정리용
    let clustererRef: any = null;
    const ownedOverlays: any[] = [];

    const initMap = (userLat: number, userLng: number) => {
      if (cancelled || !mapRef.current || !window.kakao) return;
      try {
        window.kakao.maps.load(() => {
          if (cancelled || !mapRef.current) return;

          /* ─── 지도 생성 ─── */
          const center = new window.kakao.maps.LatLng(userLat, userLng);
          const map = new window.kakao.maps.Map(mapRef.current, { center, level: 5 });

          /* ─── 클러스터러 생성 (비어있는 채로 시작) ─── */
          const clusterer = new window.kakao.maps.MarkerClusterer({
            map,
            markers: [],
            averageCenter: true,
            minLevel: CLUSTER_MIN_LEVEL,
            minClusterSize: 1,         // 단일 마커도 '1' 클러스터로 표시
            disableClickZoom: false,
            styles: [
              // count 1~9
              {
                width: '40px', height: '40px',
                background: 'rgba(37,99,235,0.90)',
                borderRadius: '50%',
                color: '#fff', textAlign: 'center',
                lineHeight: '40px', fontWeight: '800', fontSize: '14px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.45)',
              },
              // count 10~99
              {
                width: '48px', height: '48px',
                background: 'rgba(29,78,216,0.92)',
                borderRadius: '50%',
                color: '#fff', textAlign: 'center',
                lineHeight: '48px', fontWeight: '800', fontSize: '16px',
                boxShadow: '0 2px 10px rgba(29,78,216,0.45)',
              },
              // count 100+
              {
                width: '56px', height: '56px',
                background: 'rgba(30,64,175,0.94)',
                borderRadius: '50%',
                color: '#fff', textAlign: 'center',
                lineHeight: '56px', fontWeight: '800', fontSize: '18px',
                boxShadow: '0 3px 12px rgba(30,64,175,0.5)',
              },
            ],
          });
          clustererRef = clusterer;

          /* ─── overlay 가시성 업데이트 ─── */
          const updateOverlays = () => {
            const level = map.getLevel();
            const show = level < CLUSTER_MIN_LEVEL;
            ownedOverlays.forEach((o) => o.setMap(show ? map : null));
          };
          window.kakao.maps.event.addListener(map, 'zoom_changed', updateOverlays);

          /* ─── 현재 위치 마커 ─── */
          if (userLat !== DEFAULT_LAT || userLng !== DEFAULT_LNG) {
            new window.kakao.maps.CustomOverlay({
              map,
              position: new window.kakao.maps.LatLng(userLat, userLng),
              content: `<div style="
                width:14px;height:14px;
                background:#f59e0b;border:3px solid #fff;
                border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.3);
              "></div>`,
              zIndex: 10,
            });
          }

          /* ─── 투명 마커 이미지 (클러스터용) ─── */
          const invisibleImg = new window.kakao.maps.MarkerImage(
            TRANSPARENT_GIF,
            new window.kakao.maps.Size(1, 1),
          );

          /* ─── 업소 마커 생성 헬퍼 ─── */
          const bounds = new window.kakao.maps.LatLngBounds();
          let hasValidPins = false;
          const allClusterMarkers: any[] = [];   // 배치 추가용
          const geocodedMap = new Map<string, GeocodedInfo>();

          /* 모든 마커 수집 완료 후 한 번만 finalize */
          const finalizeMarkers = () => {
            if (cancelled) return;
            if (allClusterMarkers.length > 0) {
              clusterer.addMarkers(allClusterMarkers);
            }
            updateOverlays();
            if (hasValidPins) map.setBounds(bounds);
            // geocoded 데이터 부모로 전달 (거리·구동 배지 계산용)
            if (onGeocodedRef.current) onGeocodedRef.current(geocodedMap);
          };

          const addBusinessMarker = (biz: Business, position: any) => {
            if (cancelled) return;
            hasValidPins = true;
            positionsCache.current.set(biz.id, position);
            bounds.extend(position);

            // 티어 색상 (active + trial 동등 취급)
            const plan = getActivePlanFromList(biz.subscriptions);
            const isPremium = plan === 'premium' || plan === 'elite';
            const isDeluxe = plan === 'deluxe';
            const isStandard = plan === 'standard';
            const bgColor = isPremium
              ? '#d97706'
              : isDeluxe
              ? '#1d4ed8'
              : isStandard
              ? '#1d4ed8'
              : '#1e3a5f';
            const zIdx = isPremium ? 5 : isDeluxe ? 4 : isStandard ? 3 : 1;

            /* 라벨 CustomOverlay (이름표) */
            const el = document.createElement('div');
            el.style.cssText = `
              position:relative;
              background:${bgColor};
              color:#fff;
              padding:4px 9px 4px;
              border-radius:8px;
              font-size:12px;
              font-weight:700;
              white-space:nowrap;
              cursor:pointer;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);
              user-select:none;
              transition:transform 0.12s;
              line-height:1.4;
            `;
            el.textContent = biz.name;

            // 삼각형 화살표
            const arrow = document.createElement('div');
            arrow.style.cssText = `
              position:absolute;
              bottom:-5px;left:50%;
              transform:translateX(-50%);
              width:0;height:0;
              border-left:5px solid transparent;
              border-right:5px solid transparent;
              border-top:5px solid ${bgColor};
            `;
            el.appendChild(arrow);

            el.addEventListener('click', () => {
              if (onMarkerClickRef.current) onMarkerClickRef.current(biz.id);
              else routerRef.current.push(`/places/${biz.id}`);
            });

            /* 영업진 팝업 (hover 전용 — 데스크탑) */
            const managers = biz.manager_name
              ? biz.manager_name.split(/[,，、\/]/).map(s => s.trim()).filter(Boolean)
              : [];

            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative;display:inline-block;';

            if (managers.length > 0) {
              const popup = document.createElement('div');
              popup.style.cssText = `
                display:none;
                position:absolute;
                bottom:calc(100% + 6px);
                left:50%;
                transform:translateX(-50%);
                background:#18181b;
                color:#fff;
                border-radius:10px;
                padding:8px 12px;
                white-space:nowrap;
                font-size:11px;
                font-weight:700;
                box-shadow:0 4px 16px rgba(0,0,0,0.45);
                pointer-events:none;
                z-index:200;
                line-height:1.6;
                border:1px solid rgba(255,255,255,0.08);
              `;
              const header = document.createElement('div');
              header.textContent = '👤 영업진';
              header.style.cssText = 'color:#f59e0b;font-size:10px;font-weight:900;margin-bottom:4px;';
              popup.appendChild(header);
              managers.forEach((m) => {
                const row = document.createElement('div');
                row.textContent = `${maskName(m)} 실장`;
                row.style.cssText = 'color:#e4e4e7;';
                popup.appendChild(row);
              });
              wrapper.appendChild(popup);

              wrapper.addEventListener('mouseenter', () => {
                popup.style.display = 'block';
                el.style.transform = 'scale(1.06)';
                try { overlay.setZIndex(9999); } catch { /* noop */ }
              });
              wrapper.addEventListener('mouseleave', () => {
                popup.style.display = 'none';
                el.style.transform = 'scale(1)';
                try { overlay.setZIndex(zIdx); } catch { /* noop */ }
              });
            } else {
              wrapper.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.06)';
                try { overlay.setZIndex(9999); } catch { /* noop */ }
              });
              wrapper.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
                try { overlay.setZIndex(zIdx); } catch { /* noop */ }
              });
            }

            wrapper.appendChild(el);

            const overlay = new window.kakao.maps.CustomOverlay({
              position,
              content: wrapper,
              yAnchor: 1.15,   // 화살표 포함 높이 고려
              zIndex: zIdx,
            });
            ownedOverlays.push(overlay);

            /* 클러스터용 투명 Marker — 배치 수집 */
            const marker = new window.kakao.maps.Marker({ position, image: invisibleImg });
            allClusterMarkers.push(marker);
          };

          /* ─── geocoder ─── */
          const geocoder = new window.kakao.maps.services.Geocoder();

          // 층/호/동 등 세부 위치 정보 제거 — 카카오 geocoder가 인식 못함
          const stripDetailAddr = (addr: string) =>
            addr
              .replace(/\s+\d+층.*$/, '')
              .replace(/\s+\d+호.*$/, '')
              .replace(/\s+[가-힣]*\d*동\s+\d+호.*$/, '')
              .trim();

          // geocoding 필요한 업소 수 추적
          const addressOnlyBizs = businesses.filter(b => !(b.lat && b.lng) && !!b.address);
          let pendingGeocode = addressOnlyBizs.length;
          // pendingRegion은 fetchRegionForCoord 정의 직후 ++ 증가
          let totalPendingRegion = 0;
          const tryFinalize = () => {
            if (pendingGeocode === 0 && totalPendingRegion === 0) finalizeMarkers();
          };

          // 풀주소 실패 시 시/도+시군구 만으로 fallback (예: "충남 천안시 서북구")
          const tryGeocode = (biz: Business, addr: string, attempt: number) => {
            geocoder.addressSearch(addr, (result: any[], st: string) => {
              if (cancelled) return;
              if (st === window.kakao.maps.services.Status.OK && result[0]) {
                const lat = parseFloat(result[0].y);
                const lng = parseFloat(result[0].x);
                addBusinessMarker(biz, new window.kakao.maps.LatLng(lat, lng));
                // region 정보 저장 (구주소 region2/region3 + 지번주소)
                const a = result[0].address || {};
                geocodedMap.set(biz.id, {
                  lat, lng,
                  region2: a.region_2depth_name,        // "천안시 서북구"
                  region3: a.region_3depth_name,        // "백석동"
                  jibunAddress: a.address_name,
                });
                pendingGeocode--;
                tryFinalize();
              } else if (attempt === 0 && biz.address) {
                // 1차 실패 → 시도+시군구만 잘라 재시도
                const parts = biz.address.trim().split(/\s+/);
                const fallback = parts.slice(0, Math.min(3, parts.length)).join(' ');
                if (fallback && fallback !== addr) {
                  tryGeocode(biz, fallback, 1);
                  return;
                }
                pendingGeocode--;
                tryFinalize();
              } else {
                pendingGeocode--;
                tryFinalize();
              }
            });
          };

          // lat/lng 보유 업소 → coord2RegionCode 로 region 정보 가져오기
          const fetchRegionForCoord = (biz: Business, lat: number, lng: number) => {
            totalPendingRegion++;
            geocoder.coord2RegionCode(lng, lat, (result: any[], st: string) => {
              if (!cancelled && st === window.kakao.maps.services.Status.OK && result?.length) {
                // result에 'B'(법정동) 와 'H'(행정동) 두 종류가 옴 — B 우선
                const b = result.find(r => r.region_type === 'B') || result[0];
                geocodedMap.set(biz.id, {
                  lat, lng,
                  region2: b.region_2depth_name,
                  region3: b.region_3depth_name,
                });
              } else if (!cancelled) {
                geocodedMap.set(biz.id, { lat, lng });
              }
              totalPendingRegion--;
              tryFinalize();
            });
          };

          businesses.forEach((biz) => {
            if (biz.lat && biz.lng) {
              addBusinessMarker(biz, new window.kakao.maps.LatLng(biz.lat, biz.lng));
              fetchRegionForCoord(biz, biz.lat, biz.lng);
            } else if (biz.address) {
              tryGeocode(biz, stripDetailAddr(biz.address), 0);
            }
          });

          // 모든 업소가 lat/lng 없고 address도 없으면 즉시 finalize
          tryFinalize();

          /* ─── zoomTo ─── */
          const zoomTo: ZoomToFn = (id: string) => {
            const pos = positionsCache.current.get(id);
            if (!pos) return;
            try {
              map.relayout();
              map.setCenter(pos);
              map.setLevel(4);
            } catch { /* 무시 */ }
          };

          setStatus('ready');
          if (onLoadRef.current) onLoadRef.current(map, zoomTo);
        });
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    /* ─── SDK 로드 대기 ─── */
    let retryCount = 0;
    const tryInit = (lat: number, lng: number) => {
      if (cancelled) return;
      if (window.kakao) { initMap(lat, lng); return; }
      if (++retryCount > 25) { if (!cancelled) setStatus('error'); return; }
      setTimeout(() => tryInit(lat, lng), 200);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => tryInit(pos.coords.latitude, pos.coords.longitude),
        () => tryInit(DEFAULT_LAT, DEFAULT_LNG),
        { timeout: 3000, maximumAge: 60000 },
      );
    } else {
      tryInit(DEFAULT_LAT, DEFAULT_LNG);
    }

    return () => {
      cancelled = true;
      if (clustererRef) { try { clustererRef.clear(); } catch { /* 무시 */ } }
      ownedOverlays.forEach((o) => { try { o.setMap(null); } catch { /* 무시 */ } });
    };
  // bizSignature 가 같으면 재초기화 안 함 (id+lat/lng+plan 변경 시에만)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizSignature]);

  return (
    <div
      className={`relative w-full overflow-hidden ${
        fullscreen ? 'h-full' : 'h-[450px] rounded-[2.5rem] border border-zinc-800 shadow-2xl'
      }`}
    >
      <div ref={mapRef} className="w-full h-full" />

      {/* 로딩 */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-bold">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 에러 */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="text-center space-y-2 px-6">
            <p className="text-zinc-400 text-sm font-bold">지도를 불러올 수 없습니다</p>
            <button onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-xl">
              새로고침
            </button>
          </div>
        </div>
      )}

      {/* 위치 뱃지 (로드 완료 시) */}
      {status === 'ready' && (
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-widest shadow pointer-events-none">
          실시간 위치 기반 탐색
        </div>
      )}
    </div>
  );
}
