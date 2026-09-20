import readline from "node:readline";

export interface SelectOption {
  id: string;
  label: string;
  hint?: string;
}

/**
 * Prompts user with an interactive selection menu.
 * Supports both raw mode (arrow keys / enter) and fallback standard readline (number prompt).
 */
export async function promptSelect(
  title: string,
  options: SelectOption[],
  defaultIndex = 0,
): Promise<SelectOption> {
  const isRawSupported =
    Boolean(process.stdin.isTTY) &&
    typeof process.stdin.setRawMode === "function";

  if (!isRawSupported) {
    // Non-interactive / non-TTY fallback: prompt with numbers
    console.log(title);
    options.forEach((opt, idx) => {
      const hint = opt.hint ? ` (${opt.hint})` : "";
      console.log(`  [${idx + 1}] ${opt.label}${hint}`);
    });
    const answer = await promptText(
      `Select option (1-${options.length}) [${defaultIndex + 1}]: `,
    );
    const num = Number.parseInt(answer.trim(), 10);
    if (!Number.isNaN(num) && num >= 1 && num <= options.length) {
      return options[num - 1];
    }
    return options[defaultIndex];
  }

  return new Promise((resolve) => {
    let selectedIndex = defaultIndex;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.emitKeypressEvents(process.stdin, rl);
    process.stdin.setRawMode(true);

    function render(firstTime = false) {
      if (!firstTime) {
        // Move cursor up by (options.length + 2) lines to redraw
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -(options.length + 2));
      }

      console.log(`\n${title}`);
      options.forEach((opt, idx) => {
        const isSelected = idx === selectedIndex;
        const pointer = isSelected ? "❯ " : "  ";
        const hint = opt.hint ? ` \x1b[90m(${opt.hint})\x1b[0m` : "";
        const label = isSelected
          ? `\x1b[36m\x1b[1m${opt.label}\x1b[0m`
          : opt.label;
        console.log(`${pointer}${label}${hint}\x1b[K`);
      });
    }

    render(true);

    const onKeypress = (_str: string, key: readline.Key) => {
      if (!key) return;

      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(130);
      }

      if (key.name === "up") {
        selectedIndex =
          selectedIndex === 0 ? options.length - 1 : selectedIndex - 1;
        render();
      } else if (key.name === "down") {
        selectedIndex =
          selectedIndex === options.length - 1 ? 0 : selectedIndex + 1;
        render();
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        console.log();
        resolve(options[selectedIndex]);
      }
    };

    function cleanup() {
      process.stdin.removeListener("keypress", onKeypress);
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
      }
      rl.close();
    }

    process.stdin.on("keypress", onKeypress);
  });
}

/**
 * Prompts user for text input.
 */
export async function promptText(
  promptMessage: string,
  defaultValue = "",
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(promptMessage, (answer) => {
      rl.close();
      const val = answer.trim();
      resolve(val || defaultValue);
    });
  });
}

/**
 * Prompts user for sensitive text input (e.g. API key) masking characters in TTY.
 */
export async function promptPassword(promptMessage: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return promptText(promptMessage);
  }

  return new Promise((resolve) => {
    process.stdout.write(promptMessage);
    let pass = "";

    const onData = (char: Buffer) => {
      const s = char.toString("utf8");
      if (s === "\n" || s === "\r" || s === "\u0004") {
        process.stdin.removeListener("data", onData);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }
        process.stdout.write("\n");
        resolve(pass.trim());
      } else if (s === "\u0003") {
        // Ctrl+C
        process.exit(130);
      } else if (s === "\b" || s === "\x7f") {
        // Backspace
        if (pass.length > 0) {
          pass = pass.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        pass += s;
        process.stdout.write("*");
      }
    };

    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}
