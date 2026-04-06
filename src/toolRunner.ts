import type OpenAI from 'openai'

const getWeather = () => 'very cold. 17deg'

export const runTool = async (
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userMessage: string,
) => {
  if (toolCall.type !== 'function') {
    throw new Error(`Unsupported tool type: ${toolCall.type}`)
  }

  const input = {
    userMessage,
    toolArg: JSON.stringify(toolCall.function.arguments || '{}'),
  }

  switch (toolCall.function.name) {
    case 'getWeather':
      return getWeather()
    default:
      throw new Error(`Unknown tool: ${toolCall.function.name}`)
  }
}
