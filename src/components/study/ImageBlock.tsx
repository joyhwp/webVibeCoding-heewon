"use client";

import { useLightbox } from "@/lib/lightboxBus";
import { imagePath, type ImageBlock as ImageBlockType } from "@/lib/studyMl";

type ImageBlockProps = { block: ImageBlockType };

/** 스크린샷 이미지 — 캡션을 이미지 위에 함께 배치하고, 클릭하면 라이트박스로 확대 */
export default function ImageBlock({ block }: ImageBlockProps) {
  const { open } = useLightbox();
  const src = imagePath(block.file);
  const caption = block.caption ?? "";

  return (
    <figure className="max-w-full space-y-2">
      {caption && (
        <figcaption className="text-sm text-foreground/60">{caption}</figcaption>
      )}
      <button
        type="button"
        onClick={() => open(src, caption, block.w, block.h)}
        className="group block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption || "ML 노트 스크린샷"}
          width={block.w}
          height={block.h}
          loading="lazy"
          className="w-full object-contain"
        />
      </button>
    </figure>
  );
}
