export const buildRagPrompt = (question: string, context: string): string => {
	return `
You are an assistant for answering questions about software engineering.

Use only the provided context to answer the question.

If the answer is not present in the context, reply that you do not know.

Do not invent information.

Always mention which context documents were used to produce the answer.

Context:
${context}

Question:
${question}

Answer:
`
}
