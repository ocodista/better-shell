# after.tape — better-shell zsh experience
# Regenerate with: vhs demo/after.tape

Output demo/after.gif

Require zsh

Set Shell "zsh"
Set FontSize 20
Set Width 1100
Set Height 600
Set Padding 25
Set Theme "Dracula"
Set TypingSpeed 60ms
Set PlaybackSpeed 1.0

# --- Invisible setup: load demo rc, isolate z database, warm it, land in sandbox ---
Hide
Type "source demo/fixtures/demo.zshrc"
Enter
Type `export ZSHZ_DATA="$PWD/demo/fixtures/.z-demo"`
Enter
Type `rm -f "$ZSHZ_DATA"`
Enter
Type "cd demo/fixtures/projects/awesome-blog"
Enter
Type "cd ../cool-project"
Enter
Type "cd ../playground"
Enter
Type "cd ../../sandbox"
Enter
# Push a fresh empty history stack so fzf Ctrl+R only shows commands from the visible recording
Type `: > /tmp/bs-demo-hist && fc -p /tmp/bs-demo-hist`
Enter
Ctrl+L
Show

Sleep 800ms

# 1. lsx — modern ls with icons and colors
Type "lsx"
Sleep 300ms
Enter
Sleep 1800ms

# 2. z — jump to a project by partial name (prompt already shows the new cwd)
Type "z awesome"
Sleep 300ms
Enter
Sleep 1500ms

# 3. fzf history search via Ctrl+R
Ctrl+R
Sleep 800ms
Type "awe"
Sleep 1800ms
Escape
Sleep 800ms

# 4. Autocomplete: git with tab completion
Type "git st"
Sleep 500ms
Tab
Sleep 1200ms
Ctrl+U
Sleep 400ms

Type "echo 'colors. search. life. '"
Sleep 200ms
Enter
Sleep 2s
