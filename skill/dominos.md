---
description: Order Domino's pizza from configured presets using the dominos-cli tool
triggers:
  - dominos
  - pizza
  - order pizza
  - track pizza
  - pizza order
---

# Dominos Pizza Ordering

Order Domino's pizza using the `dominos` CLI tool.

## When to Use

Use this skill when the user:
- Wants to order pizza ("order my usual pizza", "order dominos")
- Wants to track an order ("track my pizza order", "where's my pizza")
- Wants to manage their dominos config ("show my dominos config", "validate dominos setup")

## Prerequisites

The user must have:
1. Installed dominos-cli: `npm install -g dominos-cli`
2. Run setup wizard: `dominos config setup`
3. Added presets to their config

If not set up, guide them through these steps first.

## Commands

### Order Pizza

```bash
dominos order <preset>
```

Orders pizza from a named preset. The preset must exist in `~/.dominos/config.json`.

**Example:**
```
User: "Order my usual pizza"
You: I'll order your usual preset.
     [Run: dominos order usual]
```

### Track Order

```bash
dominos track [phone]
```

Tracks order status. Uses phone from config if not provided.

**Example:**
```
User: "Where's my pizza?"
You: Let me check your order status.
     [Run: dominos track]
```

### Manage Config

```bash
dominos config <subcommand>
```

Subcommands:
- `show` - Display config (masks payment info)
- `edit` - Open config in $EDITOR
- `validate` - Check config for errors
- `setup` - Run interactive setup wizard

**Example:**
```
User: "Show my dominos config"
You: Here's your current configuration.
     [Run: dominos config show]
```

## Error Handling

If commands fail:
- **"Config not found"** → Guide user to run `dominos config setup`
- **"Preset not found"** → Show available presets with `dominos config show`
- **"Validation errors"** → Run `dominos config validate` to see issues

## Important Notes

- **Never place orders without explicit user confirmation**
- Config file contains payment info in plaintext
- Always verify the preset name before ordering
- Product codes can be found on the Dominos website

## Configuration Structure

Config is stored at `~/.dominos/config.json`:

```json
{
  "customer": {
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "phone": "..."
  },
  "payment": {
    "number": "...",
    "expiration": "...",
    "securityCode": "...",
    "tipAmount": 5
  },
  "store": {
    "storeID": "...",
    "name": "..."
  },
  "presets": {
    "usual": {
      "name": "My usual order",
      "items": [
        {"code": "14SCREEN", "qty": 1},
        {"code": "20BCOKE", "qty": 1}
      ]
    }
  }
}
```

## Workflow Example

```
User: "I want to order pizza"

You: I can help you order Domino's pizza! First, let me check if you're set up.
     [Run: dominos config validate]

If config exists:
  You: You have the following presets available: [list presets]
       Which one would you like to order?

  User: "The usual"

  You: Ordering your 'usual' preset now.
       [Run: dominos order usual]

If config doesn't exist:
  You: You'll need to set up dominos-cli first. Let me guide you:
       1. Run: dominos config setup
       2. Follow the prompts to enter your info
       3. Add presets to your config

       Would you like me to run the setup wizard?
```
