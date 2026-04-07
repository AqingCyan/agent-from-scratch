import type { ToolFn } from '../../types'
import z from 'zod'
import { openai } from '../ai'

export const generateImageToolDefinition = {
  name: 'generate_image',
  description: 'Generate an image based on the given prompt',
  parameters: z.object({
    prompt: z
      .string()
      .describe(
        `Prompt for the image. Be sure to consider the user's original message when making the image. If you are unsure, then as the user to provide more details.`,
      ),
  }),
}

type Args = z.infer<typeof generateImageToolDefinition.parameters>

export const generateImageTool: ToolFn<Args, string> = async ({
  toolArgs,
  userMessage,
}) => {
  const response = await openai.images.generate({
    model: 'image-01',
    prompt: toolArgs.prompt,
    n: 1,
    size: '1024x1024',
  })

  return response.data?.[0].url ?? ''
}
