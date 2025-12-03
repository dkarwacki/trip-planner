---
description: Rules for creating clear and complete Mermaid state diagrams
globs: .ai/diagrams/**/*.md, **/*-state.md, **/*-states.md
alwaysApply: false
---

# Mermaid State Diagram Rules

## Diagram Declaration

- **Start with `stateDiagram-v2`** for modern syntax:
  ```
  stateDiagram-v2
      [*] --> Active
  ```

- **Set diagram direction when needed**:
  - `direction LR` - Left to Right
  - `direction RL` - Right to Left  
  - `direction TB` - Top to Bottom (default)
  - `direction BT` - Bottom to Top

## State Declaration

- **Three ways to declare states**:
  ```
  %% Just an id
  stateId
  
  %% Using state keyword with description
  state "Human readable description" as stateId
  
  %% Using id with colon and description
  stateId : This is the description
  ```

- **State names MUST be valid identifiers** - No spaces in IDs, use camelCase or PascalCase
  - BAD: `Active State`, `waiting-for-input`
  - GOOD: `ActiveState`, `WaitingForInput`

- **For spaces in display names**, define the state first, then reference by id:
  ```
  state "Your state with spaces in it" as yswsii
  [*] --> yswsii
  yswsii --> AnotherState
  ```

## Start and End States

- **ALWAYS use `[*]` for start and end pseudo-states**
  - `[*] --> InitialState` for entry point
  - `FinalState --> [*]` for exit point
  - Direction of the arrow determines if it's start or end
  - Every state machine MUST have at least one start state

## Transitions

- **Basic transition syntax**: `StateA --> StateB`

- **Transitions with descriptions**: `StateA --> StateB : description text`
  - BAD: `StateA --> StateB` (what causes this?)
  - GOOD: `StateA --> StateB : userClicked`

- **Use consistent event naming convention**:
  - Events: `camelCase` verbs (`submit`, `timeout`, `dataReceived`)
  - Commands: `verbNoun` pattern (`validateInput`, `processOrder`)

- **Include conditions/guards in the description text**:
  ```
  Processing --> Success : validation passed
  Processing --> Failed : validation failed
  ```

## Composite (Nested) States

- **Use the `state` keyword with curly braces**:
  ```
  state Authentication {
      [*] --> EnteringCredentials
      EnteringCredentials --> Validating : submit
      Validating --> [*] : valid
      Validating --> EnteringCredentials : invalid
  }
  ```

- **Name composite states on separate line**:
  ```
  state "Authentication Process" as Auth {
      [*] --> Login
  }
  ```

- **Multi-level nesting is supported** but avoid deep nesting (max 2-3 levels)

- **Transitions between composite states**:
  ```
  [*] --> First
  First --> Second
  First --> Third
  
  state First {
      [*] --> fir
      fir --> [*]
  }
  state Second {
      [*] --> sec
      sec --> [*]
  }
  ```

- **LIMITATION**: Cannot define transitions between internal states of different composite states

## Choice Pseudo-State (Decision Points)

- **Use `<<choice>>` for conditional branching**:
  ```
  state if_state <<choice>>
  [*] --> IsPositive
  IsPositive --> if_state
  if_state --> False : if n < 0
  if_state --> True : if n >= 0
  ```

- **ALWAYS provide all outcome paths** from choice states
- **Keep choice logic at the diagram level** - Don't bury decisions inside states

## Fork and Join (Parallel States)

- **Use `<<fork>>` and `<<join>>` for concurrent execution**:
  ```
  state fork_state <<fork>>
  [*] --> fork_state
  fork_state --> State2
  fork_state --> State3
  
  state join_state <<join>>
  State2 --> join_state
  State3 --> join_state
  join_state --> State4
  State4 --> [*]
  ```

- **ONLY use parallelism when states are genuinely independent**

## Concurrency (Parallel Regions)

- **Use `--` separator for concurrent regions within a state**:
  ```
  state Active {
      [*] --> ChildState1
      --
      [*] --> ChildState2
      --
      [*] --> ChildState3
  }
  ```

- This creates orthogonal regions that execute in parallel

## Notes

- **Add notes to clarify states**:
  ```
  note right of StateA
      This is a note
      on multiple lines
  end note
  
  note left of StateB : Single line note
  ```

- **Position options**: `note right of` or `note left of`
- **Place notes strategically** - Don't clutter simple states
- **Use notes for business rules** that aren't obvious from the diagram

## Comments

- **Use `%%` for comments** (ignored by parser):
  ```
  stateDiagram-v2
      %% This is a comment
      [*] --> Active
  ```

## Styling with classDef

- **Define styles using `classDef`**:
  ```
  classDef movement font-style:italic
  classDef badEvent fill:#f00,color:white,font-weight:bold,stroke-width:2px,stroke:yellow
  ```

- **Apply styles using `class` statement**:
  ```
  class Crash badEvent
  class Moving, Running movement
  ```

- **Apply styles inline using `:::` operator**:
  ```
  [*] --> Active:::movement
  Active --> Crash:::badEvent
  ```

- **IMPORTANT LIMITATIONS** (current Mermaid restrictions):
  - **Cannot apply classDef to start `[*]` or end `[*]` states**
  - **Cannot apply classDef to or within composite states**

## Styling Best Practices

- **Always initialize dark theme** for dark background compatibility:
  ```
  %%{init: {'theme': 'dark', 'themeVariables': { 
    'primaryColor': '#2d2d2d',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#00ffff',
    'lineColor': '#00ffff',
    'secondaryColor': '#1a1a2e',
    'tertiaryColor': '#16213e',
    'stateBkg': '#2d2d2d',
    'stateBorder': '#00ffff'
  }}}%%
  ```

- **Recommended high-contrast style definitions** (optimized for dark backgrounds):
  ```
  classDef initial fill:#00ffff,stroke:#00ffff,stroke-width:3px,color:#000,font-weight:bold
  classDef active fill:#00ff88,stroke:#00ff88,stroke-width:3px,color:#000,font-weight:bold
  classDef waiting fill:#ffdd00,stroke:#ffdd00,stroke-width:2px,color:#000,font-weight:bold
  classDef processing fill:#ff9500,stroke:#ff9500,stroke-width:2px,color:#000,font-weight:bold
  classDef success fill:#00e5ff,stroke:#00e5ff,stroke-width:2px,color:#000,font-weight:bold
  classDef error fill:#ff3366,stroke:#ff3366,stroke-width:3px,color:#fff,font-weight:bold
  classDef cancelled fill:#bb86fc,stroke:#bb86fc,stroke-width:2px,color:#000,font-weight:bold
  classDef pending fill:#78909c,stroke:#b0bec5,stroke-width:2px,color:#fff,font-weight:bold
  ```

- **Color scheme reference** (high-contrast neon colors for dark mode):

  | State Type | Fill Color | Stroke | Text | Purpose |
  |------------|------------|--------|------|---------|
  | initial | `#00ffff` (Cyan) | `#00ffff` | Black | Entry/start states |
  | active | `#00ff88` (Neon Green) | `#00ff88` | Black | Currently active states |
  | waiting | `#ffdd00` (Bright Yellow) | `#ffdd00` | Black | Idle/waiting states |
  | processing | `#ff9500` (Bright Orange) | `#ff9500` | Black | In-progress operations |
  | success | `#00e5ff` (Electric Blue) | `#00e5ff` | Black | Successful completion |
  | error | `#ff3366` (Hot Pink/Red) | `#ff3366` | White | Error/failure states |
  | cancelled | `#bb86fc` (Bright Purple) | `#bb86fc` | Black | Cancelled/aborted states |
  | pending | `#78909c` (Blue Gray) | `#b0bec5` | White | Pending/queued states |

- **Text color rules for maximum readability**:
  - Use `color:#000` (black text) for bright/neon fills (cyan, green, yellow, orange, blue, purple)
  - Use `color:#fff` (white text) for darker fills (error red, gray tones)
  - ALWAYS include `font-weight:bold` for better visibility on dark backgrounds
  - ALWAYS specify text color explicitly - never rely on defaults

- **Stroke visibility on dark backgrounds**:
  - Match stroke color to fill color for glowing effect
  - Use `stroke-width:2px` minimum, `3px` for emphasis
  - Bright strokes (cyan, green, yellow) pop against dark backgrounds

## State Completeness

- **Every state (except terminal) MUST have at least one outgoing transition**
  - No orphaned states that trap the system
  - Exception: Explicit terminal/error states

- **Every state (except initial) MUST have at least one incoming transition**
  - No unreachable states

- **Show all relevant state transitions** - Omitting transitions creates confusion

## Common State Patterns

- **Retry pattern**:
  ```
  Processing --> Processing : retry (attempts < max)
  Processing --> Failed : max retries exceeded
  ```

- **Timeout pattern**:
  ```
  Waiting --> TimedOut : timeout
  Waiting --> Active : event received
  ```

- **Cancellation pattern**:
  ```
  state InProgress {
      [*] --> Working
      Working --> [*] : complete
  }
  InProgress --> Cancelled : cancel
  ```

## Common Mistakes to Avoid

- **NEVER leave states without transitions** (dead ends or unreachable states)
- **NEVER use vague state names** like `State1`, `NewState`, `TempState`
- **NEVER mix abstraction levels** - Keep all states at the same level of detail
- **NEVER omit failure paths** - Always show what happens when things go wrong
- **NEVER try to style `[*]` states or composite states** - It's not supported
- **AVOID over-complicated diagrams** - Split into multiple diagrams if necessary
- **AVOID transitions without labels** - Unlabeled arrows are ambiguous
- **AVOID transitions between internal states of different composite states** - Not supported

## State Diagram vs Flowchart

- **Use state diagrams when**:
  - Modeling object lifecycle (Order: Created → Paid → Shipped → Delivered)
  - Showing reactive behavior (responds to events)
  - State persistence matters (system remembers its state)

- **Use flowcharts when**:
  - Modeling process flow (step-by-step procedures)
  - Showing control flow or algorithms
  - One-time execution paths
