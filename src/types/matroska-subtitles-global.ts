
export interface MatroskaSubtitleCue {
  text: string;
  time: number;
  duration: number;
}

export interface MatroskaSubtitleTrackInfo {
  number: number;
  language?: string;
  type: string;
  name?: string;
  header?: string;
}

export interface MatroskaSubtitleParser {
  once(event: "tracks", listener: (tracks: MatroskaSubtitleTrackInfo[]) => void): this;
  on(
    event: "subtitle",
    listener: (subtitle: MatroskaSubtitleCue, trackNumber: number) => void,
  ): this;
  write(chunk: Uint8Array): void;
  end(): void;
}

export interface MatroskaSubtitlesGlobal {
  SubtitleParser: new () => MatroskaSubtitleParser;
}

declare global {
  interface Window {
    MatroskaSubtitles?: MatroskaSubtitlesGlobal;
  }
}

// Do not declare VTTCue here. TypeScript's DOM library already declares the
// browser-native VTTCue class. Declaring it again causes TS2300/TS2305-style
// duplicate identifier errors with lib.dom.d.ts.
