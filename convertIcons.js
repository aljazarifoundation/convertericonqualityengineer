const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const BASE_FOLDER = path.resolve(__dirname, "../ConvertIconsQualityEngineer");
const INPUT_FOLDER = path.join(BASE_FOLDER, "icons");
const OUTPUT_FOLDER = path.join(BASE_FOLDER, "resized-icons");
const README_FILE = path.join(BASE_FOLDER, "README.md");

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}

// Standard sizes
const sizes = [48, 64, 128, 256, 512];

async function processImages() {
    const imagesData = {};
    const files = fs.readdirSync(INPUT_FOLDER).filter(file => file.endsWith(".png") || file.endsWith(".webp"));

    await Promise.all(files.map(async (file) => {
        const inputPath = path.join(INPUT_FOLDER, file);
        const baseName = path.basename(file, path.extname(file));
        imagesData[baseName] = {};

        try {
            let image = sharp(inputPath);

            // Convert WEBP to PNG
            if (file.endsWith(".webp")) {
                const convertedPath = path.join(INPUT_FOLDER, `${baseName}.png`);
                await image.toFormat("png").toFile(convertedPath);
                image = sharp(convertedPath);
            }

            await Promise.all(sizes.map(async (size) => {
                try {
                    const outputFileName = `${baseName}_${size}.png`;
                    const outputPath = path.join(OUTPUT_FOLDER, outputFileName);
                    await image.resize(size, size).toFile(outputPath);
                    imagesData[baseName][size] = outputFileName;
                } catch {
                    imagesData[baseName][size] = "Not Supported";
                }
            }));

            console.log(`✅ Processed: ${file}`);
        } catch (err) {
            console.error(`❌ Error processing ${file}:`, err);
        }
    }));

    return imagesData;
}

async function updateReadme() {
    const imagesData = await processImages();
    let markdownContent = `# Resized Icons\n\n`;

    Object.entries(imagesData).forEach(([baseName, sizesMap]) => {
        markdownContent += `## ${baseName}\n\n`;
        markdownContent += "| 48px | 64px | 128px | 256px | 512px |\n";
        markdownContent += "|------|------|-------|-------|-------|\n";
        markdownContent += `| ${sizes.map(size => 
            sizesMap[size] === "Not Supported" 
                ? "❌ Not Supported" 
                : `![${sizesMap[size]}](./resized-icons/${sizesMap[size]})`
        ).join(" | ")} |\n\n`;
    });

    fs.writeFileSync(README_FILE, markdownContent);
    console.log(`📄 README.md updated with ${Object.keys(imagesData).length} images!`);
}

updateReadme();
