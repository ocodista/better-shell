import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// Dracula palette to match the VHS recording underneath
const BG = '#1e1f29';
const ACCENT = '#50fa7b';
const FG = '#f8f8f2';
const MUTED = '#bd93f9';

type Props = {
  /** Frame within the parent Sequence when the caption first becomes visible. */
  enterAt: number;
  /** Frame within the parent Sequence when the caption disappears. */
  exitAt: number;
  /** The feature name. Rendered in bold. */
  label: string;
  /** A short supporting phrase shown in muted text after the label. */
  hint: string;
};

/**
 * Caption overlay that slides up from the bottom of the composition,
 * holds on screen for the requested window, and slides back out.
 * Used to annotate each feature as it fires in the underlying VHS recording.
 */
export const Caption: React.FC<Props> = ({ enterAt, exitAt, label, hint }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Linear 6-frame slide so the caption is fully on screen 6 frames after
  // enterAt — avoids the spring overshoot that was clipping captions at
  // the gutter edge on short scenes.
  const enterProgress = interpolate(
    frame,
    [enterAt, enterAt + 6],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const exitProgress = interpolate(
    frame,
    [exitAt - 6, exitAt],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const translateY = (1 - enterProgress) * 60 + exitProgress * 60;
  const opacity = enterProgress * (1 - exitProgress);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 12,
        display: 'flex',
        justifyContent: 'center',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 22px',
          borderRadius: 999,
          background: BG,
          border: `1px solid ${ACCENT}40`,
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          maxWidth: width - 40,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 18,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: ACCENT,
            boxShadow: `0 0 12px ${ACCENT}`,
          }}
        />
        <span style={{ color: FG, fontWeight: 700 }}>{label}</span>
        <span style={{ color: MUTED }}>{hint}</span>
      </div>
    </div>
  );
};
