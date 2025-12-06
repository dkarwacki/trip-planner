---
description: Rules for creating clear and complete Mermaid sequence diagrams
globs: .ai/diagrams/**/*.md, **/*-sequence.md, **/*-diagram.md
alwaysApply: false
---

# Mermaid Sequence Diagram Rules

## Important Syntax Notes

- **The word "end" can break diagrams** - If you must use "end" in text, wrap it in parentheses `(end)`, quotes `"end"`, or brackets `[end]`, `{end}`
- **Comments use `%%`** - Any text after `%%` on a line is ignored by the parser
- **Escape special characters** using entity codes: `#35;` for `#`, `#59;` for `;`

### HTML Tags Compatibility

- **NEVER use `<br/>` in participant declarations** - This causes parse errors:

  ```
  %% BAD - will cause parse error
  participant Handler as SubAccountRequestHandler<br/>(Frontend)
  database DB as MySQL<br/>(tradovate_main)

  %% GOOD - use simple names
  participant Handler as SubAccountRequestHandler
  participant DB as MySQL
  ```

- **AVOID `<br/>` in message labels** - Some renderers don't support it:

  ```
  %% BAD - may cause parse error
  A->>B: findData()<br/>(with filters)

  %% GOOD - use separate Note
  A->>B: findData()
  Note right of B: with filters
  ```

- **`<br/>` is SAFE in Notes** - Use Notes for multi-line content:
  ```
  %% GOOD - Notes support <br/>
  Note over A,B: First line<br/>Second line<br/>Third line
  ```

### Participant Type Compatibility

- **Prefer `participant` over specialized types** for maximum compatibility:
  - `database`, `queue`, `actor` types may have issues with aliases in some renderers
  - When in doubt, use `participant` - it works everywhere

  ```
  %% SAFER - works in all renderers
  participant DB as MySQL

  %% MAY FAIL - specialized types can have alias issues
  database DB as MySQL
  ```

## Participant Organization

- **ALWAYS declare participants explicitly at the top** in left-to-right order of first interaction
  - This controls layout and improves readability
  - Use descriptive aliases: `participant FE as Frontend`

- **Group related participants logically**:
  - Actors (users, external triggers) on the left
  - Internal services in the middle
  - External systems and databases on the right

- **Use appropriate participant types**:
  - `actor` for human users: `actor User`
  - `participant` for services/components: `participant OrderService`
  - `database` for data stores: `database MySQL`
  - `queue` for message queues: `queue EventQueue`

- **Group actors with `box`** for visual organization:

  ```
  box Aqua Backend Services
      participant API
      participant DB
  end
  box rgb(33,66,99) External
      participant Payment
  end
  ```

- **Create/destroy actors dynamically** (v10.3.0+):
  ```
  create participant Session
  Auth->>Session: create
  Session->>Session: process
  destroy Session
  Session-->>Auth: destroyed
  ```

## Message Types and Arrows

- **Ten arrow types available** - Choose based on communication semantics:

  | Arrow    | Description                                  |
  | -------- | -------------------------------------------- |
  | `->`     | Solid line without arrow                     |
  | `-->`    | Dotted line without arrow                    |
  | `->>`    | Solid line with arrowhead (sync request)     |
  | `-->>`   | Dotted line with arrowhead (sync response)   |
  | `<<->>`  | Bidirectional solid (v11.0.0+)               |
  | `<<-->>` | Bidirectional dotted (v11.0.0+)              |
  | `-x`     | Solid line with cross (async, fire & forget) |
  | `--x`    | Dotted line with cross                       |
  | `-)`     | Solid line with open arrow (async)           |
  | `--)`    | Dotted line with open arrow (async)          |

- **Standard request-response pattern**:

  ```
  ServiceA->>ServiceB: request
  ServiceB-->>ServiceA: response
  ```

- **Async messaging pattern**:
  ```
  ServiceA-)Queue: publish event
  Queue-)ServiceB: deliver event
  ```

## Activation and Deactivation

- **Use activation boxes to show processing scope**:
  - `activate ServiceA` / `deactivate ServiceA`
  - Or shorthand: `ServiceA->>+ServiceB: request` (activates B)
  - And: `ServiceB-->>-ServiceA: response` (deactivates B)

- **Activation rules**:
  - Activate when a participant starts processing a request
  - Deactivate when processing completes and control returns
  - Nested activations show recursive or chained calls

- **AVOID over-activation** - Only use when it adds clarity about processing scope

## Control Flow Blocks

- **Use `alt` for conditional branching** (if/else):

  ```
  alt condition is true
      A->>B: do this
  else condition is false
      A->>C: do that
  end
  ```

- **Use `opt` for optional behavior** (if without else):

  ```
  opt user is authenticated
      Auth->>Session: extend session
  end
  ```

- **Use `loop` for repeated operations**:

  ```
  loop for each item in cart
      Cart->>Inventory: check stock
  end
  ```

- **Use `par` for parallel operations**:

  ```
  par parallel execution
      A->>B: request 1
  and
      A->>C: request 2
  end
  ```

- **Use `critical` for atomic operations**:

  ```
  critical transaction
      DB->>DB: begin
      Service->>DB: update
      DB->>DB: commit
  option rollback
      DB->>DB: rollback
  end
  ```

- **Use `break` for early exit scenarios**:
  ```
  break validation failed
      Service-->>Client: error response
  end
  ```

## Labels and Descriptions

- **Keep message labels concise but descriptive**:
  - BAD: `send HTTP POST request to create new order`
  - GOOD: `POST /orders`
  - GOOD: `createOrder(items)`

- **Include relevant technical details**:
  - HTTP methods: `GET /users/{id}`
  - Method names: `validateInput()`
  - Event names: `OrderCreatedEvent`

- **Use notes for additional context**:
  - `Note over A,B: Explanation spanning participants`
  - `Note right of A: Side note`
  - `Note left of A: Side note`

- **Use line breaks** with `<br/>` in **Notes only** (not in messages or participants):

  ```
  %% GOOD - Notes support <br/>
  Note over A: First line<br/>Second line

  %% BAD - Messages may not support <br/>
  A->>B: Line 1<br/>Line 2

  %% GOOD - Use separate Note for additional context
  A->>B: doSomething()
  Note right of B: Additional context here
  ```

- **Actor names with spaces require aliases**:

  ```
  participant LB as Load Balancer
  ```

- **Block labels should explain the condition**:
  - BAD: `alt success`
  - GOOD: `alt order.status == VALID`

## Sequence Flow Best Practices

- **Show the complete happy path first**, then alternative flows
- **Number complex flows** when order matters: `1. validate`, `2. process`, `3. persist`
- **Group related interactions** with background highlighting using `rect`:

  ```
  rect rgb(0, 255, 0)
      Note over A,B: Success Path
      A->>B: authenticate
      B-->>A: token
  end
  rect rgba(255, 0, 0, 0.3)
      Note over A,B: Error Path (semi-transparent)
      A->>B: invalid request
      B-->>A: error
  end
  ```

- **Return responses on the same level** as requests when possible
- **Show error handling explicitly** using `alt` or `break` blocks

## Styling Best Practices

- **Initialize dark theme** for dark background compatibility:

  ```
  %%{init: {'theme': 'dark', 'themeVariables': { 'actorBkg': '#1e88e5', 'actorTextColor': '#fff', 'signalColor': '#90caf9', 'labelTextColor': '#fff'}}}%%
  ```

- **Recommended theme variables for dark mode**:

  ```
  %%{init: {
    'theme': 'dark',
    'themeVariables': {
      'actorBkg': '#1e88e5',
      'actorBorder': '#42a5f5',
      'actorTextColor': '#ffffff',
      'actorLineColor': '#90caf9',
      'signalColor': '#90caf9',
      'signalTextColor': '#ffffff',
      'labelBoxBkgColor': '#263238',
      'labelBoxBorderColor': '#546e7a',
      'labelTextColor': '#ffffff',
      'loopTextColor': '#ffffff',
      'noteBkgColor': '#37474f',
      'noteTextColor': '#ffffff',
      'noteBorderColor': '#546e7a',
      'activationBkgColor': '#424242',
      'activationBorderColor': '#757575',
      'sequenceNumberColor': '#ffd54f'
    }
  }}%%
  ```

- **Use `autonumber`** for complex sequences to track message order:

  ```
  autonumber
  A->>B: first message
  B->>C: second message
  ```

- **Key configuration parameters** (via init directive):

  | Parameter         | Description                 | Default |
  | ----------------- | --------------------------- | ------- |
  | `mirrorActors`    | Show actors at bottom too   | false   |
  | `actorFontSize`   | Actor description font size | 14      |
  | `noteFontSize`    | Note text font size         | 14      |
  | `messageFontSize` | Message text font size      | 16      |
  | `noteAlign`       | Text alignment in notes     | center  |

- **CSS classes available for custom styling**:
  - `.actor` / `.actor-top` / `.actor-bottom` - Actor boxes
  - `.actor-line` - Vertical lifeline
  - `.messageLine0` / `.messageLine1` - Solid/dotted message lines
  - `.messageText` - Text on message arrows
  - `.note` / `.noteText` - Note boxes and text
  - `.labelBox` / `.labelText` / `.loopText` - Loop/alt labels

## Actor Links (Interactive Menus)

- **Add clickable links to actors** for documentation or dashboards:

  ```
  participant API as API Service
  link API: Dashboard @ https://dashboard.example.com
  link API: Repository @ https://github.com/org/api
  ```

- **JSON format** for multiple links:
  ```
  links API: {"Dashboard": "https://dash.example.com", "Docs": "https://docs.example.com"}
  ```

## Common Diagram Types

### Request-Response Pattern

```
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>+S: request
    S->>+DB: query
    DB-->>-S: result
    S-->>-C: response
```

### Event-Driven Pattern

```
sequenceDiagram
    participant P as Producer
    participant Q as Queue
    participant C as Consumer

    P-)Q: publish(event)
    Q-)C: deliver(event)
    C->>C: process
```

### Error Handling Pattern

```
sequenceDiagram
    participant C as Client
    participant S as Service

    C->>S: request
    alt validation passes
        S-->>C: 200 OK
    else validation fails
        S-->>C: 400 Bad Request
    end
```

## Common Mistakes to Avoid

- **NEVER leave responses hanging** - Every request should have a corresponding response unless explicitly async
- **NEVER create orphan participants** - All declared participants should have at least one interaction
- **NEVER mix sync and async arrows inconsistently** - Be deliberate about communication patterns
- **AVOID walls of text** in message labels - Keep them short and use notes for explanations
- **AVOID too many participants** - Consider splitting into multiple diagrams if more than 6-8 participants
- **AVOID deeply nested control blocks** - Maximum 2-3 levels of nesting for readability
- **NEVER use generic names** like "Service1", "Component" - Use domain-specific names
- **AVOID showing every internal method call** - Abstract to the level appropriate for the audience
- **NEVER use `<br/>` in participant declarations** - Causes parse errors (use simple names)
- **AVOID `<br/>` in message labels** - Use separate Notes instead for multi-line context
- **PREFER `participant` over `database`/`actor`/`queue`** when using aliases - Specialized types may have compatibility issues

## Diagram Scope Guidelines

- **One diagram per use case or flow** - Don't try to show everything in one diagram
- **Match abstraction level to audience**:
  - High-level: Show service-to-service communication
  - Detailed: Show method calls within a service
- **Include legend or notes** for non-obvious conventions
- **Title your diagrams** to clarify scope and purpose
