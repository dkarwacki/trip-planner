# Mermaid Diagram – Business Process Flowchart

You are an experienced software architect. Your task is to create a Mermaid diagram visualizing a selected business process based on the provided code and contextual information.

The diagram must be written to the following file: [destination file path]

You may refer to the following files or sources to understand the process implementation and business context:

<file_references>
[all usefull file references]
</file_references>

<business_process>
[name of the business process]
</business_process>

Your task is to analyze the business process, the source code, and the provided context, then produce a comprehensive Mermaid diagram representing the full workflow. All diagram labels must be in English.

**Important:** Follow @.cursor/commands/mermaid-flowchart-rules.md for Mermaid syntax, styling, and best practices throughout this process.

## Step 1: Architecture Analysis

Before generating the diagram, perform an analysis and place it inside <architecture_analysis> tags:

1. **List all relevant elements** found in the code or documentation:
   - Domain concepts (e.g. Customer, Order, Payment)
   - Aggregates, entities, domain services
   - Handlers (HTTP, queue, scheduler), jobs, workflows
   - Domain events, commands, messages

2. **Identify main stages** of the business process:
   - Steps (e.g. Validate request, Create order)
   - Modules implementing each step
   - Actors (user, admin, external system, scheduled job)

3. **Describe data and event flow**:
   - What data is passed between steps
   - Synchronous vs asynchronous behavior
   - Integrations with external systems or databases

4. **Provide short descriptions** for all steps, components, or systems that will appear in the diagram.

## Step 2: Build the Diagram

Include the following elements:
- Full end-to-end business process
- All major business steps in order
- Components, services, and modules implementing each step
- Actors interacting with the process
- External systems, queues, schedulers, databases
- Direction of data and event flow
- Subgraphs grouping elements by layer or responsibility
- Dependencies on other workflows or modules

**Apply @.cursor/commands/mermaid-flowchart-rules.md** for:
- Arrow types (sync vs async flows)
- Node shapes for different component types
- Styling classes and color coding
- Connection completeness (queues must connect to destinations)

## Step 3: Review

After generating the diagram, review against @.cursor/commands/mermaid-flowchart-rules.md to ensure:
- Correct Mermaid syntax and rendering
- Complete data flow paths (no disconnected queues or dead ends)
- Appropriate abstraction level for the diagram's purpose
- Proper styling and arrow types for component types

Reorganize or simplify if needed.

Return the final diagram wrapped inside <mermaid_diagram> tags.
