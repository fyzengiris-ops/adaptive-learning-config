import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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

// 读取文件
const filePath = join(__dirname, "产品文档/4-完整版PRD/自适应学习配置后台-完整PRD文档.md");
const fileContent = readFileSync(filePath);
const fileName = "PRD/自适应学习配置后台-完整PRD文档.md";

console.log("正在上传文件...");

// 上传文件
const key = await storage.uploadFile({
  fileContent: fileContent,
  fileName: fileName,
  contentType: "text/markdown; charset=utf-8",
});

console.log("文件上传成功，key:", key);

// 生成签名URL（有效期7天）
const signedUrl = await storage.generatePresignedUrl({
  key: key,
  expireTime: 7 * 24 * 60 * 60, // 7天
});

console.log("\n========================================");
console.log("下载链接（有效期7天）：");
console.log(signedUrl);
console.log("========================================\n");
