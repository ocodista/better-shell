/**
 * .tmux.conf template based on user's configuration
 */

export const tmuxConfTemplate = `# Default shell
set-option -g default-shell /usr/bin/zsh

# New window/pane in current path
bind c new-window -c "#{pane_current_path}"
bind '"' split-window -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"

# Smart pane switching with awareness of vim splits
bind -n C-h run "(tmux display-message -p '#{pane_current_command}' | grep -iq vim && tmux send-keys C-h) || tmux select-pane -L"
bind -n C-j run "(tmux display-message -p '#{pane_current_command}' | grep -iq vim && tmux send-keys C-j) || tmux select-pane -D"
bind -n C-k run "(tmux display-message -p '#{pane_current_command}' | grep -iq vim && tmux send-keys C-k) || tmux select-pane -U"
bind -n C-l run "(tmux display-message -p '#{pane_current_command}' | grep -iq vim && tmux send-keys C-l) || tmux select-pane -R"
bind -n "C-\\\\" run "(tmux display-message -p '#{pane_current_command}' | grep -iq vim && tmux send-keys 'C-\\\\') || tmux select-pane -l"

# Performance tweaks
set -sg escape-time 50
set-option -g focus-event on

# Tmux plugins
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# Plugin settings
set -g @ressurect-capture-pane-contents 'on'
set -g @continuum-boot 'on'
set -g @continuum-restore 'on'

# Mouse support
set -g mouse on

# xterm keys
set -g xterm-keys on

# Initialize TPM (keep this at the bottom)
run '~/.tmux/plugins/tpm/tpm'
`;
