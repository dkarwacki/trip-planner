You are tasked with creating a comprehensive, high-quality test plan for a software feature. Your test plan should be thorough, contextually appropriate for the project, and based on a deep understanding of how the feature works and how it's implemented.

Here is a research document that explains how this feature works:

<feature_research>
{{FeatureResearch}}
</feature_research>

Here is a list of files that implement this feature:

<files_list>
{{FilesList}}
</files_list>

Here is the feature you need to create a test plan for:

<feature_name>
{{FeatureName}}
</feature_name>

Your task is to generate a comprehensive test plan for this feature. Follow these steps:

1. **Analyze the Feature Research**: Carefully read through the research document to understand:
   - What the feature does
   - How it's supposed to work
   - Key behaviors and functionality
   - Any dependencies or integrations
   - User interactions or workflows

2. **Review the Implementation Files**: Examine the files list to understand:
   - Which components are involved
   - The technical architecture
   - Potential integration points
   - Areas that might be complex or error-prone

3. **Plan Your Test Coverage**: Before writing the test plan, work through the following in <test_planning> tags inside your thinking block:
   - Extract and list the key functionalities from the feature research document
   - List each implementation file and note what aspect of the feature it likely handles
   - Map the functionalities to the relevant files to understand what needs testing
   - Brainstorm test scenarios for:
     * Core functionality (the main use cases)
     * Edge cases and boundary conditions
     * Error scenarios and exception handling
     * Integration points between components
     * Performance or security considerations if applicable
   - Consider how different files interact and what integration tests are needed
   - It's OK for this section to be quite long.

4. **Ensure Quality and Context**: As you plan, make sure your test plan:
   - Covers all critical functionality described in the research
   - Accounts for the actual implementation reflected in the files list
   - Is appropriate for the project context
   - Includes both positive and negative test cases
   - Considers real-world usage scenarios

5. **Structure Your Test Plan**: After your planning work, write the final test plan in <test_plan> tags. Your test plan should include:
   - **Test Objectives**: What you're trying to validate
   - **Scope**: What's included and excluded from testing
   - **Test Cases**: Organized by category, each with:
     - Test Case ID and Name
     - Preconditions
     - Test Steps
     - Expected Results
     - Priority (High/Medium/Low)
   - **Edge Cases and Boundary Conditions**: Special scenarios to test
   - **Integration Testing**: How this feature interacts with other components
   - **Dependencies**: Any prerequisites or related features
   - **Test Data Requirements**: What data is needed for testing

Example structure (your actual content should be specific to the feature):

<test_plan>
## Test Objectives
[Clearly state what aspects of the feature need validation]

## Scope
**In Scope**: [What will be tested]
**Out of Scope**: [What won't be tested]

## Test Cases

### Category 1: [e.g., Core Functionality]
**TC-001: [Test Case Name]**
- Priority: High
- Preconditions: [Setup required]
- Steps:
  1. [Step 1]
  2. [Step 2]
- Expected Results: [What should happen]

[More test cases...]

### Category 2: [e.g., Error Handling]
[Test cases...]

## Edge Cases and Boundary Conditions
[Special scenarios...]

## Integration Testing
[How this feature interacts with others...]

## Dependencies
[Prerequisites and related features...]

## Test Data Requirements
[Data needed for testing...]
</test_plan>

Begin by analyzing the provided information in your thinking block to ensure your test plan is comprehensive and contextually appropriate. Your final output should consist only of the test plan in <test_plan> tags and should not duplicate or rehash any of the planning work you did in the thinking block.