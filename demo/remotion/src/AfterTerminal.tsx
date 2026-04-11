import { Sequence, useCurrentFrame } from 'remotion';
import { Terminal, useTypewriter, Cursor } from './Terminal';

// Dracula-ish palette
const BG = '#282a36';
const FG = '#f8f8f2';
const CYAN = '#8be9fd';
const GREEN = '#50fa7b';
const PURPLE = '#bd93f9';
const PINK = '#ff79c6';
const YELLOW = '#f1fa8c';
const ORANGE = '#ffb86c';
const COMMENT = '#6272a4';
const SELECTION = '#44475a';

const Prompt = ({ cwd }: { cwd: string }) => (
  <>
    <span style={{ color: CYAN, fontWeight: 700 }}>{'➜  '}</span>
    <span style={{ color: GREEN, fontWeight: 700 }}>{cwd}</span>
    <span>{'  '}</span>
  </>
);

export const AfterTerminal = () => (
  <Terminal background={BG} foreground={FG}>
    <Sequence from={0} durationInFrames={90}>
      <LsxScene />
    </Sequence>
    <Sequence from={90} durationInFrames={75}>
      <ZScene />
    </Sequence>
    <Sequence from={165} durationInFrames={75}>
      <FzfScene />
    </Sequence>
    <Sequence from={240} durationInFrames={60}>
      <FinaleScene />
    </Sequence>
  </Terminal>
);

type Row = { perms: string; user: string; date: string; icon: string; name: string; color: string };

const ROWS: Row[] = [
  { perms: '.rw-r--r--', user: ' 24', date: '11 Apr 09:47', icon: ' ', name: '.gitignore', color: COMMENT },
  { perms: '.rw-r--r--', user: ' 73', date: '11 Apr 09:47', icon: ' ', name: 'package.json', color: YELLOW },
  { perms: '.rw-r--r--', user: ' 77', date: '11 Apr 09:47', icon: ' ', name: 'README.md', color: GREEN },
  { perms: 'drwxr-xr-x', user: '  -', date: '11 Apr 09:47', icon: ' ', name: 'src', color: PURPLE },
  { perms: 'drwxr-xr-x', user: '  -', date: '11 Apr 09:47', icon: ' ', name: 'tests', color: PURPLE },
];

const LsxScene = () => {
  const typed = useTypewriter('lsx', 10);
  const frame = useCurrentFrame();
  const showOutput = frame > 30;
  const rowsToShow = showOutput ? Math.min(ROWS.length, Math.floor((frame - 30) / 5)) : 0;

  return (
    <div>
      <Prompt cwd="sandbox" />
      <span>{typed}</span>
      {!showOutput && typed.length === 3 && <Cursor />}
      {showOutput && (
        <>
          <br />
          {ROWS.slice(0, rowsToShow).map((row) => (
            <div key={row.name}>
              <span style={{ color: COMMENT }}>{row.perms}</span>
              <span>{' '}</span>
              <span style={{ color: GREEN }}>{row.user}</span>
              <span>{' '}</span>
              <span style={{ color: ORANGE }}>{row.date}</span>
              <span>{' '}</span>
              <span style={{ color: CYAN }}>{row.icon}</span>
              <span style={{ color: row.color, fontWeight: row.name === 'README.md' ? 700 : 400 }}>
                {row.name}
              </span>
            </div>
          ))}
          {rowsToShow === ROWS.length && (
            <>
              <Prompt cwd="sandbox" />
              <Cursor />
            </>
          )}
        </>
      )}
    </div>
  );
};

const ZScene = () => {
  const typed = useTypewriter('z awesome', 10, 0.6);
  const frame = useCurrentFrame();
  const jumped = frame > 45;

  return (
    <div>
      {/* Recap previous lsx output faded */}
      <div style={{ opacity: 0.5 }}>
        <span style={{ color: GREEN }}>lsx</span>
        <br />
        {ROWS.map((row) => (
          <div key={row.name}>
            <span style={{ color: COMMENT }}>{row.perms}</span>
            <span>{' '}</span>
            <span style={{ color: GREEN }}>{row.user}</span>
            <span>{' '}</span>
            <span style={{ color: ORANGE }}>{row.date}</span>
            <span>{' '}</span>
            <span style={{ color: CYAN }}>{row.icon}</span>
            <span style={{ color: row.color }}>{row.name}</span>
          </div>
        ))}
      </div>
      <Prompt cwd={jumped ? 'awesome-blog' : 'sandbox'} />
      {!jumped ? (
        <>
          <span>{typed}</span>
          {typed.length === 9 && <Cursor />}
        </>
      ) : (
        <Cursor />
      )}
    </div>
  );
};

const FzfScene = () => {
  const frame = useCurrentFrame();
  const query = useTypewriter('awe', 15, 0.5);
  const items = [
    { n: '1', text: 'clear' },
    { n: '2', text: 'lsx' },
    { n: '3', text: 'z awesome' },
  ];
  const filtered = query.length > 0 ? items.filter((i) => i.text.includes(query)) : items;
  const selected = filtered[0];

  return (
    <div>
      <Prompt cwd="awesome-blog" />
      <span style={{ color: CYAN }}>{query}</span>
      <Cursor />
      <br />
      <br />
      {/* Fzf popup */}
      <div style={{ marginLeft: 20 }}>
        <div>
          <span style={{ color: CYAN }}>{`${filtered.length}/${items.length} `}</span>
          <span style={{ color: PINK }}>+S</span>
        </div>
        {filtered.map((item, idx) => (
          <div
            key={item.n}
            style={{
              background: idx === 0 ? SELECTION : 'transparent',
              color: idx === 0 ? CYAN : FG,
            }}
          >
            <span style={{ color: idx === 0 ? PINK : COMMENT }}>{idx === 0 ? '▌' : ' '}</span>
            <span>{' '}</span>
            <span style={{ color: YELLOW }}>{item.n}</span>
            <span>{'  '}</span>
            <Highlight text={item.text} query={query} />
          </div>
        ))}
        <div>
          <span style={{ color: PINK }}>{'❯ '}</span>
          <span>{query}</span>
          <Cursor />
        </div>
      </div>
    </div>
  );
};

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <span>{text}</span>;
  const idx = text.indexOf(query);
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      <span>{text.slice(0, idx)}</span>
      <span style={{ color: ORANGE, fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
      <span>{text.slice(idx + query.length)}</span>
    </>
  );
};

const FinaleScene = () => {
  const cmd = useTypewriter(`echo 'colors. search. life. ✨'`, 5, 0.9);
  const frame = useCurrentFrame();
  const showOutput = frame > 45;

  return (
    <div>
      <Prompt cwd="awesome-blog" />
      <span>{cmd}</span>
      {showOutput ? (
        <>
          <br />
          <span>colors. search. life. ✨</span>
          <br />
          <Prompt cwd="awesome-blog" />
          <Cursor />
        </>
      ) : (
        cmd.length >= 30 && <Cursor />
      )}
    </div>
  );
};
