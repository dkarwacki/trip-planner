# Mermaid Diagram – Business Process Sequence

You are an experienced software architect. Your task is to create a Mermaid sequence diagram visualizing the interactions between participants in a selected business process based on the provided code and contextual information.

The diagram must be written to the following file: [destination file path]

You may refer to the following files or sources to understand the process implementation and business context:

<file_references>
[all usefull file references]
</file_references>

<business_process>
[name of the business process]
</business_process>

Your task is to analyze the business process, the source code, and the provided context, then produce a comprehensive Mermaid sequence diagram representing the interactions between participants. All diagram labels must be in English.

**Important:** Follow @.cursor/commands/mermaid-sequence-rules.md for Mermaid syntax, styling, and best practices throughout this process.

## When to Use Sequence Diagrams

Use sequence diagrams when the business process involves:

- **Request-response interactions** between services, components, or systems
- **Time-ordered operations** where the sequence of events matters
- **Multiple participants** exchanging messages or data
- **Synchronous and asynchronous communication** patterns that need to be distinguished
- **Error handling flows** with clear branching based on conditions
- **Lifecycle events** such as session creation, authentication, or order processing

Prefer flowcharts when the focus is on decision logic, data transformation, or process stages rather than inter-participant communication.

## Step 1: Interaction Analysis

Before generating the diagram, perform an analysis and place it inside <interaction_analysis> tags:

1. **Identify all participants** in the interaction:
   - Actors (users, admins, external triggers, schedulers)
   - Internal services (API, handlers, domain services)
   - External systems (third-party APIs, payment providers)
   - Data stores (databases, caches, queues)

2. **Map the message flow**:
   - What initiates the process (trigger event)
   - Sequence of requests and responses between participants
   - Synchronous calls (blocking, waiting for response)
   - Asynchronous messages (fire-and-forget, events, queues)

3. **Identify control flow patterns**:
   - Conditional branches (if/else scenarios)
   - Loops (repeated operations)
   - Parallel operations (concurrent processing)
   - Error handling (validation failures, exceptions)

4. **Document key data exchanges**:
   - What data is passed in each message
   - Transformations that occur during processing
   - Return values and response payloads

## Step 2: Build the Diagram

Include the following elements:

### Participant Declaration

- **Declare all participants explicitly** at the top of the diagram
- **Order participants left-to-right** by first interaction (actors on left, external systems/databases on right)
- **Use appropriate participant types**: `actor`, `participant`, `database`, `queue`
- **Group related participants** using `box` when it improves clarity
- **Use descriptive aliases**: `participant OS as OrderService`

### Message Flow

- **Show the complete happy path first**, then alternative/error flows
- **Use correct arrow types** based on communication pattern:
  - `->>` / `-->>` for synchronous request/response
  - `-)` / `--)` for asynchronous messages (events, queues)
  - `-x` for fire-and-forget messages
- **Every request MUST have a corresponding response** unless explicitly async
- **Include relevant technical details** in message labels:
  - HTTP methods: `POST /orders`
  - Method calls: `validateOrder()`
  - Event names: `OrderCreatedEvent`

### Control Flow

- **Use `alt`/`else`** for conditional branching with descriptive conditions
- **Use `opt`** for optional behavior (single condition)
- **Use `loop`** for repeated operations with clear iteration context
- **Use `par`/`and`** for parallel operations
- **Use `break`** for early exit on errors

### Activation Boxes

- **Use activation** to show processing scope when it adds clarity
- **Activate** when a participant starts processing
- **Deactivate** when processing completes
- **Use shorthand** `+`/`-` suffixes for clean diagrams: `->>+` and `-->>-`

### Notes and Context

- **Add notes** for additional context: `Note over A,B: Explanation`
- **Use `rect`** to highlight important sections (success path, error path)
- **Use `autonumber`** for complex flows where message order matters

## Step 3: Apply Styling

Apply dark theme styling for visibility:

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

## Step 4: Review

After generating the diagram, review against @.cursor/commands/mermaid-sequence-rules.md to ensure:

### Completeness

- [ ] All participants are declared and have at least one interaction
- [ ] Every synchronous request has a corresponding response
- [ ] Complete happy path is shown
- [ ] Error/alternative flows are included where relevant

### Clarity

- [ ] Participants are ordered logically (left-to-right by interaction flow)
- [ ] Message labels are concise but descriptive
- [ ] Control flow blocks have descriptive conditions
- [ ] Notes explain non-obvious behavior

### Syntax

- [ ] Arrow types match communication patterns (sync vs async)
- [ ] No use of unescaped "end" in text (use `(end)` or `[end]`)
- [ ] Activation boxes are properly opened and closed
- [ ] All control flow blocks are properly terminated

### Abstraction

- [ ] Level of detail matches diagram purpose
- [ ] Internal implementation details are abstracted appropriately
- [ ] Maximum 6-8 participants for readability
- [ ] Maximum 2-3 levels of nested control blocks

Reorganize or simplify if needed.

Return the final diagram wrapped inside <mermaid_diagram> tags.
