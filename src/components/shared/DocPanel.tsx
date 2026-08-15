'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, X, FileText, ChevronRight, ChevronDown, Menu, ExternalLink, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import { docAnnotations, DocAnnotation, getAnnotationsByPath } from '@/config/doc-annotations';

interface DocPanelProps {
  /** 当前页面路径 */
  currentPath: string;
  /** 是否默认展开面板 */
  defaultOpen?: boolean;
}

export default function DocPanel({ currentPath, defaultOpen = false }: DocPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false); // 大小屏切换
  const [selectedDoc, setSelectedDoc] = useState<DocAnnotation | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [annotations, setAnnotations] = useState<DocAnnotation[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoveredDoc, setHoveredDoc] = useState<DocAnnotation | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [listWidth, setListWidth] = useState(160); // 左侧列表宽度
  const [isDragging, setIsDragging] = useState(false); // 拖动列表分隔条
  const [isDraggingPanel, setIsDraggingPanel] = useState(false); // 拖动整个面板
  const [panelWidth, setPanelWidth] = useState(380); // 面板整体宽度

  // 根据当前路径获取文档标注配置
  useEffect(() => {
    const anns = getAnnotationsByPath(currentPath);
    setAnnotations(anns);
  }, [currentPath]);

  // 加载文档内容
  const loadDocContent = async (docPath: string) => {
    setIsLoading(true);
    try {
      // 使用 API 读取文件，确保路径正确编码
      const encodedPath = encodeURIComponent(docPath);
      const response = await fetch(`/api/doc?path=${encodedPath}`);
      const data = await response.json();
      
      if (response.ok && data.content) {
        setDocContent(data.content);
      } else {
        setDocContent(`# 文档加载失败\n\n${data.error || '未知错误'}\n\n文件路径: ${docPath}`);
      }
    } catch (error) {
      setDocContent(`# 文档加载失败\n\n错误信息: ${error}\n\n文件路径: ${docPath}`);
    }
    setIsLoading(false);
  };

  // 选择文档
  const selectDoc = async (annotation: DocAnnotation) => {
    setSelectedDoc(annotation);
    await loadDocContent(annotation.docPath);
  };

  // 处理鼠标悬浮
  const handleMouseEnter = (e: React.MouseEvent, annotation: DocAnnotation) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left, // 气泡显示在名称上方，对齐左侧
      y: rect.top - 8, // 气泡在名称上方，略微间距
    });
    setHoveredDoc(annotation);
  };

  const handleMouseLeave = () => {
    setHoveredDoc(null);
  };

  // 截取文档名称：保留序号 + 最后一段
  const getShortTitle = (title: string): string => {
    // 匹配序号（数字.数字格式，如 2.06）
    const match = title.match(/^(\d+\.\d+)/);
    const prefix = match ? match[1] : '';
    
    // 按 "-" 分割，取最后一段
    const parts = title.split('-');
    const lastPart = parts[parts.length - 1].trim();
    
    return prefix ? `${prefix}${lastPart}` : lastPart;
  };

  // 拖动分隔条开始
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // 拖动中
  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // 计算新的列表宽度
      const panelElement = document.getElementById('doc-panel-content');
      if (panelElement) {
        const panelRect = panelElement.getBoundingClientRect();
        const newWidth = e.clientX - panelRect.left;
        
        // 限制最小和最大宽度
        if (newWidth >= 120 && newWidth <= 280) {
          setListWidth(newWidth);
        }
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
  }, [isDragging]);

  // 拖动整个面板开始
  const handlePanelDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPanel(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // 拖动整个面板中
  useEffect(() => {
    const handlePanelDragMove = (e: MouseEvent) => {
      if (!isDraggingPanel) return;
      
      // 计算新的面板宽度（基于窗口右边计算）
      const newWidth = window.innerWidth - e.clientX;
      
      // 限制最小和最大宽度：最小 380，最大约 760（一倍）
      if (newWidth >= 380 && newWidth <= 760) {
        setPanelWidth(newWidth);
      }
    };

    const handlePanelDragEnd = () => {
      setIsDraggingPanel(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDraggingPanel) {
      document.addEventListener('mousemove', handlePanelDragMove);
      document.addEventListener('mouseup', handlePanelDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handlePanelDragMove);
      document.removeEventListener('mouseup', handlePanelDragEnd);
    };
  }, [isDraggingPanel]);

  // 切换分类展开/收起
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // 渲染 Markdown 内容
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 代码块
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto my-2 font-mono">
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
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
        elements.push(
          <h1 key={`h1-${i}`} className="text-lg font-bold text-gray-900 mt-4 mb-2 first:mt-0 pb-1 border-b border-gray-200">
            {line.substring(2)}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base font-semibold text-gray-800 mt-3 mb-2">
            {line.substring(3)}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-medium text-gray-700 mt-2 mb-1">
            {line.substring(4)}
          </h3>
        );
        continue;
      }

      // 分隔线
      if (line === '---' || line === '***') {
        elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-200" />);
        continue;
      }

      // 空行
      if (line.trim() === '') {
        continue;
      }

      // 列表项
      if (line.match(/^[-*]\s/)) {
        const text = line.replace(/^[-*]\s/, '');
        const formatted = formatInlineMarkdown(text);
        elements.push(
          <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-2">
            <span className="text-blue-500 mt-1">•</span>
            <span className="text-sm text-gray-700 flex-1" dangerouslySetInnerHTML={{ __html: formatted }} />
          </div>
        );
        continue;
      }

      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^\d+/)?.[0] || '';
        const text = line.replace(/^\d+\.\s/, '');
        const formatted = formatInlineMarkdown(text);
        elements.push(
          <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-2">
            <span className="text-blue-500 font-medium min-w-[1.5em]">{num}.</span>
            <span className="text-sm text-gray-700 flex-1" dangerouslySetInnerHTML={{ __html: formatted }} />
          </div>
        );
        continue;
      }

      // 引用
      if (line.startsWith('> ')) {
        elements.push(
          <div key={`quote-${i}`} className="border-l-3 border-blue-400 pl-3 py-1 my-2 text-gray-600 text-sm italic bg-blue-50 rounded-r">
            {line.substring(2)}
          </div>
        );
        continue;
      }

      // 段落
      const formatted = formatInlineMarkdown(line);
      elements.push(
        <p key={`p-${i}`} 
           className="text-sm text-gray-700 leading-relaxed my-1"
           dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    }

    return elements;
  };

  // 行内 Markdown 格式化
  const formatInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-700">$1</code>');
  };

  // 切换面板
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // 切换大小屏
  const toggleExpand = () => {
    if (isExpanded) {
      // 从大屏切换到小屏
      setPanelWidth(380);
    } else {
      // 从小屏切换到大屏
      setPanelWidth(500);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* 浮动的文档按钮 */}
      <button
        onClick={togglePanel}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all ${
          isOpen 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
        }`}
        style={{ 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <BookOpen className="w-5 h-5" />
        <span className="font-medium text-sm">业务逻辑</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 文档面板 */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-40 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          width: `${panelWidth}px`,
          boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {/* 左侧边缘拖动区域 */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50 ${
            isDraggingPanel ? 'bg-blue-500/50' : 'hover:bg-blue-400/30'
          }`}
          onMouseDown={handlePanelDragStart}
          title="拖动调整面板宽度"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 flex flex-col items-center gap-1 opacity-50 hover:opacity-100">
            <div className="w-0.5 h-3 bg-white rounded-full"></div>
            <div className="w-0.5 h-3 bg-white rounded-full"></div>
            <div className="w-0.5 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* 面板头部 */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">业务逻辑文档</h2>
                <p className="text-blue-100 text-xs mt-0.5">{annotations.length} 个文档</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleExpand}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isExpanded ? '切换到小屏' : '切换到大屏'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={togglePanel}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="关闭面板"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 面板内容 */}
        <div id="doc-panel-content" className="flex-1 flex overflow-hidden">
          {/* 左侧文档列表 */}
          <div 
            className="flex flex-col border-r border-gray-200" 
            style={{ width: `${listWidth}px`, minWidth: `${listWidth}px` }}
          >
            {/* 列表头部 */}
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">文档列表</p>
                <span className="text-xs text-gray-400">↔</span>
              </div>
            </div>
            
            {/* 文档列表 */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {annotations.length > 0 ? (
                annotations.map((annotation) => (
                  <button
                    key={annotation.id}
                    onClick={() => selectDoc(annotation)}
                    onMouseEnter={(e) => handleMouseEnter(e, annotation)}
                    onMouseLeave={handleMouseLeave}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2 ${
                      selectedDoc?.id === annotation.id
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'hover:bg-gray-50 border border-transparent text-gray-700'
                    }`}
                  >
                    <FileText className={`w-4 h-4 flex-shrink-0 ${selectedDoc?.id === annotation.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium truncate">{getShortTitle(annotation.title)}</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无文档</p>
                </div>
              )}
            </div>
          </div>

          {/* 可拖动的分隔条 */}
          <div
            className={`w-1 cursor-col-resize flex-shrink-0 transition-colors ${
              isDragging ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'
            }`}
            onMouseDown={handleDragStart}
          />

          {/* 右侧文档内容 */}
          {selectedDoc && (
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* 内容头部 */}
              <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-700 truncate">{selectedDoc.title}</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title="关闭文档"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 文档内容 */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {renderMarkdown(docContent)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 面板底部 */}
        <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            点击左侧文档查看业务逻辑详情
          </p>
        </div>
      </div>

      {/* 悬浮气泡提示 */}
      {hoveredDoc && (
        <div
          className="fixed z-[60] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl max-w-xs pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <p className="text-sm font-medium">{hoveredDoc.title}</p>
          {/* 气泡尖角 - 下方 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-900" />
          </div>
        </div>
      )}

      {/* 遮罩层（面板打开时点击关闭） */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={togglePanel}
        />
      )}
    </>
  );
}
