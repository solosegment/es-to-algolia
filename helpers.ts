import fs from "fs"

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
		} else if (typeof value === "object" && objectList.indexOf(value) === -1) {
			objectList.push(value)

			for (var i in value) {
				stack.push(value[i])
			}
		}
	}
	return bytes
}

export const appendArrayToFile = (fileName: string, sources: any[], options?: Partial<{folder: string}>) => {
	if(options?.folder){
		!fs.existsSync(`${__dirname}${options?.folder}`)
	}
	if (!fs.existsSync(fileName)) {
		fs.writeFileSync(fileName, JSON.stringify([...sources], null, 2), {
			encoding: "utf-8",
		})
	} else {
		const fileData = fs.readFileSync(fileName, "utf-8")

		const formatted: any[] = JSON.parse(fileData)
		console.log(`entries in file: `, formatted.length)
		formatted.push(...sources)
		fs.writeFileSync(fileName, JSON.stringify(formatted, null, 2), "utf-8")
	}
}

export const tryFileRemoval = (fileName: string) => {
	try {
		fs.rmSync(fileName)
		console.log("Removed Old Index File...")
	} catch (err) {}
}
