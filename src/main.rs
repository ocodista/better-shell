use dialoguer::{Confirm, Input, MultiSelect, Select, theme::ColorfulTheme};
use std::env;
use std::fs;
use std::io::{self, IsTerminal};
use std::path::Path;
use std::process::{Command, ExitCode, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

const VERSION: &str = "1.0.0";

#[derive(Debug, Clone, Copy)]
struct Features {
    fonts: bool,
    fzf: bool,
    eza: bool,
    carapace: bool,
    mise: bool,
    node: bool,
    tmux: bool,
}

impl Default for Features {
    fn default() -> Self {
        Self {
            fonts: true,
            fzf: true,
            eza: true,
            carapace: true,
            mise: true,
            node: true,
            tmux: true,
        }
    }
}

#[derive(Debug, Clone, Copy, Default)]
struct InstallOptions {
    skip_backup: bool,
    dry_run: bool,
    minimal: bool,
    features: Features,
}

#[derive(Debug)]
struct BackupResult {
    success: bool,
    backup_dir: Option<String>,
    files: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum InstallProfile {
    Full,
    Minimal,
    Custom,
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.is_empty() {
        return exit_bool(run_control_center());
    }

    match args[0].as_str() {
        "--help" | "-h" | "help" => {
            print_help();
            ExitCode::SUCCESS
        }
        "--version" | "-v" | "version" => {
            println!("better-shell v{VERSION}");
            ExitCode::SUCCESS
        }
        "manage" => exit_bool(run_control_center()),
        "configure" => exit_bool(run_install_wizard(Some(InstallProfile::Custom), true)),
        "install" => run_install_command(&args[1..]),
        "check" => exit_bool(check()),
        "backup" => exit_bool(backup(args.get(1).map(String::as_str))),
        "restore" => match args.get(1) {
            Some(path) => exit_bool(restore(path)),
            None => {
                error("Backup path is required");
                info("Usage: better-shell restore <backup-path>");
                ExitCode::from(1)
            }
        },
        command => {
            error(&format!("Unknown command: {command}"));
            info("Run `better-shell --help` for usage information");
            ExitCode::from(1)
        }
    }
}

fn exit_bool(success: bool) -> ExitCode {
    if success {
        ExitCode::SUCCESS
    } else {
        ExitCode::from(1)
    }
}

fn run_install_command(args: &[String]) -> ExitCode {
    if args.iter().any(|arg| arg == "--interactive") {
        let profile = if args.iter().any(|arg| arg == "--minimal") {
            Some(InstallProfile::Minimal)
        } else {
            None
        };
        return exit_bool(run_install_wizard(profile, true));
    }

    match parse_install_options(args) {
        Ok(options) => exit_bool(install(options)),
        Err(message) => {
            error(&message);
            ExitCode::from(1)
        }
    }
}

fn parse_install_options(args: &[String]) -> Result<InstallOptions, String> {
    let mut options = InstallOptions::default();

    for arg in args {
        match arg.as_str() {
            "--dry-run" => options.dry_run = true,
            "--skip-backup" => options.skip_backup = true,
            "--minimal" => {
                options.minimal = true;
                options.features.fonts = false;
                options.features.carapace = false;
            }
            "--no-fonts" => options.features.fonts = false,
            "--no-fzf" => options.features.fzf = false,
            "--no-eza" => options.features.eza = false,
            "--no-carapace" => options.features.carapace = false,
            "--no-mise" => {
                options.features.mise = false;
                options.features.node = false;
            }
            "--no-node" => options.features.node = false,
            "--no-tmux" => options.features.tmux = false,
            unknown => return Err(format!("Unknown install option: {unknown}")),
        }
    }

    Ok(options)
}

fn print_help() {
    println!(
        "\n\x1b[1mbetter-shell\x1b[0m v{VERSION}\n\n\
A terminal setup manager for zsh, completions, fuzzy search, mise, tmux, fonts, and config backups.\n\n\
\x1b[1mUSAGE:\x1b[0m\n  better-shell [command] [options]\n\n\
\x1b[1mCOMMANDS:\x1b[0m\n  manage                Open the interactive control center\n  configure             Customize this terminal with a guided TUI\n  install               Install and configure everything\n  check                 Check system requirements and installed tools\n  backup [destination]  Backup existing configurations\n  restore <backup-path> Restore from backup\n\n\
\x1b[1mOPTIONS:\x1b[0m\n  --interactive        Use the guided TUI installer\n  --skip-backup        Skip configuration backup\n  --dry-run            Preview installation without making changes\n  --minimal            Skip optional tools such as fonts and carapace\n  --no-fonts           Skip FiraCode Nerd Font\n  --no-fzf             Skip fzf\n  --no-eza             Skip eza\n  --no-carapace        Skip carapace completions\n  --no-mise            Skip mise and Node.js setup\n  --no-node            Skip Node.js LTS setup\n  --no-tmux            Skip tmux and tmux plugins\n  --version, -v        Show version\n  --help, -h           Show this help\n\n\
\x1b[1mEXAMPLES:\x1b[0m\n  better-shell\n  better-shell configure\n  better-shell install --interactive\n  better-shell install --dry-run\n  better-shell install --minimal\n  better-shell check\n  better-shell backup\n  better-shell restore ~/.better-shell-backups/2024-01-01-120000\n"
    );
}

fn run_control_center() -> bool {
    if !is_interactive() {
        info("Interactive control center requires a TTY. Run `better-shell --help` for commands.");
        return true;
    }

    intro();
    let theme = ColorfulTheme::default();

    loop {
        let items = [
            "Install or update Better Shell",
            "Customize this terminal",
            "Run health check",
            "Back up configs",
            "Restore configs",
            "Show configuration guide",
            "Exit",
        ];

        let selection = Select::with_theme(&theme)
            .with_prompt("What do you want to do?")
            .items(&items)
            .default(0)
            .interact_opt();

        let Some(selection) = unwrap_prompt(selection) else {
            cancel();
            return false;
        };

        match selection {
            0 => return run_install_wizard(Some(InstallProfile::Full), false),
            1 => return run_install_wizard(Some(InstallProfile::Custom), false),
            2 => {
                check();
            }
            3 => {
                backup(None);
            }
            4 => {
                if !run_restore_prompt() {
                    return false;
                }
            }
            5 => show_configuration_guide(),
            6 => {
                println!("Bye.");
                return true;
            }
            _ => unreachable!(),
        }
    }
}

fn run_install_wizard(initial_profile: Option<InstallProfile>, show_header: bool) -> bool {
    if !is_interactive() {
        error(
            "Interactive setup requires a TTY. Run `better-shell install` for non-interactive installs.",
        );
        return false;
    }

    if show_header {
        intro();
    }

    let theme = ColorfulTheme::default();
    let profile = match initial_profile {
        Some(profile) => profile,
        None => {
            let items = [
                "Full setup — zsh, plugins, fzf, eza, carapace, mise, Node.js, tmux, font",
                "Minimal setup — core shell setup without optional font or carapace",
                "Custom setup — choose each feature",
            ];
            match unwrap_prompt(
                Select::with_theme(&theme)
                    .with_prompt("How do you want to set up this terminal?")
                    .items(&items)
                    .default(0)
                    .interact_opt(),
            ) {
                Some(0) => InstallProfile::Full,
                Some(1) => InstallProfile::Minimal,
                Some(2) => InstallProfile::Custom,
                _ => {
                    cancel();
                    return false;
                }
            }
        }
    };

    let should_backup = match unwrap_prompt(
        Confirm::with_theme(&theme)
            .with_prompt("Back up existing shell configs before writing new ones?")
            .default(true)
            .interact_opt(),
    ) {
        Some(value) => value,
        None => {
            cancel();
            return false;
        }
    };

    let dry_run = match unwrap_prompt(
        Confirm::with_theme(&theme)
            .with_prompt("Preview the plan without changing files?")
            .default(false)
            .interact_opt(),
    ) {
        Some(value) => value,
        None => {
            cancel();
            return false;
        }
    };

    let features = if profile == InstallProfile::Custom {
        match ask_custom_features(&theme) {
            Some(features) => features,
            None => {
                cancel();
                return false;
            }
        }
    } else {
        let mut features = Features::default();
        if profile == InstallProfile::Minimal {
            features.fonts = false;
            features.carapace = false;
        }
        features
    };

    let options = InstallOptions {
        skip_backup: !should_backup,
        dry_run,
        minimal: profile == InstallProfile::Minimal,
        features,
    };

    println!();
    header("Install plan");
    println!("Profile: {:?}", profile);
    println!(
        "Safety: {}",
        if options.skip_backup {
            "No backup"
        } else {
            "Backup enabled"
        }
    );
    println!(
        "Mode: {}",
        if options.dry_run {
            "Preview only"
        } else {
            "Install changes"
        }
    );

    let proceed = match unwrap_prompt(
        Confirm::with_theme(&theme)
            .with_prompt(if dry_run {
                "Show this preview?"
            } else {
                "Start installation?"
            })
            .default(true)
            .interact_opt(),
    ) {
        Some(value) => value,
        None => {
            cancel();
            return false;
        }
    };

    if !proceed {
        cancel();
        return false;
    }

    install(options)
}

fn ask_custom_features(theme: &ColorfulTheme) -> Option<Features> {
    let items = [
        "fzf history search — Ctrl+R fuzzy history",
        "eza file listing — modern ls with icons",
        "carapace completions — smart completions for many CLIs",
        "mise + Node.js LTS — modern replacement for asdf",
        "tmux sessions — panes, persisted sessions, plugins",
        "FiraCode Nerd Font — icons and ligatures",
    ];

    let selection = unwrap_prompt(
        MultiSelect::with_theme(theme)
            .with_prompt("Choose what Better Shell should manage")
            .items(&items)
            .defaults(&[true, true, true, true, true, true])
            .interact_opt(),
    )?;

    if selection.is_empty() {
        warn("No features selected; keeping only core zsh setup.");
    }

    Some(Features {
        fzf: selection.contains(&0),
        eza: selection.contains(&1),
        carapace: selection.contains(&2),
        mise: selection.contains(&3),
        node: selection.contains(&3),
        tmux: selection.contains(&4),
        fonts: selection.contains(&5),
    })
}

fn run_restore_prompt() -> bool {
    let theme = ColorfulTheme::default();
    let backup_path = match Input::<String>::with_theme(&theme)
        .with_prompt("Backup path to restore")
        .interact_text()
    {
        Ok(value) => value,
        Err(error) => {
            self_error(&format!("Prompt failed: {error}"));
            cancel();
            return false;
        }
    };

    if backup_path.trim().is_empty() {
        error("Backup path is required");
        return false;
    }

    restore(backup_path.trim())
}

fn show_configuration_guide() {
    header("Configuration guide");
    println!("Config files:");
    println!("  • ~/.zshrc");
    println!("  • ~/.antigenrc");
    println!("  • ~/.tmux.conf");
    println!("  • ~/.config/eza/tokyonight.yml");
    println!();
    println!("Useful commands:");
    println!("  • better-shell check");
    println!("  • better-shell install --dry-run");
    println!("  • better-shell backup");
    println!("  • better-shell restore <backup-path>");
}

fn install(options: InstallOptions) -> bool {
    if current_platform() == "windows" {
        error("The better-shell CLI installer manages macOS and Linux shell setups.");
        info("For Windows, run: irm https://shell.ocodista.com/install.ps1 | iex");
        return false;
    }

    if options.dry_run {
        warn("DRY RUN MODE - No changes will be made");
        println!();
    }

    header("🚀 Better Shell Installation");
    println!();

    if is_root() {
        if let Ok(sudo_user) = env::var("SUDO_USER") {
            info(&format!("Installing for user: {sudo_user}"));
        } else {
            warn("Running as root. Config files will be installed to /root.");
            info("To install for a specific user, run: sudo -u username better-shell install");
        }
        println!();
    }

    info(&format!(
        "Platform: {} ({})",
        current_platform(),
        current_arch()
    ));
    info(&format!("Home: {}", home_dir()));
    println!();

    if options.dry_run {
        print_dry_run_steps(&options);
        return true;
    }

    if !options.skip_backup {
        header("Step 1: Backup");
        let backup_result = backup_configs(false);
        if !backup_result.success {
            error("Backup failed. Aborting installation.");
            return false;
        }
        println!();
    }

    header("Step 2: Installing Base Tools");
    if !install_zsh() {
        error("Failed to install zsh. Aborting.");
        return false;
    }
    if !install_oh_my_zsh() {
        error("Failed to install Oh My Zsh. Aborting.");
        return false;
    }
    if !install_antigen() {
        error("Failed to install Antigen. Aborting.");
        return false;
    }
    if !install_zsh_plugins() {
        error("Failed to install zsh plugins. Aborting.");
        return false;
    }
    println!();

    if options.features.fonts {
        header("Step 3: Installing Fonts");
        install_fira_code();
        println!();
    }

    header("Step 4: Installing CLI Tools");
    if options.features.fzf && !install_fzf() {
        warn("Failed to install fzf, continuing...");
    }
    if options.features.eza && !install_eza() {
        warn("Failed to install eza, continuing...");
    }
    if options.features.carapace {
        install_carapace();
    }
    println!();

    if options.features.mise {
        header("Step 5: Installing Version Manager");
        if !install_mise() {
            error("Failed to install mise. Aborting.");
            return false;
        }
        if options.features.node && !install_node_with_mise() {
            warn("Failed to install Node.js, continuing...");
        }
        println!();
    }

    if options.features.tmux {
        header("Step 6: Installing Terminal Multiplexer");
        if !install_tmux() {
            warn("Failed to install tmux, continuing...");
        } else {
            install_tpm();
        }
        println!();
    }

    header("Step 7: Writing Configuration Files");
    if !write_configs(options.features.tmux, options.features.eza) {
        error("Failed to write configuration files. Aborting.");
        return false;
    }
    println!();

    header("Step 8: Finalizing Installation");
    set_zsh_as_default();
    println!();

    header("✨ Installation Complete!");
    success("Your terminal is now supercharged!");
    println!();
    info("Next steps:");
    let mut next_step = 1;
    dim(&format!(
        "{next_step}. Restart your terminal or run: exec zsh"
    ));
    next_step += 1;
    if options.features.tmux {
        dim(&format!(
            "{next_step}. Open tmux and run \"prefix + I\" to install tmux plugins"
        ));
        next_step += 1;
    }
    if options.features.node && package_manager() != "apk" {
        dim(&format!(
            "{next_step}. Verify Node.js installation: node --version"
        ));
        next_step += 1;
    }
    if options.features.fonts {
        dim(&format!(
            "{next_step}. Configure your terminal to use FiraCode Nerd Font"
        ));
    }
    println!();

    info("Installed features:");
    dim("✓ Auto-suggestions (type and see suggestions)");
    dim("✓ Syntax highlighting (colored commands)");
    if options.features.fzf {
        dim("✓ Fast history search (Ctrl+R)");
    }
    dim("✓ Smart directory jumping (z <directory>)");
    if options.features.eza {
        dim("✓ Modern ls with icons (lsx alias)");
    }
    if options.features.mise {
        dim("✓ Tool version management (mise)");
    }
    if options.features.tmux {
        dim("✓ Terminal multiplexing (tmux)");
    }
    println!();

    true
}

fn print_dry_run_steps(options: &InstallOptions) {
    info("Installation steps that would be performed:");
    let steps = dry_run_steps(options);
    for (index, step) in steps.iter().enumerate() {
        dim(&format!("{}. {step}", index + 1));
    }
    println!();
    info("Run without --dry-run to perform installation");
}

fn dry_run_steps(options: &InstallOptions) -> Vec<&'static str> {
    let mut steps = Vec::new();
    if !options.skip_backup {
        steps.push("Backup existing configurations");
    }
    steps.push("Install zsh");
    steps.push("Install Oh My Zsh");
    steps.push("Install Antigen");
    steps.push("Install zsh plugins");
    if options.features.fonts {
        steps.push("Install FiraCode Nerd Font");
    }
    if options.features.fzf {
        steps.push("Install fzf");
    }
    if options.features.eza {
        steps.push("Install eza");
    }
    if options.features.carapace {
        steps.push("Install carapace");
    }
    if options.features.mise {
        steps.push("Install mise");
    }
    if options.features.mise && options.features.node {
        steps.push("Install Node.js LTS via mise");
    }
    if options.features.tmux {
        steps.push("Install tmux");
        steps.push("Install TPM");
    }
    steps.push("Write configuration files");
    steps.push("Set zsh as default shell");
    steps
}

fn check() -> bool {
    header("System Requirements Check");
    println!();

    let mut all_good = true;

    step("Checking platform...");
    if current_platform() == "unknown" {
        error("Unsupported platform");
        all_good = false;
    } else {
        success(&format!(
            "Platform: {} ({})",
            current_platform(),
            current_arch()
        ));
    }

    step("Checking internet connection...");
    if shell_exec(
        "curl -fsSL -I https://google.com >/dev/null",
        true,
        true,
        &[],
    ) {
        success("Internet connection available");
    } else {
        error("No internet connection");
        all_good = false;
    }

    step("Checking git...");
    if command_exists("git") {
        success(
            &command_version("git", "--version").unwrap_or_else(|| "git installed".to_string()),
        );
    } else {
        warn("git not found (required for installation)");
        all_good = false;
    }

    step("Checking curl...");
    if command_exists("curl") {
        success("curl is available");
    } else {
        warn("curl not found (recommended)");
    }

    step("Checking package manager...");
    let pm = package_manager();
    if pm == "unknown" {
        warn("No known package manager found");
    } else {
        success(&format!("Package manager: {pm}"));
    }

    step("Checking disk space...");
    if shell_exec("df -h ~ >/dev/null", true, true, &[]) {
        success("Sufficient disk space available");
    }

    println!();
    header("Existing Installations");
    println!();

    for (tool, version_arg) in [
        ("zsh", "--version"),
        ("tmux", "-V"),
        ("fzf", "--version"),
        ("eza", "--version"),
        ("carapace", "--version"),
        ("mise", "--version"),
        ("node", "--version"),
        ("npm", "--version"),
    ] {
        if command_exists(tool) {
            let version =
                command_version(tool, version_arg).unwrap_or_else(|| "installed".to_string());
            info(&format!("{tool}: {version}"));
        } else {
            dim(&format!("{tool}: not installed"));
        }
    }

    if Path::new(&format!("{}/.oh-my-zsh/oh-my-zsh.sh", home_dir())).exists() {
        info("oh-my-zsh: installed");
    } else {
        dim("oh-my-zsh: not installed");
    }

    if Path::new(&format!("{}/antigen.zsh", home_dir())).exists() {
        info("antigen: installed");
    } else {
        dim("antigen: not installed");
    }

    println!();
    if all_good {
        success("System is ready for installation!");
    } else {
        error("Some requirements are not met");
    }

    all_good
}

fn backup(destination: Option<&str>) -> bool {
    header("Backing Up Configurations");
    println!();

    if let Some(destination) = destination {
        info(&format!("Custom backup location: {destination}"));
        warn("Custom destination not yet implemented, using default location");
    }

    let result = backup_configs(false);
    if result.success {
        if result.files.is_empty() {
            info("No configuration files to backup");
        } else if let Some(backup_dir) = result.backup_dir {
            println!();
            success(&format!("Backup completed: {backup_dir}"));
            info(&format!("Backed up {} files:", result.files.len()));
            for file in result.files {
                dim(&format!("  - {file}"));
            }
        }
        true
    } else {
        error("Backup failed");
        false
    }
}

fn restore(backup_path: &str) -> bool {
    header("Restoring Configurations");
    println!();
    info(&format!("Restoring from: {backup_path}"));

    let files = [
        ".zshrc",
        ".antigenrc",
        ".tmux.conf",
        ".config/eza/tokyonight.yml",
    ];

    let home = home_dir();
    for file in files {
        let backup_file = format!("{backup_path}/{file}");
        let target_file = format!("{home}/{file}");
        if Path::new(&backup_file).exists() {
            if let Some(parent) = Path::new(&target_file).parent()
                && let Err(error) = fs::create_dir_all(parent)
            {
                self_error(&format!("Failed to create {}: {error}", parent.display()));
                return false;
            }
            if let Err(error) = fs::copy(&backup_file, &target_file) {
                self_error(&format!("Failed to restore {file}: {error}"));
                return false;
            }
            success(&format!("Restored {file}"));
        }
    }

    success("Configurations restored successfully");
    info("Please restart your shell or run: source ~/.zshrc");
    true
}

fn backup_configs(skip_backup: bool) -> BackupResult {
    if skip_backup {
        info("Skipping backup (--skip-backup flag)");
        return BackupResult {
            success: true,
            backup_dir: None,
            files: Vec::new(),
        };
    }

    let home = home_dir();
    let backup_dir = backup_dir();
    let files_to_backup = [
        format!("{home}/.zshrc"),
        format!("{home}/.antigenrc"),
        format!("{home}/.tmux.conf"),
        format!("{home}/.config/eza/tokyonight.yml"),
    ];

    let mut backed_up = Vec::new();
    if let Err(error) = fs::create_dir_all(&backup_dir) {
        self_error(&format!("Failed to create backup dir: {error}"));
        return BackupResult {
            success: false,
            backup_dir: None,
            files: Vec::new(),
        };
    }

    for file in files_to_backup {
        if Path::new(&file).exists() {
            let backup_path = file.replacen(&home, &backup_dir, 1);
            if let Some(parent) = Path::new(&backup_path).parent()
                && let Err(error) = fs::create_dir_all(parent)
            {
                self_error(&format!("Failed to create {}: {error}", parent.display()));
                return BackupResult {
                    success: false,
                    backup_dir: None,
                    files: Vec::new(),
                };
            }
            if let Err(error) = fs::copy(&file, &backup_path) {
                self_error(&format!("Failed to backup {file}: {error}"));
                return BackupResult {
                    success: false,
                    backup_dir: None,
                    files: Vec::new(),
                };
            }
            backed_up.push(file);
        }
    }

    if backed_up.is_empty() {
        info("No existing config files to backup");
    } else {
        success(&format!(
            "Backed up {} files to {backup_dir}",
            backed_up.len()
        ));
    }

    BackupResult {
        success: true,
        backup_dir: Some(backup_dir),
        files: backed_up,
    }
}

fn backup_dir() -> String {
    let timestamp = command_output("date +%Y-%m-%d-%H%M%S", &[]).unwrap_or_else(|| {
        let seconds = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        seconds.to_string()
    });
    format!("{}/.better-shell-backups/{}", home_dir(), timestamp.trim())
}

fn install_zsh() -> bool {
    step("Installing zsh...");
    if command_exists("zsh") {
        info("zsh is already installed");
        return true;
    }
    if current_platform() == "macos" || current_platform() == "linux" {
        return install_packages(&["zsh"], false, false);
    }
    error("Unsupported platform for zsh installation");
    false
}

fn set_zsh_as_default() -> bool {
    step("Setting zsh as default shell...");
    let Some(zsh_path) = command_output("command -v zsh", &[]) else {
        error("Could not find zsh installation");
        return false;
    };
    let zsh_path = zsh_path.trim();
    if zsh_path.is_empty() {
        error("Could not find zsh installation");
        return false;
    }

    let shells = command_output("cat /etc/shells", &[]).unwrap_or_default();
    if !shells.contains(zsh_path) {
        info("Adding zsh to /etc/shells...");
        let tee = if is_root() { "tee" } else { "sudo tee" };
        shell_exec(
            &format!(
                "echo {} | {tee} -a /etc/shells >/dev/null",
                shell_quote(zsh_path)
            ),
            true,
            true,
            &[],
        );
    }

    let command = if is_root() {
        if let Ok(sudo_user) = env::var("SUDO_USER") {
            if safe_user_name(&sudo_user) {
                format!(
                    "chsh -s {} {}",
                    shell_quote(zsh_path),
                    shell_quote(&sudo_user)
                )
            } else {
                format!("chsh -s {}", shell_quote(zsh_path))
            }
        } else {
            format!("chsh -s {}", shell_quote(zsh_path))
        }
    } else {
        format!("chsh -s {}", shell_quote(zsh_path))
    };

    if shell_exec(&command, false, true, &[]) {
        success("zsh set as default shell");
        true
    } else {
        warn("Could not set zsh as default shell. You may need to run: chsh -s $(command -v zsh)");
        false
    }
}

fn install_oh_my_zsh() -> bool {
    step("Installing Oh My Zsh...");
    let ohmyzsh = format!("{}/.oh-my-zsh/oh-my-zsh.sh", home_dir());
    if Path::new(&ohmyzsh).exists() {
        info("Oh My Zsh is already installed");
        return true;
    }

    let script_path = "/tmp/install-ohmyzsh.sh";
    if !download(
        "https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh",
        script_path,
    ) {
        error("Failed to download Oh My Zsh installer");
        return false;
    }

    if shell_exec(
        &format!(
            "RUNZSH=no CHSH=no sh {} --unattended",
            shell_quote(script_path)
        ),
        false,
        false,
        &[("HOME", &home_dir())],
    ) {
        success("Oh My Zsh installed successfully");
        true
    } else {
        error("Failed to install Oh My Zsh");
        false
    }
}

fn install_antigen() -> bool {
    step("Installing Antigen...");
    let antigen_path = format!("{}/antigen.zsh", home_dir());
    if Path::new(&antigen_path).exists() {
        info("Antigen is already installed");
        return true;
    }

    if download(
        "https://raw.githubusercontent.com/zsh-users/antigen/master/bin/antigen.zsh",
        &antigen_path,
    ) {
        success("Antigen installed successfully");
        true
    } else {
        error("Failed to download Antigen");
        false
    }
}

fn install_zsh_plugins() -> bool {
    step("Installing zsh plugins...");
    let plugin_dir = format!("{}/.zsh/plugins", home_dir());
    if let Err(error) = fs::create_dir_all(&plugin_dir) {
        self_error(&format!("Failed to create zsh plugin dir: {error}"));
        return false;
    }

    let plugins = [
        (
            "zsh-autosuggestions",
            "https://github.com/zsh-users/zsh-autosuggestions.git",
        ),
        (
            "zsh-syntax-highlighting",
            "https://github.com/zsh-users/zsh-syntax-highlighting.git",
        ),
        (
            "zsh-completions",
            "https://github.com/zsh-users/zsh-completions.git",
        ),
        ("zsh-z", "https://github.com/agkozak/zsh-z.git"),
    ];

    for (name, url) in plugins {
        let destination = format!("{plugin_dir}/{name}");
        if Path::new(&destination).exists() {
            info(&format!("{name} is already installed"));
            continue;
        }

        if !shell_exec(
            &format!(
                "git clone --depth 1 {} {}",
                shell_quote(url),
                shell_quote(&destination)
            ),
            false,
            false,
            &[("HOME", &home_dir())],
        ) {
            return false;
        }
    }

    success("zsh plugins installed successfully");
    true
}

fn install_fzf() -> bool {
    step("Installing fzf...");
    if command_exists("fzf") {
        info("fzf is already installed");
        return true;
    }

    if current_platform() == "macos" {
        if !shell_exec("brew install fzf", false, false, &[]) {
            return false;
        }
        shell_exec(
            "$(brew --prefix)/opt/fzf/install --all --no-bash --no-fish",
            false,
            true,
            &[],
        );
        success("fzf installed successfully");
        true
    } else if current_platform() == "linux" {
        let fzf_dir = format!("{}/.fzf", home_dir());
        if Path::new(&format!("{fzf_dir}/bin/fzf")).exists() {
            info("fzf is already installed");
            return true;
        }
        if !shell_exec(
            &format!(
                "git clone --depth 1 https://github.com/junegunn/fzf.git {}",
                shell_quote(&fzf_dir)
            ),
            false,
            false,
            &[("HOME", &home_dir())],
        ) {
            return false;
        }
        if shell_exec(
            &format!(
                "{}/install --all --no-bash --no-fish",
                shell_quote(&fzf_dir)
            ),
            false,
            false,
            &[("HOME", &home_dir())],
        ) {
            success("fzf installed successfully");
            true
        } else {
            false
        }
    } else {
        false
    }
}

fn install_eza() -> bool {
    step("Installing eza...");
    if command_exists("eza") {
        info("eza is already installed");
        return true;
    }

    if current_platform() == "macos" {
        if install_packages(&["eza"], false, false) {
            success("eza installed successfully");
            return true;
        }
    } else if current_platform() == "linux" {
        if package_manager() == "apt" {
            shell_exec("apt-get update", true, true, &[]);
            if shell_exec("apt-get install -y eza", false, true, &[]) {
                success("eza installed successfully");
                return true;
            }
            info("eza not in apt, trying alternative installation...");
            let arch = if current_arch() == "arm64" {
                "aarch64"
            } else {
                "x86_64"
            };
            let url = format!(
                "https://github.com/eza-community/eza/releases/latest/download/eza_{arch}-unknown-linux-gnu.tar.gz"
            );
            if !download(&url, "/tmp/eza.tar.gz") {
                error("Failed to download eza");
                return false;
            }
            shell_exec("mkdir -p /tmp/eza", true, true, &[]);
            if !shell_exec("tar xzf /tmp/eza.tar.gz -C /tmp/eza", false, false, &[]) {
                return false;
            }
            if shell_exec("mv /tmp/eza/eza /usr/local/bin/", false, false, &[]) {
                success("eza installed successfully");
                return true;
            }
        } else if install_packages(&["eza"], false, false) {
            success("eza installed successfully");
            return true;
        }
    }

    error("Failed to install eza");
    false
}

fn install_carapace() -> bool {
    step("Installing carapace...");
    if command_exists("carapace") {
        info("carapace is already installed");
        return true;
    }

    if current_platform() == "macos" {
        if shell_exec("brew install carapace", false, true, &[]) {
            success("carapace installed successfully");
            return true;
        }
    } else if current_platform() == "linux" {
        if package_manager() == "apt" {
            info("Trying to install carapace via apt (fury.io)...");
            if shell_exec(
                "echo 'deb [trusted=yes] https://apt.fury.io/rsteube/ /' > /etc/apt/sources.list.d/fury.list",
                true,
                true,
                &[],
            ) {
                shell_exec("apt-get update", true, true, &[]);
                if shell_exec("apt-get install -y carapace-bin", true, true, &[])
                    && command_exists("carapace")
                {
                    success("carapace installed successfully");
                    return true;
                }
            }
        }

        info("Downloading carapace from GitHub releases...");
        let arch = if current_arch() == "arm64" {
            "arm64"
        } else {
            "amd64"
        };
        let version = command_output("curl -sL https://api.github.com/repos/carapace-sh/carapace-bin/releases/latest | grep -o '\"tag_name\": \"[^\"]*\"' | cut -d'\"' -f4", &[])
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| "v1.0.6".to_string());
        let url = format!(
            "https://github.com/carapace-sh/carapace-bin/releases/download/{}/carapace-bin_linux_{arch}.tar.gz",
            version.trim()
        );
        if !download(&url, "/tmp/carapace.tar.gz") {
            warn("Failed to download carapace, skipping...");
            return true;
        }
        shell_exec("mkdir -p /tmp/carapace", true, true, &[]);
        if !shell_exec(
            "tar xzf /tmp/carapace.tar.gz -C /tmp/carapace",
            true,
            true,
            &[],
        ) {
            warn("Failed to extract carapace, skipping...");
            return true;
        }
        if shell_exec("mv /tmp/carapace/carapace /usr/local/bin/", true, true, &[])
            && command_exists("carapace")
        {
            success("carapace installed successfully");
            return true;
        }
    }

    warn("Failed to install carapace, skipping...");
    true
}

fn install_mise() -> bool {
    step("Installing mise...");
    if get_mise_command().is_some() {
        info("mise is already installed");
        return true;
    }

    if current_platform() == "macos" && shell_exec("brew install mise", false, true, &[]) {
        success("mise installed successfully");
        return true;
    }

    if current_platform() == "linux" {
        let pm = package_manager();
        if pm != "apt"
            && pm != "apk"
            && install_packages(&["mise"], false, true)
            && get_mise_command().is_some()
        {
            success("mise installed successfully");
            return true;
        }

        info("Installing mise with mise.run...");
        let install_path = format!("{}/.local/bin/mise", home_dir());
        let command = format!(
            "curl -fsSL https://mise.run | HOME={} MISE_INSTALL_PATH={} MISE_INSTALL_HELP=0 sh",
            shell_quote(&home_dir()),
            shell_quote(&install_path)
        );
        if shell_exec(&command, false, false, &[]) && Path::new(&install_path).exists() {
            fix_mise_ownership();
            success("mise installed successfully");
            return true;
        }
    }

    error("Failed to install mise");
    false
}

fn install_node_with_mise() -> bool {
    step("Installing Node.js LTS with mise...");
    if package_manager() == "apk" {
        warn(
            "Skipping Node.js LTS on Alpine: official Node.js LTS builds are glibc-based and mise may compile from source.",
        );
        info(
            "Use `apk add nodejs npm` on Alpine, or run Better Shell on a glibc distro for mise-managed Node.js.",
        );
        return true;
    }

    let Some(mise_command) = get_mise_command() else {
        error("mise is not installed");
        return false;
    };

    let path = format!(
        "{}/.local/bin:{}",
        home_dir(),
        env::var("PATH").unwrap_or_default()
    );
    if shell_exec(
        &format!("{} use --global node@lts", shell_quote(&mise_command)),
        false,
        false,
        &[("HOME", &home_dir()), ("PATH", &path)],
    ) {
        fix_mise_ownership();
        success("Node.js LTS installed and set as global default");
        true
    } else {
        error("Failed to install Node.js with mise");
        false
    }
}

fn get_mise_command() -> Option<String> {
    if command_exists("mise") {
        return Some("mise".to_string());
    }
    let mise_path = format!("{}/.local/bin/mise", home_dir());
    if Path::new(&mise_path).exists() {
        return Some(mise_path);
    }
    None
}

fn fix_mise_ownership() {
    let Ok(sudo_user) = env::var("SUDO_USER") else {
        return;
    };
    if !safe_user_name(&sudo_user) {
        return;
    }
    let command = format!(
        "chown -R {} {} {}/.config/mise",
        shell_quote(&sudo_user),
        shell_quote(&format!("{}/.local", home_dir())),
        shell_quote(&home_dir())
    );
    shell_exec(&command, true, true, &[]);
}

fn install_fira_code() -> bool {
    step("Installing FiraCode Nerd Font...");
    if current_platform() == "macos" {
        if shell_exec("brew list --cask font-fira-code-nerd-font", true, true, &[]) {
            info("FiraCode Nerd Font is already installed");
            return true;
        }
        shell_exec("brew tap homebrew/cask-fonts", false, true, &[]);
        if shell_exec(
            "brew install --cask font-fira-code-nerd-font",
            false,
            true,
            &[],
        ) {
            success("FiraCode Nerd Font installed successfully");
            return true;
        }
        error("Failed to install FiraCode Nerd Font");
        return false;
    }

    if current_platform() == "linux" {
        let fira_dir = format!("{}/.local/share/fonts/FiraCode", home_dir());
        if Path::new(&format!("{fira_dir}/FiraCodeNerdFont-Regular.ttf")).exists() {
            info("FiraCode Nerd Font is already installed");
            return true;
        }
        install_packages(&["fontconfig", "unzip"], true, true);
        if let Err(error) = fs::create_dir_all(&fira_dir) {
            self_error(&format!("Failed to create font dir: {error}"));
            return false;
        }
        info("Downloading FiraCode Nerd Font...");
        if !download(
            "https://github.com/ryanoasis/nerd-fonts/releases/download/v3.1.1/FiraCode.zip",
            "/tmp/FiraCode.zip",
        ) {
            error("Failed to download FiraCode Nerd Font");
            return false;
        }
        info("Extracting fonts...");
        if !shell_exec(
            &format!("unzip -o /tmp/FiraCode.zip -d {}", shell_quote(&fira_dir)),
            true,
            false,
            &[],
        ) {
            error("Failed to extract fonts");
            return false;
        }
        info("Updating font cache...");
        shell_exec("fc-cache -fv", true, true, &[]);
        success("FiraCode Nerd Font installed successfully");
        return true;
    }

    warn("Font installation not supported on this platform");
    true
}

fn install_tmux() -> bool {
    step("Installing tmux...");
    if command_exists("tmux") {
        info("tmux is already installed");
        return true;
    }
    if current_platform() == "macos" || current_platform() == "linux" {
        return install_packages(&["tmux"], false, false);
    }
    error("Failed to install tmux");
    false
}

fn install_tpm() -> bool {
    step("Installing TPM (Tmux Plugin Manager)...");
    let tpm_dir = format!("{}/.tmux/plugins/tpm", home_dir());
    if Path::new(&format!("{tpm_dir}/tpm")).exists() {
        info("TPM is already installed");
        return true;
    }
    if shell_exec(
        &format!(
            "git clone https://github.com/tmux-plugins/tpm {}",
            shell_quote(&tpm_dir)
        ),
        false,
        true,
        &[("HOME", &home_dir())],
    ) {
        success("TPM installed successfully");
        info("Run \"prefix + I\" in tmux to install plugins");
        true
    } else {
        error("Failed to install TPM");
        false
    }
}

fn write_configs(include_tmux: bool, include_eza: bool) -> bool {
    let home = home_dir();
    if !write_file(&format!("{home}/.zshrc"), zshrc_template()) {
        return false;
    }
    success("Written ~/.zshrc");

    if !write_file(&format!("{home}/.antigenrc"), ANTIGENRC_TEMPLATE) {
        return false;
    }
    success("Written ~/.antigenrc");

    if include_tmux {
        let zsh_path =
            command_output("command -v zsh", &[]).unwrap_or_else(|| "/bin/zsh".to_string());
        if !write_file(
            &format!("{home}/.tmux.conf"),
            &tmux_template(zsh_path.trim()),
        ) {
            return false;
        }
        success("Written ~/.tmux.conf");
    }

    if include_eza {
        if !write_file(&format!("{home}/.config/eza/tokyonight.yml"), EZA_TEMPLATE) {
            return false;
        }
        success("Written ~/.config/eza/tokyonight.yml");
    }

    true
}

fn write_file(path: &str, content: &str) -> bool {
    let path_ref = Path::new(path);
    if let Some(parent) = path_ref.parent()
        && let Err(error) = fs::create_dir_all(parent)
    {
        self_error(&format!("Failed to create {}: {error}", parent.display()));
        return false;
    }
    if let Err(error) = fs::write(path_ref, content) {
        self_error(&format!("Failed to write {path}: {error}"));
        return false;
    }
    true
}

fn install_packages(packages: &[&str], silent: bool, ignore_error: bool) -> bool {
    let pm = package_manager();
    let package_list = packages.join(" ");
    let (update, install) = match pm.as_str() {
        "brew" => (None, format!("brew install {package_list}")),
        "apt" => (
            Some("apt-get update".to_string()),
            format!("apt-get install -y {package_list}"),
        ),
        "dnf" => (None, format!("dnf install -y {package_list}")),
        "pacman" => (None, format!("pacman -S --noconfirm {package_list}")),
        "apk" => (None, format!("apk add --no-cache {package_list}")),
        _ => return false,
    };

    if let Some(update) = update {
        shell_exec(&update, true, true, &[]);
    }
    shell_exec(&install, silent, ignore_error, &[])
}

fn package_manager() -> String {
    if current_platform() == "macos" {
        return "brew".to_string();
    }
    if current_platform() != "linux" {
        return "unknown".to_string();
    }
    for manager in ["apt-get", "dnf", "pacman", "apk"] {
        if command_exists(manager) {
            return match manager {
                "apt-get" => "apt",
                other => other,
            }
            .to_string();
        }
    }
    "unknown".to_string()
}

fn current_platform() -> &'static str {
    match env::consts::OS {
        "macos" => "macos",
        "linux" => "linux",
        "windows" => "windows",
        _ => "unknown",
    }
}

fn current_arch() -> &'static str {
    match env::consts::ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        _ => "unknown",
    }
}

fn home_dir() -> String {
    if let Ok(sudo_user) = env::var("SUDO_USER")
        && safe_user_name(&sudo_user)
        && let Some(home) = command_output(&format!("eval echo ~{}", shell_quote(&sudo_user)), &[])
    {
        let trimmed = home.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_else(|_| "~".to_string())
}

fn safe_user_name(value: &str) -> bool {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    if !(first.is_ascii_alphabetic() || first == '_') {
        return false;
    }
    chars.all(|char| char.is_ascii_alphanumeric() || char == '_' || char == '-' || char == '$')
}

fn is_root() -> bool {
    command_output("id -u", &[])
        .map(|value| value.trim() == "0")
        .unwrap_or(false)
}

fn is_interactive() -> bool {
    io::stdin().is_terminal() && io::stdout().is_terminal()
}

fn command_exists(command: &str) -> bool {
    if !command
        .chars()
        .all(|char| char.is_ascii_alphanumeric() || matches!(char, '.' | '_' | '+' | '/' | '-'))
    {
        return false;
    }
    shell_exec(
        &format!("command -v {} >/dev/null 2>&1", shell_quote(command)),
        true,
        true,
        &[],
    )
}

fn command_version(command: &str, version_arg: &str) -> Option<String> {
    let output = command_output(
        &format!(
            "{} {} 2>&1 | head -n1",
            shell_quote(command),
            shell_quote(version_arg)
        ),
        &[],
    )?;
    let trimmed = output.trim();
    if trimmed.is_empty() {
        Some("installed".to_string())
    } else {
        Some(trimmed.to_string())
    }
}

fn download(url: &str, destination: &str) -> bool {
    shell_exec(
        &format!(
            "curl -fsSL {} -o {}",
            shell_quote(url),
            shell_quote(destination)
        ),
        true,
        true,
        &[],
    )
}

fn command_output(command: &str, envs: &[(&str, &str)]) -> Option<String> {
    let mut cmd = Command::new("/bin/sh");
    cmd.arg("-c")
        .arg(command)
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    for (key, value) in envs {
        cmd.env(key, value);
    }
    let output = cmd.output().ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
}

fn shell_exec(command: &str, silent: bool, ignore_error: bool, envs: &[(&str, &str)]) -> bool {
    if !silent {
        dim(&format!("$ {command}"));
    }

    let mut cmd = Command::new("/bin/sh");
    cmd.arg("-c").arg(command);
    for (key, value) in envs {
        cmd.env(key, value);
    }

    if silent {
        cmd.stdout(Stdio::null()).stderr(Stdio::null());
    }

    match cmd.status() {
        Ok(status) if status.success() => true,
        Ok(_) => {
            if !ignore_error && !silent {
                error(&format!("Command failed: {command}"));
            }
            false
        }
        Err(err) => {
            if !ignore_error && !silent {
                error(&format!("Failed to execute {command}: {err}"));
            }
            false
        }
    }
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn unwrap_prompt<T>(result: dialoguer::Result<Option<T>>) -> Option<T> {
    match result {
        Ok(value) => value,
        Err(error) => {
            self_error(&format!("Prompt failed: {error}"));
            None
        }
    }
}

fn intro() {
    println!("\x1b[30;46m better-shell \x1b[0m \x1b[2mterminal control center\x1b[0m");
}

fn header(message: &str) {
    println!("\x1b[1m\x1b[36m{message}\x1b[0m");
}

fn step(message: &str) {
    println!("\x1b[36m▸\x1b[0m {message}");
}

fn info(message: &str) {
    println!("\x1b[34mℹ\x1b[0m {message}");
}

fn success(message: &str) {
    println!("\x1b[32m✓\x1b[0m {message}");
}

fn warn(message: &str) {
    println!("\x1b[33m⚠\x1b[0m {message}");
}

fn error(message: &str) {
    eprintln!("\x1b[31m✗\x1b[0m {message}");
}

fn self_error(message: &str) {
    error(message);
}

fn dim(message: &str) {
    println!("\x1b[2m{message}\x1b[0m");
}

fn cancel() {
    println!("Cancelled");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    #[test]
    fn minimal_install_disables_optional_tools() {
        let options = parse_install_options(&strings(&["--minimal", "--no-tmux"])).unwrap();

        assert!(options.minimal);
        assert!(!options.features.fonts);
        assert!(!options.features.carapace);
        assert!(!options.features.tmux);
        assert!(options.features.mise);
        assert!(options.features.node);
    }

    #[test]
    fn disabling_mise_also_disables_node() {
        let options = parse_install_options(&strings(&["--no-mise"])).unwrap();

        assert!(!options.features.mise);
        assert!(!options.features.node);
    }

    #[test]
    fn rejects_unknown_install_options() {
        let error = parse_install_options(&strings(&["--surprise"])).unwrap_err();

        assert_eq!(error, "Unknown install option: --surprise");
    }

    #[test]
    fn dry_run_plan_reflects_selected_features() {
        let options = parse_install_options(&strings(&["--minimal", "--no-tmux"])).unwrap();
        let steps = dry_run_steps(&options);

        assert!(steps.contains(&"Install zsh"));
        assert!(steps.contains(&"Install mise"));
        assert!(!steps.contains(&"Install FiraCode Nerd Font"));
        assert!(!steps.contains(&"Install carapace"));
        assert!(!steps.contains(&"Install tmux"));
    }

    #[test]
    fn shell_quote_escapes_single_quotes() {
        assert_eq!(shell_quote("it's fine"), "'it'\\''s fine'");
    }

    #[test]
    fn zshrc_loads_autosuggestions_with_completion_strategy() {
        let template = zshrc_template();

        assert!(template.contains("ZSH_AUTOSUGGEST_STRATEGY=(history completion)"));
        assert!(template.contains("zsh-autosuggestions.zsh"));
        assert!(template.contains("zsh-syntax-highlighting.zsh"));
    }
}

fn zshrc_template() -> &'static str {
    r#"# Path to Oh My Zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Theme
ZSH_THEME="robbyrussell"

# Disable auto-update for Oh My Zsh
export DISABLE_AUTO_UPDATE=true

# History configuration
HISTFILE=~/.zsh_history
HISTSIZE=500000
SAVEHIST=500000
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY
setopt SHARE_HISTORY
setopt HIST_IGNORE_DUPS

# Keybindings
bindkey -e

# Source Oh My Zsh
source $ZSH/oh-my-zsh.sh

# mise version manager
export PATH="$HOME/.local/bin:$PATH"
if command -v mise &> /dev/null; then
  eval "$(mise activate zsh)"
fi

# FZF integration
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Eza configuration
export EZA_CONFIG_DIR=~/.config/eza/tokyonight.yml

# Aliases
if command -v eza &> /dev/null; then
  alias lsx='eza -l -a --icons'
else
  alias lsx='ls -la'
fi

if command -v nvim &> /dev/null; then
  alias vim=nvim
fi

# zsh plugin configuration
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=8'
ZSH_AUTOSUGGEST_USE_ASYNC=true

# Extra completions must be in fpath before compinit
if [ -d "$HOME/.zsh/plugins/zsh-completions/src" ]; then
  fpath=("$HOME/.zsh/plugins/zsh-completions/src" $fpath)
fi

# Auto-completion
autoload -Uz compinit; compinit

# Directory jumping
[ -f "$HOME/.zsh/plugins/zsh-z/zsh-z.plugin.zsh" ] && source "$HOME/.zsh/plugins/zsh-z/zsh-z.plugin.zsh"

# Auto-suggestions
if [ -f "$HOME/.zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh" ]; then
  source "$HOME/.zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh"
fi

# Carapace auto-completion (if installed)
if command -v carapace &> /dev/null; then
  export CARAPACE_BRIDGES='zsh,fish,bash,inshellisense'
  zstyle ':completion:*' format $'\e[2;37mCompleting %d\e[m'
  source <(carapace _carapace)
fi

# Word navigation with option/alt key (macOS/Linux)
bindkey "^[[1;3D" beginning-of-line
bindkey "^[[1;3C" end-of-line
bindkey "^[[1;9D" beginning-of-line
bindkey "^[[1;9C" end-of-line
bindkey "\eOH" beginning-of-line
bindkey "\eOF" end-of-line
bindkey "^[b" backward-word
bindkey "^[f" forward-word

# Syntax highlighting must be loaded last
if [ -f "$HOME/.zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" ]; then
  source "$HOME/.zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
fi
"#
}

fn tmux_template(default_shell: &str) -> String {
    format!(
        r##"# Default shell
set-option -g default-shell {default_shell}

# New window/pane in current path
bind c new-window -c "#{{pane_current_path}}"
bind '"' split-window -c "#{{pane_current_path}}"
bind % split-window -h -c "#{{pane_current_path}}"

# Smart pane switching with awareness of vim splits
bind -n C-h run "(tmux display-message -p '#{{pane_current_command}}' | grep -iq vim && tmux send-keys C-h) || tmux select-pane -L"
bind -n C-j run "(tmux display-message -p '#{{pane_current_command}}' | grep -iq vim && tmux send-keys C-j) || tmux select-pane -D"
bind -n C-k run "(tmux display-message -p '#{{pane_current_command}}' | grep -iq vim && tmux send-keys C-k) || tmux select-pane -U"
bind -n C-l run "(tmux display-message -p '#{{pane_current_command}}' | grep -iq vim && tmux send-keys C-l) || tmux select-pane -R"

set -sg escape-time 50
set-option -g focus-event on

set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-boot 'on'
set -g @continuum-restore 'on'

set -g mouse on
set -g xterm-keys on

run '~/.tmux/plugins/tpm/tpm'
"##
    )
}

const ANTIGENRC_TEMPLATE: &str = r#"# Load bundles from the default repo (oh-my-zsh)
antigen bundle git
antigen bundle git-extras
antigen bundle command-not-found

# Load bundles from external repos
antigen bundle zsh-users/zsh-completions
antigen bundle zsh-users/zsh-autosuggestions
antigen bundle zsh-users/zsh-syntax-highlighting
antigen bundle agkozak/zsh-z

antigen apply
"#;

const EZA_TEMPLATE: &str = r##"colourful: true

filekinds:
  normal: { foreground: "#c0caf5" }
  directory: { foreground: "#7aa2f7" }
  symlink: { foreground: "#2ac3de" }
  executable: { foreground: "#9ece6a" }

git:
  new: { foreground: "#9ece6a" }
  modified: { foreground: "#bb9af7" }
  deleted: { foreground: "#db4b4b" }
  ignored: { foreground: "#545c7e" }

date: { foreground: "#e0af68" }
size:
  number_byte: { foreground: "#a9b1d6" }
  number_kilo: { foreground: "#89ddff" }
  number_mega: { foreground: "#2ac3de" }
  number_giga: { foreground: "#ff9e64" }
"##;
