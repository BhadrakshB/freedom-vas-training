import { tool } from "@langchain/core/tools";
import { z } from "zod";

interface multiplyInput {
    a: number;
    b: number;

}

export const multiply = tool(
    (input : any) => {
        /**
         * Multiply two numbers.
         */
        return input.a * input.b;
    },
    {
        name: "multiply",
        schema: z.object({
            a: z.number().describe("First operand"),
            b: z.number().describe("Second operand"),
        }),
        description: "Multiply two numbers.",
    }
);