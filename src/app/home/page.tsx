"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import AddTaskForm from "@/components/home/AddTaskForm";
import QuickAddBar from "@/components/home/QuickAddBar";
import Timeline from "@/components/home/Timeline";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import QuickLinks from "@/components/home/QuickLinks";
import InProgressWidget from "@/components/home/InProgressWidget";
import MountFadeIn from "@/components/MountFadeIn";
import { useSchedule } from "@/hooks/useSchedule";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getClassesForDay } from "@/lib/classSchedule";
import { uncancelClassForDate } from "@/lib/classOverrides";
import { findClassCancelTrashId, restoreFromTrash } from "@/lib/trash";
import { toMinutes } from "@/lib/time";

const USER_NAME = "Heewon";

export default function HomePage() {
  const hasMounted = useHasMounted();
  const { dateKey, items, now, add, remove, toggleComplete, move, refresh } =
    useSchedule();
  // classOverrides/classSchedule은 useSchedule 밖에서(QuickAddBar가 직접) 바뀔 수
  // 있어서, todayClasses를 강제로 다시 읽게 하는 별도의 트리거
  const [classVersion, setClassVersion] = useState(0);

  // 요일별 시간표(classSchedule.ts)도 localStorage 기반이라 hasMounted로 감싼다.
  const todayClasses = useMemo(() => {
    if (!hasMounted) return [];
    const [y, m, d] = dateKey.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    return getClassesForDay(dayOfWeek, dateKey);
    // classVersion은 함수 본문에서 쓰이진 않지만, QuickAddBar가 수업을
    // 휴강/이동시킨 뒤 강제로 다시 읽게 하려고 의도적으로 넣은 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted, dateKey, classVersion]);

  // 휴강된 수업은 "다음 일정"으로 안내하면 안 되므로 여기서만 제외한다
  // (Timeline에는 여전히 휴강 표시된 채로 그대로 보여줌)
  const nextEvent = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const upcoming = [
      ...todayClasses
        .filter((c) => !c.cancelled)
        .map((c) => ({
          startMin: toMinutes(c.startTime),
          title: c.subject,
        })),
      ...items
        .filter((t) => !t.completed && t.startTime)
        .map((t) => ({
          startMin: toMinutes(t.startTime as string),
          title: t.task,
        })),
    ]
      .filter((e) => e.startMin >= nowMin)
      .sort((a, b) => a.startMin - b.startMin)[0];

    if (!upcoming) return { hasEvent: false, text: "" };
    const h = String(Math.floor(upcoming.startMin / 60)).padStart(2, "0");
    const m = String(upcoming.startMin % 60).padStart(2, "0");
    return { hasEvent: true, text: `Next up: ${h}:${m} ${upcoming.title}` };
  }, [todayClasses, items, now]);

  // 타임라인에 휴강 표시로 남아있는 수업을 클릭했을 때 다시 정상 상태로
  // 되돌린다. 아직 undo 토스트가 떠 있는 상태라면 그 휴지통 항목을 그대로
  // 복구하고(휴지통에서도 사라짐), 아니라면 override만 직접 지운다.
  function handleUncancelClass(classId: string, classDateKey: string) {
    const trashId = findClassCancelTrashId(classDateKey, classId);
    if (trashId) {
      restoreFromTrash(trashId);
    } else {
      uncancelClassForDate(classDateKey, classId);
    }
    setClassVersion((v) => v + 1);
  }

  // localStorage 기반 콘텐츠는 마운트 전(서버 렌더링 포함)엔 아무것도 그리지 않아
  // 하이드레이션 불일치를 원천적으로 막는다.
  if (!hasMounted) {
    return <div className="pt-4" />;
  }

  return (
    <div className="pt-4">
      <MountFadeIn>
        <WelcomeHeader
          name={USER_NAME}
          now={now}
          hasNextEvent={nextEvent.hasEvent}
          nextEventText={nextEvent.text}
        />
      </MountFadeIn>

      <div className="mt-8 flex flex-col gap-6">
        <MountFadeIn delay={0.08}>
          <InProgressWidget />
        </MountFadeIn>

        <MountFadeIn delay={0.12}>
          <GlassCard className="flex flex-col gap-6">
            <QuickAddBar
              todayKey={dateKey}
              onScheduleChanged={refresh}
              onClassChanged={() => setClassVersion((v) => v + 1)}
            />
            <div className="border-t border-foreground/10 pt-6">
              <AddTaskForm todayKey={dateKey} onAdd={add} />
            </div>
          </GlassCard>
        </MountFadeIn>
        <MountFadeIn delay={0.24}>
          <GlassCard>
            <Timeline
              tasks={items}
              classes={todayClasses}
              now={now}
              todayKey={dateKey}
              onRemove={remove}
              onToggleComplete={toggleComplete}
              onPostpone={move}
              onUncancelClass={handleUncancelClass}
            />
          </GlassCard>
        </MountFadeIn>
      </div>

      <QuickLinks />
    </div>
  );
}
