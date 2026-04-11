# Minimal zshrc used only by demo/after.tape — it loads the plugins that
# better-shell installs so the VHS recording is reproducible on any machine
# that has run the better-shell installer (plugins live under ~/.antigen).

autoload -U colors && colors
setopt PROMPT_SUBST
PROMPT='%{$fg_bold[cyan]%}➜%{$reset_color%}  %{$fg_bold[green]%}%c%{$reset_color%} '

# Isolated history for the recording
HISTFILE=/tmp/bs-demo-after-history
HISTSIZE=1000
SAVEHIST=1000
setopt INC_APPEND_HISTORY

# Aliases installed by better-shell
alias lsx='eza -l -a --icons'

# FZF keybindings (Ctrl+R fuzzy history)
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Plugins installed via antigen by better-shell
[ -f ~/.antigen/bundles/agkozak/zsh-z/zsh-z.plugin.zsh ] \
  && source ~/.antigen/bundles/agkozak/zsh-z/zsh-z.plugin.zsh
[ -f ~/.antigen/bundles/zsh-users/zsh-autosuggestions/zsh-autosuggestions.zsh ] \
  && source ~/.antigen/bundles/zsh-users/zsh-autosuggestions/zsh-autosuggestions.zsh
[ -f ~/.antigen/bundles/zsh-users/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ] \
  && source ~/.antigen/bundles/zsh-users/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

autoload -Uz compinit && compinit -u 2>/dev/null
