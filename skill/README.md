# Dominos Skill for Claude Code

Order Domino's pizza directly from Claude Code!

## Installation

1. Install the CLI tool globally:
```bash
npm install -g dominos-cli
```

2. Run the setup wizard:
```bash
dominos config setup
```

3. Add some order presets by editing your config:
```bash
dominos config edit
```

4. Install this skill in Claude Code (copy to `~/.claude/skills/dominos/`)

## Usage

### Order Pizza
```
/dominos order usual
```

### Track Order
```
/dominos track
```

### Manage Config
```
/dominos config show
/dominos config validate
```

## Configuration

Your configuration is stored at `~/.dominos/config.json`

Add presets by editing the config file:
```json
{
  "presets": {
    "usual": {
      "name": "My usual order",
      "items": [
        {"code": "14SCREEN", "qty": 1}
      ]
    }
  }
}
```

Find product codes at the Dominos website or by exploring the menu.
