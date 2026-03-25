import { defineConfig } from "vite"

export default defineConfig({
    root: ".",
    base: "./",
    server: {
        fs: { allow: [".."] },
    },
    build: {
        outDir: "dist",
    },
})
