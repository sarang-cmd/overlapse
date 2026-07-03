'use client';
import React, { useState } from 'react';
import { DndContext, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DateTime } from 'luxon';

function Block({ x, id }: { x: number; id: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px,0,0)` : undefined,
    left: x,
  };
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="absolute top-2 h-10 w-[120px] rounded-lg bg-[#ff6a1a]/90 border border-[#ff6a1a] text-[10px] text-black flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(255,106,26,0.35)]"
    >
      DRAG ME • 60m
    </div>
  );
}

export function DraggableMeeting() {
  const [pos, setPos] = useState(40);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return (
    <div style={{fontFamily:'"Fragment Mono", monospace'}} className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.012]">
      <div className="text-[10px] text-[#00e0ff] uppercase tracking-widest mb-2">Meeting-block proposal • @dnd-kit</div>
      <DndContext sensors={sensors} onDragEnd={(e)=>{
        setPos(p => Math.max(0, Math.min(420, p + (e.delta.x||0))));
      }}>
        <div className="relative h-14 bg-black/30 rounded-xl border border-white/[0.06] overflow-hidden">
          {/* hour ticks */}
          <div className="absolute inset-0 flex">
            {Array.from({length:24}).map((_,i)=>(
              <div key={i} className="flex-1 border-r border-white/[0.04] text-[8px] text-zinc-600 pl-1">{i}</div>
            ))}
          </div>
          <Block x={pos} id="meeting-1" />
          {/* golden hour glow */}
          <div className="absolute top-0 bottom-0 left-[210px] w-[120px] bg-[#00e0ff]/[0.07] pointer-events-none" />
        </div>
      </DndContext>
      <div className="text-[10px] text-zinc-500 mt-2">
        Drag to find best time • RRULE: FREQ=WEEKLY • Luxon DST safe • {DateTime.utc().toFormat('HH:mm')} UTC now
      </div>
    </div>
  );
}
