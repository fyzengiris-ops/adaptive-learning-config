import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取工作目录
const WORKSPACE_PATH = process.env.COZE_WORKSPACE_PATH || '/workspace/projects';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json(
      { error: '缺少文件路径参数' },
      { status: 400 }
    );
  }

  // 安全检查：只允许读取 markdown 文件
  if (!filePath.endsWith('.md')) {
    return NextResponse.json(
      { error: '只支持读取 markdown 文件' },
      { status: 400 }
    );
  }

  try {
    // 构建完整文件路径
    // 使用 decodeURIComponent 处理 URL 编码
    const decodedPath = decodeURIComponent(filePath);
    const fullPath = path.join(WORKSPACE_PATH, decodedPath);
    
    console.log('[API Doc] 读取文件:', fullPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      console.log('[API Doc] 文件不存在:', fullPath);
      return NextResponse.json(
        { error: `文件不存在: ${decodedPath}`, fullPath },
        { status: 404 }
      );
    }

    // 读取文件内容
    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log('[API Doc] 读取成功，长度:', content.length);

    return NextResponse.json(
      { content, path: decodedPath },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }
      }
    );
  } catch (error) {
    console.error('读取文件失败:', error);
    return NextResponse.json(
      { error: `读取文件失败: ${error}` },
      { status: 500 }
    );
  }
}
