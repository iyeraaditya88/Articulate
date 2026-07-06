const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4", // Safari
];

export function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

export function createRecorder(
  stream: MediaStream,
  onChunk: (chunk: Blob) => void,
): { recorder: MediaRecorder; mimeType: string } {
  const mimeType = pickMimeType();
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) onChunk(e.data);
  };
  return { recorder, mimeType: mimeType ?? recorder.mimeType };
}
