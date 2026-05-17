use std::env;
use std::process::{Command, ExitCode};

const VERSION: &str = "0.1.0-rust-preview";

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

#[derive(Debug, Default)]
struct InstallOptions {
    dry_run: bool,
    skip_backup: bool,
    minimal: bool,
    features: Features,
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.is_empty() {
        print_preview_intro();
        return ExitCode::SUCCESS;
    }

    match args[0].as_str() {
        "--help" | "-h" | "help" => {
            print_help();
            ExitCode::SUCCESS
        }
        "--version" | "-v" | "version" => {
            println!("better-shell-rust {VERSION}");
            ExitCode::SUCCESS
        }
        "check" => run_check(),
        "install" => run_install_preview(&args[1..]),
        "manage" | "configure" => {
            eprintln!("Interactive TUI is only implemented in the Bun CLI for now.");
            eprintln!("Use this Rust binary for size/startup comparisons and dry-run planning.");
            ExitCode::from(2)
        }
        "backup" | "restore" => {
            eprintln!("{} is not implemented in the Rust prototype yet.", args[0]);
            ExitCode::from(2)
        }
        command => {
            eprintln!("Unknown command: {command}");
            eprintln!("Run `better-shell-rust --help` for usage.");
            ExitCode::from(1)
        }
    }
}

fn print_preview_intro() {
    println!("better-shell-rust {VERSION}");
    println!("Experimental Rust prototype for binary-size and startup comparisons.");
    println!();
    println!("Try:");
    println!("  better-shell-rust --help");
    println!("  better-shell-rust check");
    println!("  better-shell-rust install --dry-run --minimal");
}

fn print_help() {
    println!(
        r#"better-shell-rust {VERSION}

Experimental Rust prototype for the Better Shell manager.

USAGE:
  better-shell-rust <command> [options]

COMMANDS:
  install     Preview an install plan
  check       Check common tools
  help        Show help
  version     Show version

INSTALL OPTIONS:
  --dry-run        Preview installation without making changes
  --skip-backup    Skip configuration backup
  --minimal        Skip optional tools such as fonts and carapace
  --no-fonts       Skip FiraCode Nerd Font
  --no-fzf         Skip fzf
  --no-eza         Skip eza
  --no-carapace    Skip carapace completions
  --no-mise        Skip mise and Node.js setup
  --no-node        Skip Node.js LTS setup
  --no-tmux        Skip tmux and tmux plugins

NOTE:
  This Rust CLI is intentionally incomplete. The Bun CLI remains the real implementation.
"#
    );
}

fn run_check() -> ExitCode {
    println!("System check (Rust prototype)");
    println!("Platform: {} ({})", env::consts::OS, env::consts::ARCH);
    println!("Home: {}", env::var("HOME").unwrap_or_else(|_| "unknown".to_string()));
    println!();

    for tool in ["zsh", "tmux", "fzf", "eza", "carapace", "mise", "node", "npm"] {
        match command_version(tool) {
            Some(version) if version.is_empty() => println!("✓ {tool}: installed"),
            Some(version) => println!("✓ {tool}: {version}"),
            None => println!("- {tool}: not installed"),
        }
    }

    ExitCode::SUCCESS
}

fn run_install_preview(args: &[String]) -> ExitCode {
    let mut options = InstallOptions {
        features: Features::default(),
        ..InstallOptions::default()
    };

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
            "--interactive" => {
                eprintln!("Interactive mode is only implemented in the Bun CLI for now.");
                return ExitCode::from(2);
            }
            unknown => {
                eprintln!("Unknown install option: {unknown}");
                return ExitCode::from(1);
            }
        }
    }

    if !options.dry_run {
        println!("Rust prototype only supports install previews.");
        println!("Re-run with `install --dry-run`, or use the Bun CLI for real installs.");
        return ExitCode::from(2);
    }

    print_install_plan(&options);
    ExitCode::SUCCESS
}

fn print_install_plan(options: &InstallOptions) {
    println!("Better Shell Installation (Rust prototype)");
    println!("DRY RUN MODE - No changes will be made");
    println!();
    println!("Installation steps that would be performed:");

    let mut step = 1;
    if !options.skip_backup {
        print_step(&mut step, "Backup existing configurations");
    }

    print_step(&mut step, "Install zsh");
    print_step(&mut step, "Install Oh My Zsh");
    print_step(&mut step, "Install Antigen");

    if options.features.fonts {
        print_step(&mut step, "Install FiraCode Nerd Font");
    }
    if options.features.fzf {
        print_step(&mut step, "Install fzf");
    }
    if options.features.eza {
        print_step(&mut step, "Install eza");
    }
    if options.features.carapace {
        print_step(&mut step, "Install carapace");
    }
    if options.features.mise {
        print_step(&mut step, "Install mise");
    }
    if options.features.mise && options.features.node {
        print_step(&mut step, "Install Node.js LTS via mise");
    }
    if options.features.tmux {
        print_step(&mut step, "Install tmux");
        print_step(&mut step, "Install TPM");
    }

    print_step(&mut step, "Write configuration files");
    print_step(&mut step, "Set zsh as default shell");
}

fn print_step(step: &mut usize, label: &str) {
    println!("{}. {label}", *step);
    *step += 1;
}

fn command_version(command: &str) -> Option<String> {
    let version_arg = if command == "tmux" { "-V" } else { "--version" };
    let output = Command::new(command).arg(version_arg).output().ok()?;
    if !output.status.success() && output.stdout.is_empty() && output.stderr.is_empty() {
        return None;
    }

    let combined = if output.stdout.is_empty() {
        String::from_utf8_lossy(&output.stderr).to_string()
    } else {
        String::from_utf8_lossy(&output.stdout).to_string()
    };

    Some(combined.lines().next().unwrap_or("installed").trim().to_string())
}
