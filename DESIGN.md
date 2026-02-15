# Dominos CLI Tool - Design Document

**Date:** 2026-02-14
**Status:** Approved
**Author:** Claude + User

## Overview

A command-line tool for ordering Domino's pizza that wraps the `node-dominos-pizza-api` library. Provides intuitive commands, secure configuration management, and named order presets. Designed to integrate with Claude Code as a skill.

## Goals

- **Simple & Fast:** Order pizza in one command: `dominos order usual`
- **Secure Config:** Store credentials in `~/.dominos/config.json` with clear warnings
- **Modern CLI:** Use commander.js for professional subcommand interface
- **Skill-Ready:** Easy integration as a Claude Code skill

## Architecture Decisions

### Project Scope
- **Separate npm package** (`dominos-cli`) that depends on `dominos` library
- Published to npm for global installation
- Not part of the existing `node-dominos-pizza-api` repository

### Security Model
- **Plaintext config with warnings** - Stored in `~/.dominos/config.json`
- File permissions protect credentials (0600 recommended)
- Config file includes warning comment about sensitive data
- Card number masked in `dominos config show` output

### CLI Framework
- **Commander.js** - Modern subcommand interface (like git/gh/npm)
- Colored output with chalk
- Loading spinners with ora
- Config management with conf package

### MVP Features
1. **Order from presets** - Core functionality
2. **Configure defaults** - Setup wizard and config management
3. **Track orders** - Check order status

**Deferred to v2:**
- Browse menu interactively
- Custom item builder
- Multiple payment methods
- Store search/comparison

## Project Structure

```
dominos-cli/
├── bin/
│   └── dominos.js           # Executable entry point
├── src/
│   ├── commands/
│   │   ├── order.js         # Handle order command
│   │   ├── config.js        # Handle config command
│   │   └── track.js         # Handle track command
│   ├── config-manager.js    # Read/write config file
│   ├── order-builder.js     # Build order from preset
│   └── setup-wizard.js      # First-run configuration
├── .gitignore
├── package.json
└── README.md
```

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "dominos": "^3.3.1",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "conf": "^13.0.0"
  }
}
```

## Configuration Format

**Location:** `~/.dominos/config.json`

**Schema:**
```json
{
  "customer": {
    "firstName": "Jordan",
    "lastName": "Smith",
    "email": "jordan@example.com",
    "phone": "555-123-4567",
    "address": {
      "street": "123 Main St",
      "city": "Portland",
      "region": "OR",
      "postalCode": "97201"
    }
  },
  "payment": {
    "number": "4111111111111111",
    "expiration": "12/27",
    "securityCode": "123",
    "postalCode": "97201",
    "tipAmount": 5
  },
  "store": {
    "storeID": "4336",
    "name": "Portland - SW Broadway",
    "phone": "503-555-0100"
  },
  "presets": {
    "usual": {
      "name": "My usual - pepperoni & coke",
      "items": [
        {"code": "14SCREEN", "qty": 1},
        {"code": "20BCOKE", "qty": 1}
      ]
    },
    "party": {
      "name": "Party order - 3 large pizzas",
      "items": [
        {"code": "14SCREEN", "qty": 2},
        {"code": "14THIN", "qty": 1}
      ]
    }
  }
}
```

## Command Specifications

### `dominos order <preset>`

Orders pizza from a named preset.

**Example:**
```bash
dominos order usual
```

**Flow:**
1. Load and validate config
2. Look up preset by name
3. Create Order instance with customer info
4. Add items from preset
5. Validate order with Dominos API
6. Price order and display total
7. Confirm with user (Y/n)
8. Add payment and place order
9. Display success message with tracking info

**Output:**
```
🍕 Building order: My usual - pepperoni & coke
✓ Order validated
💰 Total: $18.43 (includes $5.00 tip)

Order Summary:
  • 1x Medium Hand Tossed Pepperoni Pizza
  • 1x 20oz Coca-Cola

Place this order? (Y/n): y
✓ Order placed successfully!

Order ID: 12345
Store: Portland - SW Broadway (503-555-0100)
Estimated time: 25-35 minutes

Track your order: dominos track
```

### `dominos config <subcommand>`

Manage configuration.

**Subcommands:**
- `show` - Display config (mask card number)
- `edit` - Open config in $EDITOR
- `validate` - Check config validity
- `setup` - Re-run setup wizard

**Examples:**
```bash
dominos config show       # Display current config
dominos config edit       # Edit in text editor
dominos config validate   # Check for errors
dominos config setup      # Re-run initial setup
```

### `dominos track [phone]`

Track order status.

**Examples:**
```bash
dominos track              # Uses phone from config
dominos track 5551234567   # Track specific number
```

**Output:**
```
🍕 Order Status: Being Prepared

Order #12345
Store: Portland - SW Broadway
Ordered: 2 minutes ago

Progress:
  ✓ Order placed
  ● Being prepared
  ○ In the oven
  ○ Quality check
  ○ Out for delivery

Estimated delivery: 23-33 minutes
```

## Error Handling

**Strategy:**
- Catch all Dominos API errors (DominosValidationError, DominosPriceError, DominosPlaceOrderError)
- Display user-friendly messages with chalk colors
- Provide actionable suggestions
- Use appropriate exit codes

**Exit Codes:**
- 0: Success
- 1: User error (bad preset, invalid config, etc.)
- 2: System/API error (network, Dominos API down, etc.)

**Example Error Messages:**
```bash
$ dominos order pizza
✗ Preset 'pizza' not found

Available presets:
  • usual - My usual - pepperoni & coke
  • party - Party order - 3 large pizzas

Try: dominos order usual
```

```bash
$ dominos order usual
✗ Network error: Could not connect to Dominos API

Suggestions:
  • Check your internet connection
  • Retry with: dominos order usual
  • Check Dominos status at dominos.com
```

## First-Run Experience

When user runs any command without config:

```bash
$ dominos order usual

👋 Welcome to Dominos CLI!

No configuration found. Let's set up your account.

Delivery Address: 123 Main St, Portland, OR 97201
First Name: Jordan
Last Name: Smith
Phone: 555-123-4567
Email: jordan@example.com

Finding nearby stores...
✓ Found 5 stores

Select your preferred store:
  1. Portland - SW Broadway (0.3 miles)
  2. Portland - NW 23rd (1.2 miles)
  3. Portland - SE Division (2.1 miles)

Choice: 1

Payment Information:
Card Number: 4111111111111111
Expiration (MM/YY): 12/27
CVV: 123
Billing Zip: 97201
Default Tip Amount: $5

⚠️  WARNING: Payment info will be stored in plaintext at:
    ~/.dominos/config.json

    Keep this file secure!

Continue? (y/N): y

✓ Configuration saved!

You're ready to order! Try:
  dominos order usual   (once you add a preset)
  dominos config edit   (to add order presets)
```

## Claude Code Skill Integration

**Skill Location:** `~/.claude/skills/dominos/`

**skill.json:**
```json
{
  "name": "dominos",
  "description": "Order Domino's pizza from configured presets",
  "version": "1.0.0",
  "commands": {
    "order": {
      "description": "Order pizza from a preset",
      "execute": "dominos order ${args}"
    },
    "track": {
      "description": "Track your order status",
      "execute": "dominos track"
    }
  }
}
```

**Usage:**
```
User: /dominos order usual
Claude: [Executes command, shows output]

User: /dominos track
Claude: [Shows order status]
```

## Testing Strategy

**Unit Tests:**
- Config manager (load, save, validate)
- Order builder (preset to items)
- Error handling and formatting

**Integration Tests:**
- Mock Dominos API responses
- Test full order flow without placing real orders
- Test setup wizard flow

**Manual Testing Checklist:**
- [ ] First-run setup wizard
- [ ] Order from preset (validate only, don't place)
- [ ] Config show/edit/validate
- [ ] Track order (with mock data)
- [ ] Error scenarios (no config, bad preset, network error)
- [ ] Skill integration in Claude Code

## Implementation Timeline

**MVP Timeline (4-7 hours):**
1. Project setup & dependencies - 30 min
2. Config manager & setup wizard - 1-2 hours
3. Order command - 1-2 hours
4. Config & track commands - 1 hour
5. Error handling & polish - 1 hour
6. Skill integration - 30 min

**Milestones:**
- M1: Basic CLI skeleton with config management
- M2: Order command working end-to-end
- M3: Track command and error handling
- M4: Skill integration and documentation
- M5: npm publish

## Future Enhancements (v2+)

- Interactive menu browser
- Custom item builder with toppings
- Multiple saved addresses
- Multiple payment methods
- Store comparison (price, rating, distance)
- Order history
- Coupons/deals integration
- Group orders (split payment)
- Scheduled orders

## Security Considerations

1. **Config File Protection:**
   - Document recommended file permissions (0600)
   - Add warning comment in config file
   - Mask card number in `config show` output

2. **No Network Logging:**
   - Never log payment information
   - Sanitize error messages

3. **Documentation:**
   - Clear warnings about plaintext storage
   - Suggest alternatives for shared systems
   - Document environment variable option for CI/CD

## Success Criteria

- [ ] Can install globally via npm
- [ ] First-run wizard completes successfully
- [ ] Can order from preset in one command
- [ ] Orders successfully place with Dominos
- [ ] Can track orders
- [ ] Works as Claude Code skill
- [ ] Clear error messages for common issues
- [ ] Documentation covers setup and usage

## References

- [node-dominos-pizza-api](https://github.com/RIAEvangelist/node-dominos-pizza-api)
- [Commander.js](https://github.com/tj/commander.js)
- [Conf package](https://github.com/sindresorhus/conf)
