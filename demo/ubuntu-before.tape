# ubuntu-before.tape — plain ubuntu:22.04 bash, unchanged
# Paired with ubuntu-after.tape to produce the side-by-side GIF
# Regenerate: vhs demo/ubuntu-before.tape

Output demo/ubuntu-before.gif

Require docker

Set Shell "bash"
Set FontFamily "FiraCode Nerd Font Mono"
Set FontSize 20
Set Width 950
Set Height 560
Set Padding 28
Set Theme "Dracula"
Set TypingSpeed 55ms
Set PlaybackSpeed 1.0
Set WindowBar "Colorful"

# --- Invisible setup: launch a fresh ubuntu container and land in /root ---
Hide
Type `docker run --rm -it --name bs-demo-before ubuntu:22.04 bash`
Enter
Sleep 2500ms
# Strip bashrc colorization and set a uniform prompt so the "before" state looks
# like a minimal bash environment regardless of the distro default
Type "unalias -a; PS1='$ '"
Enter
Type `mkdir -p /root/sandbox/src /root/sandbox/tests /root/projects/awesome-blog /root/projects/cool-project /root/projects/playground && touch /root/sandbox/README.md /root/sandbox/package.json /root/sandbox/src/index.ts /root/sandbox/.gitignore`
Enter
Type "cd /root/sandbox"
Enter
Type "history -c"
Enter
Ctrl+L
Show

Sleep 900ms

# 1. Plain ls — no colors, no icons
Type "ls"
Sleep 300ms
Enter
Sleep 1600ms

# 2. Long-form cd — no z, no fuzzy, no shortcut
Type "cd /root/projects/awesome-blog"
Sleep 300ms
Enter
Sleep 600ms

Type "pwd"
Sleep 200ms
Enter
Sleep 1200ms

Type "cd -"
Sleep 200ms
Enter
Sleep 700ms

# 3. Primitive Ctrl+R reverse-i-search (in-place, no popup)
Ctrl+R
Sleep 700ms
Type "awesome"
Sleep 1600ms
Ctrl+G
Sleep 700ms

# 4. No tab completion for git subcommands
Type "git sta"
Sleep 500ms
Tab
Sleep 300ms
Tab
Sleep 700ms
Ctrl+U
Sleep 400ms

Type "echo 'no colors. no search. no life.'"
Sleep 200ms
Enter
Sleep 2200ms
