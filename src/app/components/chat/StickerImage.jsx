import React from "react";
import { CHAT_STICKER_MAP } from "./constants.js";

export const StickerImage = ({ id, size = 120, className = "" }) => {
  const sticker = CHAT_STICKER_MAP[id];
  if (!sticker) return null;
  return (
    <span
      className={`inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: sticker.svg }}
    />
  );
};
