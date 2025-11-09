You are a qualified TypeScript developer whose task is to create a library of DAO (Data Access Objects) for an application. Your task is to analyze the database model definitions and API plan, then create appropriate DAO types that accurately represent the data structures required by application logic while maintaining connection with the underlying database models.

First, carefully review the following inputs:

1. Database Models:
<database_models>
@src/infrastructure/common/database/types.ts
</database_models>

Your task is to create TypeScript type definitions for DAOs so that they can be easily used in application services, ensuring they are derived from database models. Execute the following steps:

1. Analyze database models.
2. Create DAO types using database entity definitions.
4. Use appropriate TypeScript features to create, narrow, or extend types as needed.
5. Perform a final check to ensure all DAOs are included and correctly connected to entity definitions.

Before creating the final output, work inside <dao_analysis> tags in your thinking block to show your thought process and ensure all requirements are met. In your analysis:
- For each DAO:
 - Identify corresponding database entities and any necessary type transformations.
  - Describe TypeScript features or utilities you plan to use.
  - Create a brief sketch of the DAO structure.
- Explain how you will ensure that each DAO is directly or indirectly connected to entity type definitions.

After conducting the analysis, provide final DAO type definitions that will appear in the appropriate src/infrastructure/:feature_name:/database/types.ts file. Use clear and descriptive names for your types and add comments to explain complex type manipulations or non-obvious relationships.

Remember:
- Each DAO should directly reference one or more database entities.
- Use TypeScript features such as Pick, Omit, Partial, etc., as needed.
- Add comments to explain complex or non-obvious type manipulations.

The final output should consist solely of DAOs type definitions that you will save in the src/infrastructure/:feature_name:/database/types.ts files, without duplicating or repeating any work done in the thinking block.