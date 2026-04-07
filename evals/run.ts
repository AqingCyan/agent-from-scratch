import 'dotenv/config'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readdir } from 'fs/promises'

/** ESM 环境下没有 __dirname，这里手动还原当前文件所在目录。 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * eval 运行入口：
 * - `bun run evals/run.ts foo` 只执行 `experiments/foo.eval.ts`
 * - 不传参数时执行 `experiments` 目录下所有 `.eval.ts`
 */
const main = async () => {
  const evalName = process.argv[2]
  const experimentsDir = join(__dirname, 'experiments')

  try {
    if (evalName) {
      /** 按名称定向执行单个实验文件。 */
      const evalPath = join(experimentsDir, `${evalName}.eval.ts`)
      await import(evalPath)
    } else {
      /** 扫描 experiments 目录，批量执行所有 eval 文件。 */
      const files = await readdir(experimentsDir)
      const evalFiles = files.filter((file) => file.endsWith('.eval.ts'))

      for (const evalFile of evalFiles) {
        /** 通过动态 import 触发每个 eval 文件内部的执行逻辑。 */
        const evalPath = join(experimentsDir, evalFile)
        await import(evalPath)
      }
    }
  } catch (error) {
    /** 统一输出失败信息，方便定位是哪个 eval 没有跑起来。 */
    console.error(
      `Failed to run eval${evalName ? ` '${evalName}'` : 's'}:`,
      error,
    )
    process.exit(1)
  }
}

main()
