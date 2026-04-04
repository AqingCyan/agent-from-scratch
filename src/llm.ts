import type { AIMessage } from '../types'
import { openai } from './ai'

export const runLLM = async ({ messages }: { messages: AIMessage[] }) => {
  const response = await openai.chat.completions.create({
    model: 'MiniMax-M2.7',
    temperature: 0.1,
    messages,
  })
  return response.choices[0].message.content
}
