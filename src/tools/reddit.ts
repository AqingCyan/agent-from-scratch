import type { ToolFn } from '../../types'
import z from 'zod'
import { fetch } from 'bun'

export const redditToolDefinition = {
  name: 'reddit',
  parameters: z.object({}),
  description: 'Get the latest posts from Reddit',
}

type Args = z.infer<typeof redditToolDefinition.parameters>

export const redditTool: ToolFn<Args, string> = async ({ toolArgs }) => {
  const response = await fetch('https://www.reddit.com/r/nba/.json')
  const json = (await response.json()) as {
    data: {
      children: Array<{
        data: {
          title: string
          url: string
          subreddit_name_prefixed: string
          author: string
          ups: number
        }
      }>
    }
  }
  const { data } = json

  const relevantPosts = data.children.map((post) => ({
    title: post.data.title,
    url: post.data.url,
    subreddit: post.data.subreddit_name_prefixed,
    author: post.data.author,
    upvotes: post.data.ups,
  }))

  return JSON.stringify(relevantPosts, null, 2)
}
