# install.tape — one-liner install demo inside a fresh ubuntu:22.04 container
# The container runs the bs-demo:installbase prereqs image (curl/sudo/git
# already baked in) so the visible portion is just the one-liner → installer
# output → exec zsh → lsx proving it worked.
# Regenerate:
#   docker build -f demo/Dockerfile.install-base -t bs-demo:installbase demo/
#   vhs demo/install.tape

Output demo/install.gif

Require docker

Set Shell "bash"
Set FontFamily "FiraCode Nerd Font Mono"
Set FontSize 20
Set Width 1100
Set Height 620
Set Padding 28
Set Theme "Dracula"
Set TypingSpeed 60ms
Set PlaybackSpeed 1.0
Set WindowBar "Colorful"

# --- Hidden setup: launch the prereqs image, quiet the prompt, clear ---
Hide
Type `docker run --rm -it --name bs-demo-install bs-demo:installbase bash`
Enter
Sleep 2000ms
Type "unalias -a; PS1='$ '"
Enter
Sleep 300ms
Ctrl+L
Show

Sleep 900ms

# 1. The one-liner, typed at real speed
Type@45ms "curl -fsSL https://shell.ocodista.com/install.sh | sudo bash"
Sleep 800ms
Enter

# 2. Installer runs visibly for a few seconds so the viewer can see it do
#    its thing, then we hide while the long apt/git/setup work finishes off
#    camera. When Show resumes, the "Installation complete!" banner is
#    already on screen — command → result transition in one beat.
Sleep 6s
Hide
Sleep 85s
Show

Sleep 2500ms

# 3. Switch into the freshly-installed zsh and prove the tools are live
Type "exec zsh"
Sleep 300ms
Enter
Sleep 1800ms

Type "lsx /"
Sleep 300ms
Enter
Sleep 2500ms

Type "echo 'one command. full shell. '"
Sleep 200ms
Enter
Sleep 2500ms
