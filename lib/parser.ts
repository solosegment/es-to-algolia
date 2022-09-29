import { Client } from "@elastic/elasticsearch"
import chalk from "chalk"
import {
	appendArrayToFile,
	l,
	roughSizeOfObject,
	tryIndexFileRemoval,
} from "./helpers"

// 10 kilobytes
const maxBytes = 1024 * 100

export const parseIndex = async (
	indexNode: string = "http://10.10.10.88:9201",
	indexName: string = "ul-hybrid-20220726"
) => {
	const ESClient = new Client({ node: indexNode })
	const indexFileName = `index-${indexName}.json`
	const failedRecordsFileName = `index-${indexName}_tooLarge.json`
	const allHits: any[] = []
	const tooLargeHits: any[] = []
	const responseQueue = []
	let indexSize = 0

	// remove the files if they already exist
	tryIndexFileRemoval(indexFileName)
	tryIndexFileRemoval(failedRecordsFileName)

	try {
		const res = await ESClient.search({
			index: indexName,
			scroll: "30s",
			size: 1000,
			body: {
				query: {
					match_all: {},
				},
			},
		})

		responseQueue.push(res)

		while (responseQueue.length) {
			const qResponse = responseQueue.shift() ?? { body: undefined }

			if (qResponse && qResponse.body) {
				// collect the titles from this response
				const extractSource = (data: any) => data._source
				const sources = qResponse.body?.hits.hits
					.map(extractSource)
					.filter((item: any) => {
						let recordSize = roughSizeOfObject(item)
						if (recordSize > maxBytes) {
							l()(
								chalk.yellow(
									`Record too large! ${(
										recordSize / 1024
									).toFixed(2)}Kb (${recordSize} bytes)`
								)
							)
							const diff = recordSize - maxBytes
							l()(
								`Attempting to trim record by ${diff} bytes... `
							)

							// if the page_content length is smaller than the difference, return a blank string
							if (item.page_content) {
								item.page_content =
									(item.page_content as string)?.length < diff
										? ""
										: (item.page_content as string).slice(
												0,
												(item.text as string).length -
													diff
										  )

								// check the size
								if (recordSize < maxBytes) {
									l(
										chalk.green(
											`Resize Successful! ${(
												recordSize / 1024
											).toFixed(
												2
											)}Kb (${recordSize} bytes)\n`
										)
									)
									return true
								}
							}

							// if the text length is smaller than the difference, return a blank string
							item.text =
								(item.text as string).length < diff
									? ""
									: (item.text as string).slice(
											0,
											(item.text as string).length - diff
									  )
							recordSize = roughSizeOfObject(item)

							// check the size
							if (recordSize < maxBytes) {
								l()(
									chalk.green(
										`Resize Successful! ${(
											recordSize / 1024
										).toFixed(2)}Kb (${recordSize} bytes)\n`
									)
								)
								return true
							}

							// give up at this point
							l(
								chalk.red(
									`Record too large! Giving up... ${(
										recordSize / 1024
									).toFixed(2)}Kb (${recordSize} bytes)\n`
								)
							)
							tooLargeHits.push(item)
							return false
						}
						return true
					})
				// push to memory (probably isn't needed)
				allHits.push(...qResponse.body?.hits.hits)

				// writing the index file
				appendArrayToFile(indexFileName, sources)

				const scroll_id: string = qResponse.body._scroll_id

				// check to see if we have collected all of the quotes
				if (qResponse.body?.hits.total.value === allHits.length) {
					indexSize = roughSizeOfObject(allHits)

					break
				}

				// get the next response if there are more quotes to fetch
				if (qResponse.body?._scroll_id) {
					responseQueue.push(
						await ESClient.scroll({
							scroll_id,
							scroll: "30s",
						})
					)
				}
			} else {
				console.warn("No Body on current scroll iteration")
			}
		}
	} catch (error) {
		console.log(error)
	} finally {
		// save oversized records
		appendArrayToFile(failedRecordsFileName, tooLargeHits)
		return {
			clientName: indexName,
			indexSize: indexSize,
			successfulEntries: allHits.length - tooLargeHits.length,
			tooLargeEntries: tooLargeHits.length,
		}
	}
}
