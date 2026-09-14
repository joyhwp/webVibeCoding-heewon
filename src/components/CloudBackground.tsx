/**
 * 라이트모드 전용 낮 하늘 배경 — CSS만으로 구현(이미지/캔버스 없음).
 * 실제 하늘색 그라데이션은 globals.css의 --gradient-bg(body 배경)가 맡고,
 * 이 컴포넌트는 그 위에 은은한 구름만 얹는다. 구름 무늬를 정확히 같은
 * 모양으로 두 장 나란히 두고 컨테이너를 한 장 너비만큼 밀어서(transform)
 * 완전히 매끄럽게, 계속 반복해서 흘러가는 것처럼 보이게 한다 —
 * 다크모드의 StarryBackground와 짝을 이루는 테마.
 * 상태/이벤트가 전혀 필요 없는 순수 마크업이라 클라이언트 훅 없이 둔다.
 */
export default function CloudBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1, opacity: 0.75 }}
    >
      <div className="cloud-sky-track">
        <div className="cloud-sky-tile" />
        <div className="cloud-sky-tile" />
      </div>
    </div>
  );
}
