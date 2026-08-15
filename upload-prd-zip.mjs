import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync, createReadStream, writeFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 文件路径
const mdFilePath = join(__dirname, "产品文档/4-完整版PRD/自适应学习配置后台-完整PRD文档.md");
const zipFilePath = "/tmp/自适应学习配置后台-完整PRD文档.zip";

console.log("正在创建压缩包...");

// 创建zip压缩包
await new Promise((resolve, reject) => {
  const output = createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 } // 最高压缩级别
  });

  output.on("close", () => {
    console.log(`压缩包创建成功，大小: ${(archive.pointer() / 1024).toFixed(2)} KB`);
    resolve();
  });

  archive.on("error", (err) => {
    reject(err);
  });

  archive.pipe(output);

  // 添加文件到压缩包，使用中文文件名
  archive.file(mdFilePath, { name: "自适应学习配置后台-完整PRD文档.md" });

  archive.finalize();
});

// 读取zip文件
const zipContent = readFileSync(zipFilePath);
const fileName = "PRD/自适应学习配置后台-完整PRD文档.zip";

console.log("正在上传压缩包...");

// 上传文件
const key = await storage.uploadFile({
  fileContent: zipContent,
  fileName: fileName,
  contentType: "application/zip",
});

console.log("压缩包上传成功，key:", key);

// 生成签名URL（有效期7天）
const signedUrl = await storage.generatePresignedUrl({
  key: key,
  expireTime: 7 * 24 * 60 * 60, // 7天
});

console.log("\n========================================");
console.log("📦 ZIP压缩包下载链接（有效期7天）：");
console.log(signedUrl);
console.log("========================================\n");

// 清理临时文件
unlinkSync(zipFilePath);
