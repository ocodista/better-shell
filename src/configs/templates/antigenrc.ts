/**
 * .antigenrc template for Antigen plugin management
 */

export const antigenrcTemplate = `# Load bundles from the default repo (oh-my-zsh)
antigen bundle git
antigen bundle git-extras
antigen bundle command-not-found

# Load bundles from external repos
antigen bundle zsh-users/zsh-completions
antigen bundle zsh-users/zsh-autosuggestions
antigen bundle zsh-users/zsh-syntax-highlighting
antigen bundle agkozak/zsh-z

antigen apply
`;
