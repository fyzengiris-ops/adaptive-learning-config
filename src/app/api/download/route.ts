import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKSPACE_PATH = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

export async function GET() {
  try {
    const filePath = path.join(WORKSPACE_PATH, 'public', '产品文档.tar.gz');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 读取文件并转换为 ArrayBuffer
    const fileBuffer = fs.readFileSync(filePath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );
    
    // 返回文件流，设置下载响应头
    // 使用 RFC 5987 规范处理中文文件名
    const filename = '产品文档.tar.gz';
    const encodedFilename = encodeURIComponent(filename);
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[API Download] 下载失败:', error);
    return NextResponse.json(
      { error: '下载失败' },
      { status: 500 }
    );
  }
}
