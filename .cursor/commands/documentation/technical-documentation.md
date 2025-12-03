# Technical Documentation Generator

You are an experienced technical writer. Your task is to create comprehensive technical documentation for a feature or system based on the provided code references and context.

## Output Location

The documentation MUST be written to: **DESTINATION**

## Input Context

<file_references>
(User provides file paths or code references here)
</file_references>

<destination>
.ai/docs/FEATURE_NAME/FEATURE_NAME-doc.md
</destination>

<feature_name>
(User describes the feature/system to document)
</feature_name>

---

## Documentation Template

**ALWAYS** follow this exact structure from the @.ai/docs/subaccounts/DSE-Technical Documentation Template-021225-192726.pdf. Do not skip sections. Use placeholders `[User input with ... needed]` for information that requires manual input.

```markdown
# [Feature Name] - Technical Documentation

**Document Version:** v1.0  
**Last Updated:** [User input with date needed]  
**Author:** [User input with author name needed]  
**Reviewed By:** [User input with reviewer name needed]

---

## 1. Overview

**Feature Name:** [Name]  
**Component/Module:** [System or service area]  
**Release Version:** [User input with release version needed]

### Summary

[Clear, high-level explanation of the feature. State purpose, problem solved, and intended users.]

**Problem Solved:** [What problem this feature addresses]

**Intended Users:**
| Actor | Role |
|-------|------|
| ... | ... |

---

## 2. Design and Architecture

### 2.1 System Flow

[Step-by-step description of how the feature works within the system]

1. **Step Name**: Description
2. **Step Name**: Description
...

> **[DIAGRAM PLACEHOLDER]**
> - **Diagram Name:** [Name of diagram]
> - **Diagram Type:** [Flowchart/Sequence Diagram/ERD/State Machine]
> - **Description:** [What the diagram should show]

#### Validation Chain

[Document ALL validations performed in order]

| Step | Validation | Method | Error Message | Description |
|------|------------|--------|---------------|-------------|
| 1 | ... | `methodName()` | `errorMessage` | ... |

#### State Machine

[If applicable, document all state transitions]

```
State1 → State2 → State3 (trigger)
       → State4 (alternative trigger)
```

> **[DIAGRAM PLACEHOLDER]**
> - **Diagram Name:** [Entity] Status Workflow
> - **Diagram Type:** State Machine Diagram
> - **Description:** All status transitions with triggers and conditions

#### Status Determination Logic

[Document conditions that determine outcomes]

| Condition 1 | Condition 2 | Result |
|-------------|-------------|--------|
| ... | ... | ... |

#### Entity Lifecycle

[Document when related entities are created/updated]

| Scenario | Entity Created | Key Fields | Notes |
|----------|----------------|------------|-------|
| ... | Yes/No | ... | ... |

#### Integration Flow

[Document external service interactions if applicable]

```
Handler
    └─> ServiceA.method()
        └─> ServiceB.method()
            └─> External API
```

### 2.2 Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| ... | External/Internal | ... |

---

## 3. Technical Details

### 3.1 Data Model / Schema Changes

[List ALL entities with ALL their fields]

**[EntityName]**

| Field | Type | Description |
|-------|------|-------------|
| ... | ... | ... |

**[EnumName]**

| Value | ID | Description |
|-------|-----|-------------|
| ... | ... | ... |

### 3.2 Configuration

[Document environment variables, flags, or parameters]

**[ConfigName]** (`config.path`)

```hocon
config.path {
  field1 = defaultValue  # Description
  field2 = defaultValue  # Description
}
```

**Hardcoded Constants**

| Constant | Value | Location |
|----------|-------|----------|
| ... | ... | `path/to/file.scala` |

**Rate Limiting** (if applicable)

| Parameter | Value |
|-----------|-------|
| `limit` | ... |
| `timeStep` | ... |

### 3.3 Code Entry Points

[Document where in the codebase this feature starts execution]

| Entry Point | File | Description |
|-------------|------|-------------|
| `methodName()` | `path/to/file.scala` | ... |

**Scheduler Jobs** (if applicable)

| Job | Schedule | Class |
|-----|----------|-------|
| ... | ... | ... |

---

## 4. Testing and Validation

### 4.1 Test Coverage

[Organize by test type with bullet points listing what is tested - keep high-level and readable]

**Unit tests** (`path/to/TestFile.scala`):

- Tested logic or flow
- Tested validation
- Tested edge case

**Integration tests** (`path/to/tests/`):

- Tested end-to-end flow
- Tested service interaction

### 4.2 Monitoring and Alerts

**Metrics**

| Metric | Description |
|--------|-------------|
| `metric-name` | ... |

**Alerts**

[User input with alert configuration details needed]

---

## 5. Troubleshooting

### 5.1 Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| ... | ... | ... |

### 5.2 Logs and Metrics

**GCP Log Explorer Queries**

[Provide GCP Log Explorer queries for troubleshooting]

General Logs:
```
resource.type="k8s_container"
textPayload=~"LogPrefix:"
```

Error Logs:
```
resource.type="k8s_container"
textPayload=~"LogPrefix: Error"
severity>=ERROR
```

**Useful SQL Queries**

```sql
-- Query description
SELECT * FROM table WHERE condition;
```

---

## 6. Rollout and Maintenance

### 6.1 Deployment Notes

[Explain how the feature is deployed]

- **Service 1**: Contains X and Y
- **Service 2**: Contains Z

**Deployment Steps:**

1. Deploy X
2. Deploy Y
3. Verify configuration

### 6.2 Backward Compatibility

| Concern | Impact | Mitigation |
|---------|--------|------------|
| ... | ... | ... |

### 6.3 Future Enhancements

[User input with planned enhancements needed]

---

## 7. References

- **PRD:** [User input with PRD link needed]
- **Tech Specs:** [User input with Tech Specs link needed]
- **Jira Ticket:** [User input with Jira Epic link needed]
- **SOP:** [User input with SOP link needed]

### Key Files

| File | Purpose |
|------|---------|
| `path/to/file.scala` | ... |
```

---

## Documentation Generation Process

### Step 1: Analyze the Codebase

Before writing, analyze the provided code references to extract:

1. **Feature Overview**
   - What does the feature do?
   - What problem does it solve?
   - Who uses it?

2. **System Flow**
   - Entry points (handlers, endpoints, actors)
   - All validation steps in order
   - State transitions and decision logic
   - Entity creation/update conditions
   - External integrations

3. **Data Model**
   - Entity definitions (case classes, tables)
   - Enums and their values
   - Relationships between entities

4. **Configuration**
   - Configuration classes and defaults
   - Hardcoded constants
   - Environment-specific settings

5. **Error Handling**
   - Error messages and codes
   - Validation error messages
   - Failure scenarios

6. **Metrics & Monitoring**
   - Meter definitions
   - Log patterns and prefixes

7. **Test Coverage**
   - Identify what is tested (logic, flows, edge cases)
   - Organize by test type (unit vs integration)

### Step 2: Structure the Documentation

- **ALWAYS** follow the 7 main sections from the template
- **NEVER** skip sections - use `N/A` or `[User input needed]` if unavailable
- **Use tables** for structured data
- **Include diagram placeholders** with clear descriptions
- **Document ALL validations** in System Flow section
- **Document ALL status transitions** in System Flow section

### Step 3: Write with Precision

- **Be specific** - Reference actual file paths, method names, config keys
- **Be accurate** - Extract information directly from code
- **Be complete** - Document all entities, fields, configurations, validations
- **Be practical** - Include GCP queries and SQL for troubleshooting
- **Keep test coverage readable** - List what is tested at high level, not individual test cases

### Step 4: Add Placeholders

For information requiring manual input:
- `[User input with date needed]`
- `[User input with author name needed]`
- `[User input with PRD link needed]`

For diagrams:
```markdown
> **[DIAGRAM PLACEHOLDER]**
> - **Diagram Name:** [Descriptive name]
> - **Diagram Type:** [Flowchart/Sequence Diagram/ERD/State Machine]
> - **Description:** [What the diagram should illustrate]
```

---

## Quality Checklist

Before completing documentation, verify:

- [ ] All 7 sections are present (Overview, Design, Technical, Testing, Troubleshooting, Rollout, References)
- [ ] Section 2.1 includes validation chain with all validations
- [ ] Section 2.1 includes state machine if applicable
- [ ] Section 2.1 includes status determination logic if applicable
- [ ] Section 3.1 includes ALL entity fields
- [ ] Section 3.2 includes ALL configuration parameters
- [ ] Section 3.3 links to actual file paths
- [ ] Section 4.1 lists what is tested, organized by test type (unit/integration)
- [ ] Section 4.2 metrics match actual meter definitions
- [ ] Section 5.2 includes GCP Log Explorer queries
- [ ] Section 5.2 includes useful SQL queries
- [ ] Diagram placeholders have clear descriptions

---

## Example Reference

For documentation style example, see:
- @.ai/docs/subaccounts/subaccounts-technical-documentation.md
