import { Sequence, useCurrentFrame } from 'remotion';
import { Terminal, useTypewriter, Cursor } from './Terminal';

const BG = '#f5f5f5';
const FG = '#1a1a1a';
const DIM = '#555';

const Prompt = () => <span>$ </span>;

export const BeforeTerminal = () => (
  <Terminal background={BG} foreground={FG}>
    {/* Scene 1: ls (0-2.5s) */}
    <Sequence from={0} durationInFrames={75}>
      <LsScene />
    </Sequence>

    {/* Scene 2: cd + pwd (2.5-5s) */}
    <Sequence from={75} durationInFrames={75}>
      <CdScene />
    </Sequence>

    {/* Scene 3: failed reverse-i-search (5-7.5s) */}
    <Sequence from={150} durationInFrames={75}>
      <SearchScene />
    </Sequence>

    {/* Scene 4: final echo (7.5-10s) */}
    <Sequence from={225} durationInFrames={75}>
      <FinaleScene />
    </Sequence>
  </Terminal>
);

const LsScene = () => {
  const typed = useTypewriter('ls', 10);
  const frame = useCurrentFrame();
  const showOutput = frame > 35;

  return (
    <div>
      <Prompt />
      <span>{typed}</span>
      {!showOutput && typed.length === 2 && <Cursor color={FG} />}
      {showOutput && (
        <>
          <br />
          <span style={{ color: DIM }}>README.md   package.json   src   tests</span>
          <br />
          <Prompt />
          <Cursor color={FG} />
        </>
      )}
    </div>
  );
};

const CdScene = () => {
  const cmd = useTypewriter('cd ../projects/awesome-blog', 5, 0.8);
  const frame = useCurrentFrame();
  const showNext = frame > 50;
  const pwdTyped = useTypewriter('pwd', 55, 0.8);
  const showPwd = frame > 68;

  return (
    <div>
      <span style={{ color: DIM }}>ls</span>
      <br />
      <span style={{ color: DIM }}>README.md   package.json   src   tests</span>
      <br />
      <Prompt />
      <span>{cmd}</span>
      {!showNext && cmd.length === 27 && <Cursor color={FG} />}
      {showNext && (
        <>
          <br />
          <Prompt />
          <span>{pwdTyped}</span>
          {!showPwd && pwdTyped.length === 3 && <Cursor color={FG} />}
          {showPwd && (
            <>
              <br />
              <span>~/projects/awesome-blog</span>
              <br />
              <Prompt />
              <Cursor color={FG} />
            </>
          )}
        </>
      )}
    </div>
  );
};

const SearchScene = () => {
  const frame = useCurrentFrame();
  const queryText = useTypewriter('awesome', 15, 0.6);
  const failed = frame > 40;

  return (
    <div>
      <span style={{ color: DIM }}>cd ../projects/awesome-blog</span>
      <br />
      <span style={{ color: DIM }}>pwd</span>
      <br />
      <span style={{ color: DIM }}>~/projects/awesome-blog</span>
      <br />
      {!failed ? (
        <>
          <span>{`(reverse-i-search)\`${queryText}': `}</span>
          <Cursor color={FG} />
        </>
      ) : (
        <>
          <span>{`(failed reverse-i-search)\`awesome': `}</span>
          <Cursor color={FG} />
        </>
      )}
    </div>
  );
};

const FinaleScene = () => {
  const cmd = useTypewriter(`echo 'no colors. no search. no life.'`, 5, 0.9);
  const frame = useCurrentFrame();
  const showOutput = frame > 50;

  return (
    <div>
      <Prompt />
      <span>{cmd}</span>
      {showOutput ? (
        <>
          <br />
          <span>no colors. no search. no life.</span>
          <br />
          <Prompt />
          <Cursor color={FG} />
        </>
      ) : (
        cmd.length === 37 && <Cursor color={FG} />
      )}
    </div>
  );
};
