import path from "path"
import { fs, l } from "./lib/helpers"
import { parseIndex } from "./lib/parser"

const execute = async (node?: string, indexId?: string) => {
	try {
		if (node && indexId) {
			const index = await parseIndex(node, indexId)
			l("Completed parse")
			return index
		}
		throw new Error("Failed to send upper message")
	} catch (err) {
		console.error(err)
		// console.log(
		// 	`Usage: ts-node spawn http://10.10.10.10:9200 my-ElesticSearch-index-id`
		// )
	}
}
process.on("message", (message) => {
	if (message === "parse") {
		l()("Parse Session Started!")
		execute(process.env.NODE, process.env.INDEX_ID).then((index) => {
			if (process.send) {
				l()("sending to parent...")
				process.send(index)

				return
			}
			l("backup exit")
			// process.emit("message", index)
		})
	}
})

// execute()
