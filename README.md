# dominos-cli

🍕 Command-line tool for ordering Domino's pizza

## Features

- Order from named presets in one command
- Manage customer info, payment, and store preferences
- Track order status
- Integrates with Claude Code as a skill

## Installation

```bash
npm install -g dominos-cli
```

## Quick Start

### First-time setup
```bash
dominos config setup
```

This will guide you through:
- Delivery address
- Customer information
- Nearby store selection
- Payment details

### Add order presets

Edit your config to add favorite orders:

```bash
dominos config edit
```

Add presets like this:
```json
{
  "presets": {
    "usual": {
      "name": "My usual - pepperoni pizza",
      "items": [
        {"code": "14SCREEN", "qty": 1},
        {"code": "20BCOKE", "qty": 1}
      ]
    }
  }
}
```

### Order pizza

```bash
dominos order usual
```

### Track your order

```bash
dominos track
```

## Commands

### `dominos order <preset>`
Order pizza from a named preset

### `dominos config <subcommand>`
Manage configuration
- `show` - Display config (masks sensitive data)
- `edit` - Open config in $EDITOR
- `validate` - Check for errors
- `setup` - Run setup wizard

### `dominos track [phone]`
Track order status (uses phone from config if not provided)

## Claude Code Integration

See [skill/README.md](./skill/README.md) for instructions on using dominos-cli as a Claude Code skill.

## Configuration

Config is stored at `~/.dominos/config.json`

⚠️ **Warning:** Payment information is stored in plaintext. Protect this file with proper permissions (chmod 600).

## Finding Product Codes

Product codes can be found:
- On the Domino's website
- By browsing your local store's menu
- Common codes:
  - `14SCREEN` - 14" Hand Tossed Pizza
  - `14THIN` - 14" Thin Crust Pizza
  - `20BCOKE` - 20oz Coca-Cola

## Development

```bash
# Clone repository
git clone <repo-url>
cd dominos-cli

# Install dependencies
npm install

# Run locally
node bin/dominos.js --help

# Run tests
npm test
```

## License

MIT

## Disclaimer

This is an unofficial tool. Use at your own risk. Always verify your order before placing.
