import { createOpenAI } from "npm:@ai-sdk/openai";
import { generateObject } from "npm:ai";
import { router } from "jsr:@denosaurs/rutt";
import { z } from "npm:zod";
import "jsr:@std/dotenv/load";
const model = createOpenAI({
    apiKey: Deno.env.get("CLIPPY"),
});

export default {
    fetch: router({
        "/": async (req, _) => {
            const { prompt } = await req.json();
            const result = await generateObject({
                model: model("gpt-4o", {
                    structuredOutputs: true,
                }),
                schemaName: "recipe",
                schemaDescription: "A recipe for lasagna.",
                schema: z.object({
                    name: z.string(),
                    ingredients: z.array(
                        z.object({
                            name: z.string(),
                            amount: z.string(),
                        }),
                    ),
                    steps: z.array(z.string()),
                }),
                prompt,
            });
            console.log(result.object);
            return Response.json(JSON.stringify(result.object, null, 2));
        },
    }),
};
