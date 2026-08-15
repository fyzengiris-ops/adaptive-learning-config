'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, X, ChevronLeft, ChevronRight, FileText, Menu, ExternalLink } from 'lucide-react';
import { docAnnotations, DocAnnotation, getAnnotationsByPath } from '@/config/doc-annotations';

interface DocAnnotatorProps {
  /** 当前页面路径 */
  currentPath: string;
  /** 页面内容区域 ref */
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

export default function DocAnnotator({ currentPath, contentRef }: DocAnnotatorProps) {
  const [isDocMode, setIsDocMode] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocAnnotation | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [annotations, setAnnotations] = useState<DocAnnotation[]>([]);

  // 根据当前路径获取文档标注配置
  useEffect(() => {
    const anns = getAnnotationsByPath(currentPath);
    setAnnotations(anns);
  }, [currentPath]);

  // 加载文档内容
  const loadDocContent = async (docPath: string) => {
    setIsLoading(true);
    try {
      // 使用 fetch 加载 markdown 文件
      const response = await fetch(`/${docPath}`);
      if (response.ok) {
        const content = await response.text();
        setDocContent(content);
      } else {
        setDocContent(`# 文档加载失败\n\n无法加载文档: ${docPath}\n\n请检查文档路径是否正确。`);
      }
    } catch (error) {
      setDocContent(`# 文档加载失败\n\n错误信息: ${error}`);
    }
    setIsLoading(false);
  };

  // 切换文档模式
  const toggleDocMode = () => {
    const newMode = !isDocMode;
    setIsDocMode(newMode);
    if (!newMode) {
      setSelectedDoc(null);
    }
  };

  // 打开文档面板
  const openDocPanel = () => {
    setIsPanelOpen(true);
  };

  // 关闭文档面板
  const closeDocPanel = () => {
    setIsPanelOpen(false);
    setSelectedDoc(null);
  };

  // 选择文档
  const selectDoc = async (annotation: DocAnnotation) => {
    setSelectedDoc(annotation);
    await loadDocContent(annotation.docPath);
  };

  // 渲染 Markdown 内容（简化版）
  const renderMarkdown = (content: string) => {
    // 简单的 Markdown 渲染
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-1 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-700 text-sm">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 代码块
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto my-2">
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
        } else {
          flushList();
        }
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // 标题
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">
            {line.substring(2)}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${i}`} className="text-lg font-semibold text-gray-800 mt-3 mb-2">
            {line.substring(3)}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-medium text-gray-700 mt-2 mb-1">
            {line.substring(4)}
          </h3>
        );
        continue;
      }

      // 列表
      if (line.match(/^[-*]\s/)) {
        inList = true;
        listItems.push(line.replace(/^[-*]\s/, ''));
        continue;
      }
      if (line.match(/^\d+\.\s/)) {
        inList = true;
        listItems.push(line.replace(/^\d+\.\s/, ''));
        continue;
      }

      // 刷新列表
      flushList();

      // 引用
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${i}`} className="border-l-4 border-blue-300 pl-4 py-1 my-2 text-gray-600 text-sm italic">
            {line.substring(2)}
          </blockquote>
        );
        continue;
      }

      // 分隔线
      if (line === '---' || line === '***') {
        elements.push(<hr key={`hr-${i}`} className="my-4 border-gray-200" />);
        continue;
      }

      // 空行
      if (line.trim() === '') {
        continue;
      }

      // 段落 - 移除 Markdown 格式符号并渲染
      const formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>');

      elements.push(
        <p key={`p-${i}`} 
           className="text-sm text-gray-700 leading-relaxed my-1"
           dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    }

    flushList();

    return elements;
  };

  // 切换到全屏演示模式
  const enterPresentationMode = () => {
    setIsDocMode(false);
    setIsPanelOpen(true);
  };

  return (
    <>
      {/* 文档模式开关按钮 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* 文档列表按钮 */}
        {isDocMode && (
          <button
            onClick={openDocPanel}
            className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all border border-gray-200"
            title="文档列表"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* 主开关按钮 */}
        <button
          onClick={toggleDocMode}
          className={`w-14 h-14 shadow-lg rounded-full flex items-center justify-center transition-all ${
            isDocMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-600 hover:text-blue-600 border border-gray-200'
          }`}
          title={isDocMode ? '关闭文档模式' : '开启文档模式'}
        >
          <BookOpen className="w-6 h-6" />
        </button>
      </div>

      {/* 文档模式提示 */}
      {isDocMode && !isPanelOpen && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          文档模式已开启 - 点击右上角按钮查看各区域文档
        </div>
      )}

      {/* 文档面板 */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* 左侧文档列表 */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* 头部 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="font-semibold text-gray-900">业务逻辑文档</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {annotations.length} 个文档
                </p>
              </div>
              <button
                onClick={closeDocPanel}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 文档列表 */}
            <div className="flex-1 overflow-y-auto p-2">
              {annotations.length > 0 ? (
                <div className="space-y-1">
                  {annotations.map((annotation) => (
                    <button
                      key={annotation.id}
                      onClick={() => selectDoc(annotation)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                        selectedDoc?.id === annotation.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        selectedDoc?.id === annotation.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          selectedDoc?.id === annotation.id ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {annotation.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {annotation.docPath}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">当前页面暂无文档</p>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                点击左侧文档列表查看详情
              </p>
            </div>
          </div>

          {/* 右侧文档内容 */}
          <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
            {selectedDoc ? (
              <>
                {/* 文档头部 */}
                <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{selectedDoc.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedDoc.docPath}</p>
                  </div>
                  <button
                    onClick={closeDocPanel}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 文档内容 */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="ml-3 text-gray-500">加载中...</span>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {renderMarkdown(docContent)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">请选择一个文档查看</p>
                  <p className="text-sm mt-1">从左侧列表选择要查看的文档</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 页面区域标注（文档模式开启时显示） */}
      {isDocMode && !isPanelOpen && annotations.length > 0 && (
        <>
          {/* 顶部提示栏 */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">文档模式</span>
              <span className="text-blue-200 text-sm">|</span>
              <span className="text-blue-200 text-sm">点击右侧按钮查看各区域业务逻辑文档</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-blue-200">
                共 {annotations.length} 个文档
              </span>
              <button
                onClick={openDocPanel}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
              >
                打开文档面板
              </button>
            </div>
          </div>
          
          {/* 为每个标注区域添加标注标记 */}
          <div 
            className="fixed top-16 right-6 z-40"
            style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
          >
            <div className="space-y-2">
              {annotations.slice(0, 8).map((annotation) => (
                <button
                  key={annotation.id}
                  onClick={() => {
                    openDocPanel();
                    selectDoc(annotation);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:bg-white transition-all text-sm group"
                >
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                    {annotation.title}
                  </span>
                </button>
              ))}
              {annotations.length > 8 && (
                <button
                  onClick={openDocPanel}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  查看全部 {annotations.length} 个文档
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
