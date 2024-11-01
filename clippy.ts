// deno-lint-ignore-file no-unused-vars
import {
    getPrimaryMonitor,
    Image,
    mainloop,
    WindowCanvas,
} from "jsr:@gfx/dwm/ext/canvas";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { generateText, Message, tool } from "npm:ai";
// import AutoPilot from "https://deno.land/x/autopilot@0.4.0/mod.ts";
import { z } from "npm:zod";
import "jsr:@std/dotenv/load";

// const pilot = new AutoPilot();

// export const screenshotTool = tool({
//     description: "take a screenshot of the current screen",
//     parameters: z.object({}),
//     execute: async () => {
//         const tempFile = await Deno.makeTempFile();
//         pilot.screenshot(tempFile);
//         return await Deno.readFile(tempFile);
//     },
// });

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

const monitor = getPrimaryMonitor();

let text = "Hi how may I help you today?";

let img: Image;

const win = new WindowCanvas({
    title: "Clippy",
    width: 5,
    height: 5,
    resizable: false,
    removeDecorations: true,
    transparent: true,
    floating: true,
});

win.window.position = {
    x: monitor.workArea.width - 1000,
    y: monitor.workArea.height - 500,
};

const ctx = win.ctx;
ctx.fillStyle = "#fff";
ctx.strokeStyle = "#fff";

win.onDraw = (ctx) => {
    if (!img) return;
    ctx.clearRect(0, 0, win.canvas.width, win.canvas.height);
    ctx.drawImage(img, 0, 0, win.canvas.width, win.canvas.height);
};

await mainloop(async () => {
    const msg = prompt("Enter a message")!;

    messages.push({
        role: "user",
        content: msg,
        id: messages.length.toString(),
    });
    const result = await generateText({
        model: model("gpt-4o", {
            structuredOutputs: true,
        }),
        // tools: {
        //     screenshotTool,
        // },
        maxTokens: 20,
        messages,
    });
    // deno-lint-ignore no-explicit-any
    text = (result.response.messages[0].content[0] as any).text;
    img = new Image(
        await (await fetch(
            `https://clippy-image.deno.dev/r?text=${
                encodeURI(text)
            }&transparent=true`,
        )).bytes(),
    );
    win.window.size = { width: img.width, height: img.height };
    win.draw();
});
