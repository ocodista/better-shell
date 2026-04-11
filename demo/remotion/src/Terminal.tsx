import { ReactNode } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/JetBrainsMono';

const { fontFamily } = loadFont();

type Props = {
  children: ReactNode;
  background: string;
  foreground: string;
};

export const Terminal = ({ children, background, foreground }: Props) => (
  <AbsoluteFill
    style={{
      background,
      color: foreground,
      fontFamily,
      fontSize: 22,
      lineHeight: 1.45,
      padding: 36,
      whiteSpace: 'pre',
    }}
  >
    {children}
  </AbsoluteFill>
);

/**
 * Reveals a string character-by-character.
 * `startFrame` is when typing begins, `charsPerFrame` controls typing speed.
 */
export const useTypewriter = (text: string, startFrame: number, charsPerFrame = 0.6) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(localFrame * charsPerFrame));
  return text.slice(0, chars);
};

/** Blinking block cursor. */
export const Cursor = ({ color = '#fff' }: { color?: string }) => {
  const frame = useCurrentFrame();
  const visible = frame % 30 < 15;
  return (
    <span
      style={{
        display: 'inline-block',
        width: '0.55em',
        height: '1.1em',
        background: visible ? color : 'transparent',
        verticalAlign: 'text-bottom',
      }}
    />
  );
};
