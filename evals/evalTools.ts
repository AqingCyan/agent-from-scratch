import 'dotenv/config'
import type { Score, Scorer } from 'autoevals'
import chalk from 'chalk'
import { JSONFilePreset } from 'lowdb/node'

/** 单次样本执行结果：输入、模型输出、期望值以及各个 scorer 的得分。 */
type Run = {
  input: any
  output: any
  expected: any
  scores: {
    name: Score['name']
    score: Score['score']
  }[]
  createdAt?: string
}

/** 一轮实验集合，通常对应一次完整的 eval 执行。 */
type Set = {
  runs: Run[]
  score: number
  createdAt: string
}

/** 某个实验名下的历史记录，会保存多轮执行结果。 */
type Experiment = {
  name: string
  sets: Set[]
}

/** lowdb 持久化到 results.json 的顶层结构。 */
type Data = {
  experiments: Experiment[]
}

/** eval 任务支持两种返回值：纯字符串，或带检索上下文的结构化结果。 */
type EvalTaskResult =
  | string
  | {
      response: string
      context: string | string[]
    }

const defaultData: Data = {
  experiments: [],
}

/** 获取 results.json 对应的 lowdb 实例。 */
const getDb = async () => {
  const db = await JSONFilePreset<Data>('results.json', defaultData)
  return db
}

/** 计算一组 runs 的平均分。单个 run 先对多个 scorer 求均值，再对所有 run 求均值。 */
const calculateAvgScore = (runs: Run[]) => {
  if (runs.length === 0) {
    return 0
  }

  const totalScores = runs.reduce((sum, run) => {
    if (run.scores.length === 0) {
      return sum
    }

    const runAvg =
      run.scores.reduce((sum, score) => sum + (score.score ?? 0), 0) /
      run.scores.length
    return sum + runAvg
  }, 0)
  return totalScores / runs.length
}

/** 判断任务结果是否带有 context / response 这类结构化字段。 */
const hasContextResult = (
  result: EvalTaskResult,
): result is Extract<EvalTaskResult, { response: string; context: string | string[] }> =>
  typeof result === 'object' && result !== null

/** 按实验名读取历史实验记录，供对比上一次得分时使用。 */
export const loadExperiment = async (
  experimentName: string,
): Promise<Experiment | undefined> => {
  const db = await getDb()
  return db.data.experiments.find((e) => e.name === experimentName)
}

/** 保存本轮 eval 结果；若实验已存在则追加一轮，否则创建新实验。 */
export const saveSet = async (
  experimentName: string,
  runs: Omit<Run, 'createdAt'>[],
) => {
  const db = await getDb()

  const runsWithTimestamp = runs.map((run) => ({
    ...run,
    createdAt: new Date().toISOString(),
  }))

  const newSet = {
    runs: runsWithTimestamp,
    score: calculateAvgScore(runsWithTimestamp),
    createdAt: new Date().toISOString(),
  }

  const existingExperiment = db.data.experiments.find(
    (e) => e.name === experimentName,
  )

  if (existingExperiment) {
    existingExperiment.sets.push(newSet)
  } else {
    db.data.experiments.push({
      name: experimentName,
      sets: [newSet],
    })
  }

  await db.write()
}

/**
 * 执行一组 eval 数据：
 * 1. 对每条 data 调用 task
 * 2. 用 scorers 对结果评分
 * 3. 打印和上一次实验的分数对比
 * 4. 将本轮结果持久化到 results.json
 */
export const runEval = async <T extends EvalTaskResult = EvalTaskResult>(
  experiment: string,
  {
    task,
    data,
    scorers,
  }: {
    task: (input: any) => Promise<T>
    data: { input: any; expected?: T; reference?: string | string[] }[]
    scorers: Scorer<
      T,
      { input: any; reference?: string | string[]; context?: string | string[] }
    >[]
  },
) => {
  const results = await Promise.all(
    data.map(async ({ input, expected, reference }) => {
      /** 模型/任务对当前样本的实际输出。 */
      const results = await task(input)
      let context: string | string[]
      let output: string

      if (hasContextResult(results)) {
        /** 结构化结果通常用于 RAG 类任务，context 会传给 scorer 做额外评估。 */
        context = results.context
        output = results.response
      } else {
        output = results
      }

      const scores = await Promise.all(
        scorers.map(async (scorer) => {
          /** 每个 scorer 独立评估同一个样本，最后汇总到 scores 数组。 */
          const score = await scorer({
            input,
            output: results,
            expected,
            reference,
            context,
          })
          return {
            name: score.name,
            score: score.score,
          }
        }),
      )

      const result = {
        input,
        output,
        expected,
        scores,
      }

      return result
    }),
  )

  /** 与上一轮实验结果对比，便于观察 prompt / 模型改动是否让效果变好。 */
  const previousExperiment = await loadExperiment(experiment)
  const previousScore =
    previousExperiment?.sets[previousExperiment.sets.length - 1]?.score || 0
  const currentScore = calculateAvgScore(results)
  const scoreDiff = currentScore - previousScore

  const color = previousExperiment
    ? scoreDiff > 0
      ? chalk.green
      : scoreDiff < 0
        ? chalk.red
        : chalk.blue
    : chalk.blue

  console.log(`Experiment: ${experiment}`)
  console.log(`Previous score: ${color(previousScore.toFixed(2))}`)
  console.log(`Current score: ${color(currentScore.toFixed(2))}`)
  console.log(
    `Difference: ${scoreDiff > 0 ? '+' : ''}${color(scoreDiff.toFixed(2))}`,
  )
  console.log()

  await saveSet(experiment, results)

  return results
}
