import chalk from "chalk"
import { ChildProcess, fork } from "child_process"
import dotenv from "dotenv"
import yaml from "js-yaml"
import path from "path"

dotenv.config()

import { fs, l } from "./lib/helpers"
import { parseIndex } from "./lib/parser"
import { clientIndexesDefault, ClientIndexObjectSchema } from "./lib/schema"
import { IndexResultMetaData } from "./types"

// subprocess reference
const children: ChildProcess[] = []
const PARALLEL = process.argv.includes("--parallel")
process.on("beforeExit", () => {
	children.forEach((child) => {
		child.kill()
	})
	console.log(chalk.bgGreen("cleaned"))
	children.length = 0
})
const run = async () => {
	const things: Promise<IndexResultMetaData>[] = []
	const results: IndexResultMetaData[] = []
	let clientIndexes = clientIndexesDefault
	// grab the data
	try {
		if (fs.existsSync(`${__dirname}/clients.yaml`)) {
			// parse yml file
			const yamlData = yaml.load(
				fs.readFileSync(`${__dirname}/clients.yaml`, "utf-8")
			)

			clientIndexes = ClientIndexObjectSchema.parse(yamlData)

			l("Found client index config!")(clientIndexes)
		}
	} catch (err) {
		l(`Couldn't find the config; proceeding with default...`)
	}

	// try to parse through the client list, create a subprocess to execute an index parse an index
	for (let index of clientIndexes) {
		try {
			l(
				chalk.bgCyan(
					`Parsing index for ${chalk.underline(index.clientName)}`
				)
			)
			if (PARALLEL) {
				// const forked = fork(path.join(__dirname, `spawn`), {
				// 	stdio: "inherit",
				// 	env: {
				// 		NODE: index.node,
				// 		INDEX_ID: index.indexId,
				// 		VERBOSE: "true",
				// 	},
				// })
				// forked.stdout?.pipe(process.stdout)
				// // forked.stdout?.on('data')
				// const forkConsume = (data: IndexResultMetaData) => {
				// 	l(chalk.green("received data!"))
				// 	results.push({ ...data, client: index.clientName })
				// 	forked.kill("SIGHUP")
				// 	const newChildren = children.filter(
				// 		(child) => !child.killed
				// 	)
				// 	children.length = 0
				// 	children.push(...newChildren)
				// }
				// forked.stdout?.on("data", forkConsume)
				// forked.on("message", forkConsume)

				// forked.send("parse")
				// children.push(forked)
				things.push(parseIndex(index.node, index.indexId))
			} else {
				const data = await parseIndex(index.node, index.indexId)
				results.push({ ...data, clientName: index.clientName })
			}
		} catch (err) {
			l(`Failed to run parse on ${index.clientName} Index`, err)
		}
	}

	const printRunInfo = () => {
		// print out run info
		results.forEach((result) => {
			l(chalk.bgBlue.white(`Client Index: ${result.clientName}`))
			l(
				`Final data size: `,
				chalk.bgGray(
					`${(result.indexSize / 1024).toFixed(2)}Kb ${
						result.indexSize
					} bytes`
				)
			)
			l(
				chalk.bgGreen(
					`${
						result.successfulEntries - result.tooLargeEntries
					} successful entries`
				)
			)
			l(
				chalk.bgRed(
					`${result.tooLargeEntries} rejected ("too large") entries`
				)
			)
			l("")
		})
	}

	if (PARALLEL) {
		// wait for subprocesses to complete
		// while (children.length > 0) {
		// 	if (children.length === 0) {
		// 		l("Bong")
		// 		break
		// 	}
		// 	// l("waiting...", children)
		// }
		const race = await Promise.allSettled(things)
		race.forEach((result) => {
			if (result.status === "fulfilled") {
				const data = result.value
				results.push({ ...data })
			}
		})
		printRunInfo()
	}
	l(`yuh`)

	printRunInfo()
	l("Complete!")
}

run()
