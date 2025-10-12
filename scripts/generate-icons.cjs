const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const input = path.join(__dirname, "..", "public", "manary-logo.png")
const outputDir = path.join(__dirname, "..", "public", "icons")

const targets = [
  { size: 192, name: "icon-192.png", options: { fit: "contain" } },
  { size: 512, name: "icon-512.png", options: { fit: "contain" } },
  { size: 512, name: "icon-512-maskable.png", options: { fit: "cover" } },
]

async function main() {
  await fs.promises.mkdir(outputDir, { recursive: true })

  try {
    await fs.promises.access(input, fs.constants.R_OK)
  } catch {
    throw new Error(`Source image not found at ${input}`)
  }

  for (const target of targets) {
    const outputPath = path.join(outputDir, target.name)
    await sharp(input)
      .resize(target.size, target.size, {
        fit: target.options.fit,
        background: { r: 255, g: 255, b: 255, alpha: target.options.fit === "contain" ? 0 : 1 },
      })
      .png({ quality: 100 })
      .toFile(outputPath)

    console.log(`Created ${path.relative(process.cwd(), outputPath)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
