import { openai } from './ai'

export const runLLM = async ({ userMassage }: { userMassage: string }) => {
  const response = await openai.chat.completions.create({
    model: 'MiniMax-M2.7',
    temperature: 0.1,
    messages: [{ role: 'user', content: userMassage }],
  })
  return response.choices[0].message.content
}
