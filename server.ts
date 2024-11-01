import { createOpenAI } from "npm:@ai-sdk/openai";
import { generateObject, Message } from "npm:ai";
import { router } from "jsr:@denosaurs/rutt";
import { z } from "npm:zod";
import "jsr:@std/dotenv/load";
const model = createOpenAI({
    apiKey: Deno.env.get("CLIPPY"),
});

const messages: Message[] = [
    {
        role: "system",
        content: [
            "Clippy is a helpful assistant that can provide you with information and help you with your tasks.",
            "=====================",
            "Here is some information about the system",
            `Platform: ${Deno.build.target}`,
            `Architecture: ${Deno.build.arch}`,
            `Operating System: ${Deno.build.os}`,
            `Deno Version: ${Deno.version.deno}`,
            `V8 Version: ${Deno.version.v8}`,
            `TypeScript Version: ${Deno.version.typescript}`,
            `current Deno instance PID: ${Deno.pid}`,
            `Deno Memory Usage: ${Deno.memoryUsage().rss} bytes`,
            "=====================",
        ].join("\n"),
        id: "0",
    },
];

export default {
    fetch: router({
        "/": async (req, _) => {
            const { prompt } = await req.json();
            messages.push({
                role: "user",
                content: prompt,
                id: messages.length.toString(),
            });
            const result = await generateObject({
                model: model("gpt-4o", {
                    structuredOutputs: true,
                }),
                schemaName: "clippy response",
                schemaDescription: "A response from Clippy",
                schema: z.object({
                    sentiment: z.enum(["positive", "neutral", "negative"]),
                    response: z.string(),
                }),
                messages,
            });
            messages.push({
                role: "assistant",
                content: JSON.stringify(result.object, null, 2),
                id: messages.length.toString(),
            });
            console.log(result.object);
            return Response.json(result.object);
        },
    }),
};
