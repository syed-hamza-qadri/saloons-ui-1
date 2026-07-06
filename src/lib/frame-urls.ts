export const FRAME_URLS = Array.from({ length: 240 }, (_, i) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`
);
