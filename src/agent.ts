import type { AIMessage } from '../types'
import { addMessage, getMessages } from './memory'
import { runLLM } from './llm'
import { showLoader, logMessage } from './ui'

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  await addMessage([{ role: 'user', content: userMessage }])

  const loader = showLoader('💭 Thinking...')
  const history = await getMessages()

  const response = await runLLM({ messages: history, tools })

  if (response.tool_calls) {
    console.log(response.tool_calls)
  }

  await addMessage([response])

  logMessage(response)
  loader.stop()
  return getMessages()
}
