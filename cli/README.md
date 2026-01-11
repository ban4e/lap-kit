<p align="center">
  <img src="./logo.png" alt="Logo" width="100" />
  <br /><br />
  <span style="font-size: 32px; font-weight: bold;">lap-kit</span>
</p>

## About

CLI utility for installing UI Kit components.

## Available Commands

| Command | Description |
|---------|-------------|
| `npx @ban4e/lap-kit init` | Initialize your project and create a config file. Prompts for directories and aliases |
| `npx @ban4e/lap-kit add <components...>` | Add components to your project. Can specify components as arguments or select interactively |
| `npx @ban4e/lap-kit add <components...> -y` | Add components without confirmation prompts |
| `npx @ban4e/lap-kit add <components...> --overwrite` | Overwrite existing component files |

## Example Usage

```bash
# Initialize project
npx @ban4e/lap-kit init

# Add specific components
npx @ban4e/lap-kit add Button Input Toggle

# Add components interactively
npx @ban4e/lap-kit add
```
