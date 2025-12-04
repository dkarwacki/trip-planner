# Mermaid Diagram – Business Process State

You are an experienced software architect. Your task is to create a Mermaid state diagram visualizing the lifecycle states and transitions of a selected business entity or process based on the provided code and contextual information.

The diagram must be written to the following file: [destination file]

You may refer to the following files or sources to understand the process implementation and business context:

<file_references>
[all usefull file references]
</file_references>

<business_process>
[name of the business process]
</business_process>

Your task is to analyze the business process, the source code, and the provided context, then produce a comprehensive Mermaid state diagram representing the entity's lifecycle states and transitions. All diagram labels must be in English.

**Important:** Follow @.cursor/commands/mermaid-state-rules.md for Mermaid syntax, styling, and best practices throughout this process.

## When to Use State Diagrams

Use state diagrams when the business process involves:
- **Entity lifecycle modeling** where an object transitions through distinct states (Order: Created → Paid → Shipped → Delivered)
- **Reactive behavior** where the system responds to events and changes state
- **State persistence** where the system needs to remember its current state
- **Finite state machines** with well-defined states and transitions
- **Workflow stages** with clear entry and exit conditions
- **Status tracking** for entities like accounts, subscriptions, or transactions

Prefer sequence diagrams when the focus is on inter-participant communication and request-response patterns rather than object state changes.

## Step 1: State Analysis

Before generating the diagram, perform an analysis and place it inside <state_analysis> tags:

1. **Identify all states** in the lifecycle:
   - Initial state(s) (entry point to the system)
   - Active/operational states (normal operation)
   - Waiting/pending states (awaiting external input)
   - Processing states (in-progress operations)
   - Terminal states (successful completion, failure, cancellation)
   - Error states (exceptional conditions)

2. **Map the transitions**:
   - What triggers each state change (events, commands, conditions)
   - Which transitions are user-initiated vs system-initiated
   - Which transitions are synchronous vs asynchronous
   - Guard conditions that must be met for transitions

3. **Identify state patterns**:
   - Composite states (states containing sub-states)
   - Parallel/concurrent states (orthogonal regions)
   - Choice/decision points (conditional branching)
   - Retry patterns (looping back on failure)
   - Timeout patterns (time-based transitions)

4. **Document business rules**:
   - Constraints on state transitions
   - Required preconditions for entering states
   - Side effects when entering/exiting states
   - Invariants that must hold in each state

## Step 2: Build the Diagram

Include the following elements:

### State Declaration
- **Use `stateDiagram-v2`** for modern syntax
- **Declare states with descriptive names** using PascalCase for IDs
- **Use state descriptions** for human-readable names when needed:
  ```
  state "Awaiting Payment" as AwaitingPayment
  ```
- **Set direction** using `direction LR` or `direction TB` based on the flow

### Start and End States
- **ALWAYS use `[*]` for start and end pseudo-states**
- **Every diagram MUST have at least one start state**: `[*] --> InitialState`
- **Show terminal states clearly**: `FinalState --> [*]`
- **Multiple end states are valid** (success, failure, cancellation paths)

### Transitions
- **Label ALL transitions** with the triggering event or condition
- **Use consistent naming convention**:
  - Events: `camelCase` verbs (`submit`, `timeout`, `dataReceived`)
  - Conditions: descriptive text (`validation passed`, `max retries exceeded`)
- **Include guard conditions** when transitions depend on conditions:
  ```
  Processing --> Success : validation passed
  Processing --> Failed : validation failed
  ```

### Composite States
- **Use composite states** to group related sub-states:
  ```
  state Authentication {
      [*] --> EnteringCredentials
      EnteringCredentials --> Validating : submit
      Validating --> [*] : valid
  }
  ```
- **Limit nesting depth** to 2-3 levels maximum
- **Show transitions into/out of composite states** at the composite level

### Decision Points
- **Use `<<choice>>` for conditional branching**:
  ```
  state checkResult <<choice>>
  Processing --> checkResult
  checkResult --> Success : if valid
  checkResult --> Failed : if invalid
  ```
- **ALWAYS provide all outcome paths** from choice states

### Parallel States
- **Use `<<fork>>` and `<<join>>`** for concurrent execution when genuinely independent
- **Use `--` separator** for concurrent regions within a single state

### Notes
- **Add notes for business rules** that aren't obvious from transitions
- **Position notes strategically** using `note right of` or `note left of`
- **Don't over-annotate** simple states

## Step 3: Apply Styling

Apply dark theme styling for visibility:

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

Define and apply semantic styles for different state types:

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

**Apply styles using the `:::` operator or `class` statement:**
```
[*] --> Created:::initial
Created --> Processing:::processing
Processing --> Completed:::success
Processing --> Failed:::error
```

**Note:** Cannot apply classDef to `[*]` states or composite states (Mermaid limitation).

## Step 4: Review

After generating the diagram, review against @.cursor/commands/mermaid-state-rules.md to ensure:

### Completeness
- [ ] All states in the lifecycle are represented
- [ ] Every state (except terminal) has at least one outgoing transition
- [ ] Every state (except initial) has at least one incoming transition
- [ ] All terminal states (success, failure, cancellation) are shown
- [ ] Error/failure paths are included

### Clarity
- [ ] States are named descriptively (no `State1`, `TempState`)
- [ ] All transitions are labeled with triggering events/conditions
- [ ] Composite states group logically related sub-states
- [ ] Notes explain non-obvious business rules
- [ ] Diagram direction matches natural reading flow

### Syntax
- [ ] Uses `stateDiagram-v2` declaration
- [ ] State IDs use PascalCase without spaces
- [ ] `[*]` used correctly for start/end states
- [ ] Choice states provide all outcome paths
- [ ] No orphaned or unreachable states

### Abstraction
- [ ] All states are at the same level of detail
- [ ] Implementation details are abstracted appropriately
- [ ] Maximum 2-3 levels of composite state nesting
- [ ] Complex flows split into multiple diagrams if needed

Reorganize or simplify if needed.

Return the final diagram wrapped inside <mermaid_diagram> tags.

