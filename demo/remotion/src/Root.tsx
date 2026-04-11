import { Composition } from 'remotion';
import { AnnotatedAfter } from './AnnotatedAfter';

// Source recording is 950×560 at 25 fps, 475 frames. The composition is
// slightly taller than the recording to leave a gutter where the caption
// pill slides in from.
const SOURCE_WIDTH = 950;
const SOURCE_HEIGHT = 560;
const CAPTION_GUTTER = 80;
const FPS = 25;
const DURATION = 475;

export const RemotionRoot = () => (
  <Composition
    id="AnnotatedAfter"
    component={AnnotatedAfter}
    durationInFrames={DURATION}
    fps={FPS}
    width={SOURCE_WIDTH}
    height={SOURCE_HEIGHT + CAPTION_GUTTER}
  />
);
