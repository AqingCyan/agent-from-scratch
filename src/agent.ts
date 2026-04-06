import { addMessage, getMessages, saveToolResponse } from './memory'
import { runLLM } from './llm'
import { logMessage, showLoader } from './ui'
import { runTool } from './toolRunner'
import type OpenAI from 'openai'

type ToolCall = OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall

export const runAgent = async ({
  userMessage,
  tools,
}: {
  userMessage: string
  tools: any[]
}) => {
  await addMessage([{ role: 'user', content: userMessage }])

  const loader = showLoader('💭 Thinking...')

  while (true) {
    const history = await getMessages()
    const response = await runLLM({ messages: history, tools })

    await addMessage([response])

    logMessage(response)

    if (response.content && !response.tool_calls) {
      loader.stop()
      return getMessages()
    }

    if (response.tool_calls) {
      const toolCall = response.tool_calls[0] as ToolCall

      loader.update(`⚙️ Executing tool call: ${toolCall.function.name}...`)

      const toolResponse = await runTool(toolCall, userMessage)
      await saveToolResponse(toolCall.id, toolResponse)

      loader.update(
        `✅ Tool response: ${toolCall.function.name} => ${toolResponse}`,
      )
    }
  }
}
