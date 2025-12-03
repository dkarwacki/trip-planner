---
description: Rules for creating clear and complete Mermaid flowchart diagrams
globs: .ai/diagrams/**/*.md, **/*-diagram.md
alwaysApply: false
---

# Mermaid Flowchart Diagram Rules

## Connection Completeness

- **ALWAYS show complete data flow paths from source to destination**
  - Every queue, stream, or intermediate component MUST connect to its final destination (external system, database, etc.)
  - Avoid orphaned nodes that appear to lead nowhere
  - If data flows through A → B → C → D, show explicit connections for the full path

- **Prefer direct connections with descriptive labels over many intermediate nodes**
  - BAD: `Queue --> Processor --> Service --> API --> ExternalSystem`
  - GOOD: `Queue -->|"process & send"| Service -->|"API call"| ExternalSystem`

## Arrow Types for Flow Semantics

- **Use appropriate arrow types to convey behavior**:
  - `-->` standard synchronous flow
  - `-.->` asynchronous flow (queues, message bus, events)
  - `==>` emphasized/critical path
  - `--Label-->` labeled transition explaining what happens

- **Queues and async components SHOULD use dashed arrows** (`-.->`) to indicate async nature

## Consolidation Principles

- **Consolidate related API operations into single labeled arrows**
  - BAD: Separate nodes for `insertBalance`, `updateBalance`, `getBalance`
  - GOOD: Single arrow with label `-->|"insert/update/get Balance"| ExternalSystem`

- **Group related operations in labels** rather than creating node explosion

## Subgraph Organization

- **Keep subgraphs focused on logical grouping**
  - Group by layer (Event Sources, Processing, External Systems, Database)
  - Group by responsibility, not by implementation detail

- **Avoid deep nesting** - Maximum 2 levels of subgraphs
  - BAD: Subgraph inside subgraph inside subgraph
  - GOOD: Flat structure with clear boundaries

- **Queues deserve their own visibility** - Don't bury them inside processing subgraphs if they're important to the flow

## Labels and Naming

- **Use descriptive labels on arrows** to explain transformations:
  - Include throttling info: `"throttle(8/s)"`
  - Include method names: `"handleInsertCashBalance()"`
  - Include data transformations: `"aggregate by account"`

- **Node IDs MUST be valid** - No spaces, use camelCase or PascalCase
- **Display labels can have spaces** using quotes: `GCQ["Generic Cash Queue"]`

## Decision Nodes

- **Use double braces for decision nodes**: `{{"Question?"}}`
- **Keep decision labels short** - The question should fit in the node
- **Show all outcomes** from decisions (Yes/No, different paths)

## External Systems and Databases

- **External systems MUST be visually distinct**
  - Use `[["System Name"]]` for external systems
  - Use `[("Entity Name")]` for database entities/tables
  - Use `[(Database)]` for database systems

- **Always show the return path** from external systems when relevant (responses, acknowledgments)

## Styling Best Practices

- **Always initialize dark theme** for dark background compatibility:
  ```
  %%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#1e1e1e', 'primaryTextColor': '#fff', 'lineColor': '#888'}}}%%
  ```

- **Apply high-contrast styling classes** (optimized for dark backgrounds):
  ```
  classDef actor fill:#00d4ff,stroke:#00ffff,stroke-width:3px,color:#000
  classDef process fill:#ffd700,stroke:#ffea00,stroke-width:2px,color:#000
  classDef decision fill:#ff69b4,stroke:#ff1493,stroke-width:3px,color:#000
  classDef external fill:#4fc3f7,stroke:#29b6f6,stroke-width:2px,color:#000
  classDef database fill:#69f0ae,stroke:#00e676,stroke-width:3px,color:#000
  classDef queue fill:#ffab40,stroke:#ff9100,stroke-width:2px,color:#000
  classDef status fill:#ce93d8,stroke:#ba68c8,stroke-width:2px,color:#000
  classDef error fill:#ff5252,stroke:#ff1744,stroke-width:3px,color:#fff
  ```

- **Color scheme reference** (high-contrast for dark mode):

  | Element | Fill Color | Purpose |
  |---------|------------|---------|
  | actor | `#00d4ff` (Cyan) | Human actors, users |
  | process | `#ffd700` (Gold) | Processing steps, handlers |
  | decision | `#ff69b4` (Hot Pink) | Decision diamonds |
  | external | `#4fc3f7` (Light Blue) | External systems, APIs |
  | database | `#69f0ae` (Bright Green) | Database, storage |
  | queue | `#ffab40` (Orange) | Async queues, message bus |
  | status | `#ce93d8` (Purple) | Status nodes, states |
  | error | `#ff5252` (Red) | Error states, failures |

- **Text color rules**:
  - Use `color:#000` (black text) for bright fills
  - Use `color:#fff` (white text) for dark fills like error states
  - ALWAYS specify text color explicitly for readability

- **Color code by component type** for quick visual scanning

## Common Mistakes to Avoid

- **NEVER leave queues disconnected** from their consumers or final destinations
- **NEVER create nodes that have no outgoing connections** (dead ends) unless they're explicit terminal states
- **NEVER use implementation details as node names** - Use business/domain terminology
- **AVOID showing every method call** - Abstract to the level appropriate for the diagram's purpose

