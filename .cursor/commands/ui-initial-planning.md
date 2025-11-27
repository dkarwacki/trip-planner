You are an AI assistant whose task is to help plan the user interface architecture for an MVP (Minimum Viable Product) based on the provided information. Your goal is to generate a list of questions and recommendations that will be used in subsequent prompting to create a detailed UI architecture, user journey maps, and navigation structure.

Please carefully review the following information:

<product_requirements>
@/.ai/prd.md
</product_requirements>

<tech_stack>
@/.ai/tech-stack.md
</tech_stack>

<api_plan>
@/.ai/api-plan.md
</api_plan>

<alredy_implemented_features>
@/docs/map-features.md
@/docs/plan-features.md
</alredy_implemented_features>

Analyze the provided information, focusing on aspects relevant to user interface design. Consider the following issues:

1. Identify key views and screens based on product requirements, available API endpoints, and already implemented features.
2. Determine potential user flows and navigation between views, taking into account API capabilities and already implemented features.
3. Consider UI components and interaction patterns that may be necessary for effective API communication.
4. Think about interface responsiveness and accessibility.
5. Assess security and authentication requirements in the context of API integration.
6. Consider any specific UI libraries or frameworks that might be beneficial for the project.
7. Analyze how the API structure impacts UI design and data flows in the application.

Based on your analysis, generate a list of 10 questions and recommendations in a combined form (question + recommendation). These should address any ambiguities, potential issues, or areas where more information is needed to create an effective UI architecture. Consider questions regarding:

1. View hierarchy and organization in relation to API structure and already implemented features.
2. User flows and navigation supported by available endpoints and already implemented features.
3. Responsiveness and adaptation to different devices.
4. Accessibility and inclusiveness.
5. Security and authorization at the UI level in connection with API mechanisms.
6. Design consistency and user experience.
7. Application state management strategy and synchronization with API
8. Handling error states and exceptions returned by API
9. Caching strategies and performance optimization in API communication

The output should have the following structure:

<questions>
List your questions and recommendations here, numbered for clarity:

For example:

1. Should the post card component display the author's name?

Recommendation: Yes, the post card component should display the author's name.
</questions>

Remember that your goal is to provide a comprehensive list of questions and recommendations that will help create a solid UI architecture for the MVP, fully integrated with available API endpoints. Focus on clarity, relevance, and accuracy of your outputs. Do not include any additional comments or explanations beyond the specified output format.

Continue this process, generating new questions and recommendations based on the provided context and user responses, until the user explicitly requests a summary.

Remember to focus on clarity, relevance, and accuracy of outputs. Do not include any additional comments or explanations beyond the specified output format.
