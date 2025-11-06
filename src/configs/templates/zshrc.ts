/**
 * .zshrc template based on user's configuration
 */

export const zshrcTemplate = `# Path to Oh My Zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Theme
ZSH_THEME="robbyrussell"

# Keybindings
bindkey -e

# Antigen plugin manager
source $HOME/antigen.zsh
antigen init ~/.antigenrc

# ASDF version manager
. $HOME/.asdf/asdf.sh
# Optional: Load asdf completions
fpath=(\${ASDF_DATA_DIR:-$HOME/.asdf}/completions $fpath)

# Source Oh My Zsh
source $ZSH/oh-my-zsh.sh

# Aliases
alias lsx='eza -l -a --icons'
alias vim=nvim

# History configuration
HISTFILE=~/.zsh_history
HISTSIZE=500000
SAVEHIST=500000

# FZF integration
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Carapace auto-completion (if installed)
if command -v carapace &> /dev/null; then
  export CARAPACE_BRIDGES='zsh,fish,bash,inshellisense'
  zstyle ':completion:*' format $'\\e[2;37mCompleting %d\\e[m'
  source <(carapace _carapace)
fi

# Eza configuration
export EZA_CONFIG_DIR=~/.config/eza/tokyonight.yml

# Auto-completion
autoload -Uz compinit; compinit

# Word navigation with option/alt key (macOS/Linux)
# Command + Left/Right for beginning/end of line
bindkey "^[[1;3D" beginning-of-line  # inside tmux
bindkey "^[[1;3C" end-of-line

bindkey "^[[1;9D" beginning-of-line  # outside tmux
bindkey "^[[1;9C" end-of-line

bindkey "\\eOH" beginning-of-line     # raw escape (Cmd+Left)
bindkey "\\eOF" end-of-line           # raw escape (Cmd+Right)
bindkey "^[b" backward-word
bindkey "^[f" forward-word

# Disable auto-update for Oh My Zsh
export DISABLE_AUTO_UPDATE=true
`;
