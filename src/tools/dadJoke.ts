import z from 'zod'
import type { ToolFn } from '../../types'
import { fetch } from 'bun'

export const dadJokeToolDefinition = {
  name: 'dad_joke',
  parameters: z.object({}),
  description: 'Get a dad joke',
}

type Args = z.infer<typeof dadJokeToolDefinition.parameters>

export const dadJokeTool: ToolFn<Args, string> = async ({ toolArgs }) => {
  const res = await fetch('https://icanhazdadjoke.com/', {
    headers: {
      Accept: 'application/json',
    },
  })
  const data = (await res.json()) as { joke: string }
  return data.joke
}
