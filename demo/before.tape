# before.tape — plain bash baseline
# Regenerate with: vhs demo/before.tape

Output demo/before.gif

Require bash

Set Shell "bash"
Set FontSize 20
Set Width 1100
Set Height 600
Set Padding 25
Set Theme "Github"
Set TypingSpeed 60ms
Set PlaybackSpeed 1.0

# --- Invisible setup: isolate this shell from any user config ---
Hide
Type "export PS1='\$ '"
Enter
Type "export HISTFILE=/tmp/better-shell-demo-before-history"
Enter
Type `rm -f "$HISTFILE"`
Enter
Type `history -c`
Enter
Type "cd demo/fixtures/sandbox"
Enter
# Seed a couple of history entries for the reverse-i-search demo
Type "cd ../projects/awesome-blog"
Enter
Type "cd -"
Enter
Type "clear"
Enter
Show

Sleep 800ms

# 1. Plain ls — no colors, no icons
Type "ls"
Sleep 300ms
Enter
Sleep 1500ms

# 2. Long cd to jump into a project
Type "cd ../projects/awesome-blog"
Sleep 300ms
Enter
Sleep 800ms

Type "pwd"
Sleep 200ms
Enter
Sleep 1200ms

Type "cd -"
Sleep 200ms
Enter
Sleep 800ms

# 3. Boring Ctrl+R reverse-i-search
Ctrl+R
Sleep 600ms
Type "awesome"
Sleep 1800ms
Escape
Sleep 800ms

# 4. No autocomplete: typing git status the long way
Type "git sta"
Sleep 600ms
Tab
Sleep 600ms
Tab
Sleep 800ms
Ctrl+U
Sleep 400ms

Type "echo 'no colors. no search. no life.'"
Sleep 200ms
Enter
Sleep 2s
