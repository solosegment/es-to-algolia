import { z } from "zod"
export const clientIndexesDefault = [
	{
		clientName: "ASME",
		node: "http://10.10.10.143:9200",
		indexId: "asme-20210913",
	},
	{
		clientName: "UL",
		node: "http://10.10.10.88:9201",
		indexId: "ul-hybrid-20220726",
	},
]

export const ClientIndexObjectSchema = z
	.array(
		z.object({
			clientName: z.string(),
			node: z.string(),
			indexId: z.string(),
		})
	)
	.default(clientIndexesDefault)
