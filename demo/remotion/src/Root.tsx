import { Composition } from 'remotion';
import { BeforeTerminal } from './BeforeTerminal';
import { AfterTerminal } from './AfterTerminal';

const FPS = 30;
const WIDTH = 1100;
const HEIGHT = 600;

export const RemotionRoot = () => (
  <>
    <Composition
      id="Before"
      component={BeforeTerminal}
      durationInFrames={FPS * 10}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="After"
      component={AfterTerminal}
      durationInFrames={FPS * 10}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
