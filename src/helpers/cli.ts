import * as COLORS from "https://deno.land/std@0.159.0/fmt/colors.ts";

export const task = async (
    description: string,
    cb: () => Promise<void> | void
) => {
    console.log(`${COLORS.bgCyan(`${COLORS.black(`Task: ${description}`)}`)}`);
    console.log(`${COLORS.yellow("Running Task...")}`);

    const start = performance.now();
    await cb();
    const end = performance.now();

    const elapsed = end - start;
    const s = Math.round(elapsed / 1000);

    console.log(
        `${COLORS.green(
            `Complete in ${
                s === 0 ? Math.round(elapsed) + "ms" + " ✨" : s + "s" + " ✨"
            }`
        )}`
    );
};
