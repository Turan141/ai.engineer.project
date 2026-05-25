# Modern Web Development

Modern web applications are built using JavaScript and TypeScript.
TypeScript extends JavaScript by adding static type checking.
This helps developers catch errors before running the application.

## React

React is a JavaScript library for building user interfaces.
Applications are composed of reusable components.
Each component manages its own logic and rendering behavior.

State represents data that can change during the lifetime of a component.
When state changes, React automatically updates the user interface.

The useEffect hook allows components to perform side effects.
Typical use cases include API requests, subscriptions, timers, and event listeners.
Effects run after rendering and can optionally clean up resources.

The Context API provides a mechanism for sharing data across multiple components.
This helps avoid excessive prop drilling in large applications.

## Node.js

Node.js allows JavaScript to run outside the browser.
It uses an event-driven architecture and a non-blocking I/O model.
This makes it suitable for scalable network applications.

Express is one of the most popular frameworks for building HTTP APIs with Node.js.
Routes define how requests are handled.
Middleware can intercept requests before they reach route handlers.

## Databases

PostgreSQL is a relational database management system.
Data is stored in tables consisting of rows and columns.

Indexes improve query performance by reducing the amount of data that must be scanned.
Poor indexing strategies can negatively affect performance.

Transactions ensure consistency and reliability when multiple operations are executed together.

## Artificial Intelligence

Embeddings convert text into numerical vectors.
Texts with similar meanings produce vectors that are close to one another in vector space.

Cosine similarity measures the angle between vectors.
It is commonly used in semantic search systems.

Retrieval-Augmented Generation (RAG) combines vector search with large language models.
Relevant chunks are retrieved from a knowledge base and inserted into the prompt before generation.

Chunk overlap helps preserve context between neighboring text chunks.
Without overlap, important information may be split across chunk boundaries.

## Software Architecture

Dependency Injection improves modularity and testability.
Components receive their dependencies from the outside rather than creating them internally.

Interfaces allow different implementations to be swapped without changing business logic.

The Provider Pattern is commonly used when multiple implementations of the same capability exist.
For example, an application may support both Gemini and LM Studio through a shared interface.
