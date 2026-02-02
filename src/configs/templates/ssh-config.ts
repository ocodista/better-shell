/**
 * ~/.ssh/config template with sensible defaults
 */

export const sshConfigTemplate = `# Keep connections alive (prevents drops on idle sessions)
ServerAliveInterval 60
ServerAliveCountMax 3

# Reuse connections for faster subsequent SSH to same host
Host *
    AddKeysToAgent yes
    IdentitiesOnly yes
    HashKnownHosts yes
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h-%p
    ControlPersist 600
`;
