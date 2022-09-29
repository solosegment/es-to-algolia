import chalk from "chalk"
import fs from "fs"
import path from "path"
export { fs }
export function roughSizeOfObject(object: any) {
	var objectList = []
	var stack = [object]
	var bytes = 0

	while (stack.length) {
		var value = stack.pop()

		if (typeof value === "boolean") {
			bytes += 4
		} else if (typeof value === "string") {
			bytes += value.length * 2
		} else if (typeof value === "number") {
			bytes += 8
		} else if (
			typeof value === "object" &&
			objectList.indexOf(value) === -1
		) {
			objectList.push(value)

			for (var i in value) {
				stack.push(value[i])
			}
		}
	}
	return bytes
}

export const appendArrayToFile = (
	fileName: string,
	sources: any[],
	options?: Partial<{ folder: string }>
) => {
	const indicesPath = path.join(__dirname, `/indices/`)
	const filePath = path.join(indicesPath, fileName)
	if (options?.folder) {
		!fs.existsSync(path.join(indicesPath, options?.folder))
	}
	if (!fs.existsSync(indicesPath)) {
		fs.mkdirSync(indicesPath)
	}

	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, JSON.stringify([...sources], null, 2), {
			encoding: "utf-8",
		})
	} else {
		const fileData = fs.readFileSync(filePath, "utf-8")

		const formatted: any[] = JSON.parse(fileData)
		l()(`Entries in file: `, chalk.magenta(formatted.length))
		formatted.push(...sources)
		fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2), "utf-8")
	}
}

export const tryIndexFileRemoval = (fileName: string) => {
	try {
		const indicesPath = path.join(__dirname, `/indices/`)
		const filePath = path.join(indicesPath, fileName)
		fs.rmSync(filePath)
		console.log("Removed Old Index File...")
	} catch (err) {}
}

// export function l(): (...msg: any[]) => undefined
// export function l(...msg: any[]): undefined
export function l(...msg: any[]) {
	const write = process.stdout.writable ? console.log : console.log
	let start = 0
	// the return function for verbose log
	const ret = (...msg: any[]) => {
		if (process.argv.includes("--verbose") || !!process.env.VERBOSE) {
			write(`[🐞-verbose]`, ...msg.slice(start))
		}
	}

	if (msg[0] === "debug") {
		start = 1
		msg = msg.slice(start)
		write(`[🐞]`, ...msg.slice(start))
	}
	if (msg.length !== 0) {
		write(...msg.slice(start))
	}
	return ret
}
