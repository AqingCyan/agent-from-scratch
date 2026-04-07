import type { ToolFn } from '../../types'
import z from 'zod'
import { fetch } from 'bun'

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

type MiniMaxImageGenerationResponse = {
  data?: {
    image_urls?: string[]
  }
  base_resp?: {
    status_code?: number
    status_msg?: string
  }
}

const getMiniMaxImageGenerationUrl = () => {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.minimaxi.com/v1'
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')

  if (normalizedBaseUrl.endsWith('/image_generation')) {
    return normalizedBaseUrl
  }

  return normalizedBaseUrl.endsWith('/v1')
    ? `${normalizedBaseUrl}/image_generation`
    : `${normalizedBaseUrl}/v1/image_generation`
}

export const generateImageTool: ToolFn<Args, string> = async ({
  toolArgs,
  userMessage,
}) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY for MiniMax image generation')
  }

  const response = await fetch(getMiniMaxImageGenerationUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'image-01',
      prompt: toolArgs.prompt,
      aspect_ratio: '1:1',
      response_format: 'url',
      n: 1,
      prompt_optimizer: true,
    }),
  })

  const data = (await response.json()) as MiniMaxImageGenerationResponse

  if (
    !response.ok ||
    (data.base_resp?.status_code !== undefined &&
      data.base_resp.status_code !== 0)
  ) {
    throw new Error(
      `MiniMax image generation failed: ${
        data.base_resp?.status_msg ?? response.statusText
      }`,
    )
  }

  const imageUrl = data.data?.image_urls?.[0]

  if (!imageUrl) {
    throw new Error('MiniMax image generation failed: no image URL returned')
  }

  return imageUrl
}
