import { ALL_FORMATS, Input, UrlSource } from "mediabunny";

/**
 * Duration of a clip in seconds. Used by calculateMetadata so a footage scene
 * can declare durationInFrames: "auto" and just be as long as the recording.
 */
export const getVideoDuration = async (src: string): Promise<number> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, { getRetryDelay: () => null }),
  });
  return await input.computeDuration();
};
