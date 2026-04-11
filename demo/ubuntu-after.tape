# ubuntu-after.tape — ubuntu:22.04 with better-shell pre-installed
# Paired with ubuntu-before.tape to produce the side-by-side GIF
# Regenerate: vhs demo/ubuntu-after.tape

Output demo/ubuntu-after.gif

Require docker

Set Shell "bash"
Set FontSize 20
Set Width 950
Set Height 560
Set Padding 28
Set Theme "Dracula"
Set TypingSpeed 55ms
Set PlaybackSpeed 1.0
Set WindowBar "Colorful"

# --- Invisible setup: launch the pre-installed bs-demo image ---
# The image has better-shell installed end-to-end, so this is what a user
# actually gets after running the curl|sudo bash one-liner.
Hide
Type `docker run --rm -it --name bs-demo-after bs-demo:installed zsh`
Enter
Sleep 2500ms
# Push an empty history stack so fzf Ctrl+R only shows commands from the visible portion
Type `: > /tmp/bs-demo-hist && fc -p /tmp/bs-demo-hist`
Enter
Ctrl+L
Show

Sleep 900ms

# 1. lsx — eza with icons and colors
Type "lsx"
Sleep 300ms
Enter
Sleep 2000ms

# 2. z — directory jumping by partial name
# Warm z's database by briefly visiting the target, then return
Type "cd /root/projects/awesome-blog"
Enter
Sleep 400ms
Type "cd /root/sandbox"
Enter
Sleep 400ms
Ctrl+L
Sleep 400ms
Type "z awesome"
Sleep 300ms
Enter
Sleep 1600ms

# 3. fzf history search via Ctrl+R
Ctrl+R
Sleep 800ms
Type "awe"
Sleep 1600ms
Escape
Sleep 700ms

# 4. Tab completion for git subcommands
Type "git st"
Sleep 500ms
Tab
Sleep 1200ms
Ctrl+U
Sleep 400ms

Type "echo 'colors. search. life. '"
Sleep 200ms
Enter
Sleep 2200ms
