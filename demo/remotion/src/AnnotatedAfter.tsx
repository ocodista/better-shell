import { AbsoluteFill, staticFile } from 'remotion';
import { Gif } from '@remotion/gif';
import { Caption } from './Caption';

// Dimensions of the source recording (demo/ubuntu-after.gif)
const RECORDING_WIDTH = 950;
const RECORDING_HEIGHT = 560;

/**
 * Layers caption overlays on top of the real VHS recording. The GIF is loaded
 * synchronously via @remotion/gif so its playhead stays in lockstep with the
 * Remotion timeline — there is no drift between the terminal events and the
 * captions that annotate them.
 *
 * Caption windows are expressed in 25 fps source frames; see the comments
 * next to each Caption below for the scene each one annotates.
 */
export const AnnotatedAfter: React.FC = () => {
  const gif = staticFile('ubuntu-after.gif');

  return (
    <AbsoluteFill style={{ background: '#282a36' }}>
      <Gif
        src={gif}
        width={RECORDING_WIDTH}
        height={RECORDING_HEIGHT}
        fit="contain"
        loopBehavior="pause-after-finish"
      />

      {/* lsx — file listing with Nerd Font icons and colors (~frame 50–150) */}
      <Caption
        enterAt={45}
        exitAt={150}
        label="Modern ls"
        hint="icons + colors via eza"
      />

      {/* z awesome — smart directory jumping (~frame 215–275) */}
      <Caption
        enterAt={210}
        exitAt={280}
        label="Autojump"
        hint="z <partial-name>"
      />

      {/* Ctrl+R fzf history popup (~frame 285–315) */}
      <Caption
        enterAt={285}
        exitAt={325}
        label="Fuzzy history"
        hint="Ctrl+R → fzf"
      />

      {/* git st<Tab> — subcommand completion (~frame 330–360) */}
      <Caption
        enterAt={330}
        exitAt={370}
        label="Tab completion"
        hint="git subcommands"
      />

      {/* final echo with syntax highlighting (~frame 400–475) */}
      <Caption
        enterAt={400}
        exitAt={475}
        label="Syntax highlighting"
        hint="every command, colored"
      />
    </AbsoluteFill>
  );
};
