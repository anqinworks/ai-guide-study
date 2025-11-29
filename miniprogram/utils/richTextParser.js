/**
 * 富文本解析器 - 支持代码高亮、LaTeX公式、文本格式化
 * 将Markdown/HTML格式的文本转换为小程序rich-text组件可用的格式
 */

/**
 * 支持的代码语言
 */
const SUPPORTED_LANGUAGES = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  json: 'JSON',
  xml: 'XML',
  bash: 'Bash',
  shell: 'Shell'
};

/**
 * 代码高亮颜色映射（简化版，实际可以使用highlight.js）
 */
const CODE_HIGHLIGHT = {
  keyword: '#c678dd',      // 关键字（紫色）
  string: '#98c379',       // 字符串（绿色）
  comment: '#5c6370',      // 注释（灰色）
  number: '#d19a66',       // 数字（橙色）
  function: '#61afef',     // 函数（蓝色）
  variable: '#e06c75',     // 变量（红色）
  default: '#abb2bf'       // 默认（浅灰色）
};

/**
 * 简单的代码高亮处理（基础版本）
 * 注意：小程序中完整的语法高亮需要使用服务端渲染或预处理的HTML
 */
function highlightCode(code, language = 'javascript') {
  // 这里返回带样式的HTML字符串
  // 实际项目中可以使用highlight.js在服务端处理
  const escapedCode = escapeHtml(code);
  
  // 增强的关键字高亮 - 支持多种编程语言
  const keywords = {
    javascript: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'async', 'await', 'new', 'this', 'super', 'extends', 'implements', 'static', 'final', 'abstract', 'typeof', 'instanceof', 'in', 'of', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'throw', 'null', 'undefined', 'true', 'false'],
    python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'lambda', 'yield', 'async', 'await', 'with', 'as', 'del', 'global', 'nonlocal'],
    java: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'enum', 'extends', 'implements', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'return', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'import', 'package', 'void', 'int', 'long', 'short', 'byte', 'char', 'float', 'double', 'boolean', 'String', 'Object', 'null', 'true', 'false', 'instanceof', 'synchronized', 'volatile', 'transient', 'native', 'strictfp'],
    cpp: ['class', 'struct', 'public', 'private', 'protected', 'static', 'const', 'virtual', 'inline', 'template', 'namespace', 'using', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'return', 'break', 'continue', 'try', 'catch', 'throw', 'new', 'delete', 'this', 'nullptr', 'true', 'false', 'int', 'long', 'short', 'char', 'float', 'double', 'bool', 'void'],
    c: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'return', 'break', 'continue', 'goto', 'int', 'long', 'short', 'char', 'float', 'double', 'void', 'struct', 'union', 'enum', 'typedef', 'static', 'extern', 'const', 'volatile', 'register', 'auto', 'signed', 'unsigned', 'true', 'false', 'NULL']
  };
  
  const langKeywords = keywords[language] || keywords.javascript;
  let highlighted = escapedCode;
  
  // 使用占位符方法避免冲突
  const placeholders = [];
  let placeholderIndex = 0;
  
  // 1. 先处理注释（注释内容不应被其他规则匹配）
  if (language === 'javascript' || language === 'js' || language === 'java' || language === 'cpp' || language === 'c') {
    // 文档注释优先
    highlighted = highlighted.replace(/\/\*\*[\s\S]*?\*\//g, (match) => {
      const placeholder = `__PLACEHOLDER_COMMENT_${placeholderIndex++}__`;
      placeholders.push({ placeholder, replacement: `<span style="color: ${CODE_HIGHLIGHT.comment}">${match}</span>` });
      return placeholder;
    });
    // 多行注释
    highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      const placeholder = `__PLACEHOLDER_COMMENT_${placeholderIndex++}__`;
      placeholders.push({ placeholder, replacement: `<span style="color: ${CODE_HIGHLIGHT.comment}">${match}</span>` });
      return placeholder;
    });
    // 单行注释
    highlighted = highlighted.replace(/\/\/.*$/gm, (match) => {
      const placeholder = `__PLACEHOLDER_COMMENT_${placeholderIndex++}__`;
      placeholders.push({ placeholder, replacement: `<span style="color: ${CODE_HIGHLIGHT.comment}">${match}</span>` });
      return placeholder;
    });
  } else if (language === 'python' || language === 'py') {
    highlighted = highlighted.replace(/#.*$/gm, (match) => {
      const placeholder = `__PLACEHOLDER_COMMENT_${placeholderIndex++}__`;
      placeholders.push({ placeholder, replacement: `<span style="color: ${CODE_HIGHLIGHT.comment}">${match}</span>` });
      return placeholder;
    });
  }
  
  // 2. 处理字符串（字符串内容不应被关键字匹配）
  highlighted = highlighted.replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    const placeholder = `__PLACEHOLDER_STRING_${placeholderIndex++}__`;
    placeholders.push({ placeholder, replacement: `<span style="color: ${CODE_HIGHLIGHT.string}">${match}</span>` });
    return placeholder;
  });
  
  // 3. 高亮关键字（按长度从长到短排序，避免短关键字覆盖长关键字）
  const sortedKeywords = [...langKeywords].sort((a, b) => b.length - a.length);
  sortedKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlighted = highlighted.replace(regex, (match) => {
      return `<span style="color: ${CODE_HIGHLIGHT.keyword}">${match}</span>`;
    });
  });
  
  // 4. 高亮数字
  highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, (match) => {
    return `<span style="color: ${CODE_HIGHLIGHT.number}">${match}</span>`;
  });
  
  // 5. 高亮函数调用（排除关键字）
  if (language === 'javascript' || language === 'js' || language === 'java' || language === 'cpp' || language === 'c') {
    highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, (match, funcName) => {
      const isKeyword = langKeywords.some(kw => kw.toLowerCase() === funcName.toLowerCase());
      if (!isKeyword) {
        return `<span style="color: ${CODE_HIGHLIGHT.function}">${funcName}</span>(`;
      }
      return match;
    });
  }
  
  // 6. 恢复占位符
  placeholders.forEach(({ placeholder, replacement }) => {
    highlighted = highlighted.replace(placeholder, replacement);
  });
  
  return highlighted;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 解析Markdown格式的文本
 * 支持：代码块、行内代码、加粗、斜体、列表、LaTeX公式
 */
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // 1. 处理代码块 ```language\ncode\n```
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = (lang || 'javascript').toLowerCase();
    const highlighted = highlightCode(code.trim(), language);
    return `<pre class="code-block"><code class="language-${language}">${highlighted}</code></pre>`;
  });
  
  // 2. 处理行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // 3. 处理LaTeX公式 $formula$ (行内) 和 $$formula$$ (块级)
  html = html.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    // LaTeX公式在小程序中需要使用图片或SVG渲染
    // 这里先转换为特殊标记，后续可以用服务端API渲染为图片
    return `<span class="latex-formula block">${escapeHtml(formula)}</span>`;
  });
  
  html = html.replace(/\$([^$]+)\$/g, (match, formula) => {
    return `<span class="latex-formula inline">${escapeHtml(formula)}</span>`;
  });
  
  // 4. 处理加粗 **text** 或 __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // 5. 处理斜体 *text* 或 _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // 6. 处理有序列表
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
  
  // 7. 处理无序列表
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 8. 处理换行
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}

/**
 * 将文本转换为rich-text组件可用的nodes格式
 */
function textToNodes(text) {
  if (!text) return [];
  
  // 先解析Markdown
  const html = parseMarkdown(text);
  
  // 将HTML转换为nodes（小程序rich-text支持HTML字符串）
  // 注意：小程序rich-text组件可以直接使用HTML字符串
  return html;
}

/**
 * 处理代码块，返回格式化的HTML
 */
function formatCodeBlock(code, language = 'javascript') {
  const highlighted = highlightCode(code, language);
  return {
    type: 'node',
    name: 'pre',
    attrs: {
      class: 'code-block'
    },
    children: [{
      type: 'node',
      name: 'code',
      attrs: {
        class: `language-${language}`
      },
      children: [{
        type: 'text',
        text: code
      }]
    }]
  };
}

/**
 * 处理LaTeX公式
 * 在小程序中，LaTeX需要转换为图片或使用特殊组件
 */
function formatLatexFormula(formula, isBlock = false) {
  // 方案1：使用服务端API将LaTeX渲染为图片
  // 方案2：使用小程序插件（如果有）
  // 方案3：显示原始LaTeX代码（当前方案）
  
  return {
    type: 'node',
    name: 'span',
    attrs: {
      class: `latex-formula ${isBlock ? 'block' : 'inline'}`,
      'data-formula': formula
    },
    children: [{
      type: 'text',
      text: formula
    }]
  };
}

/**
 * 主解析函数 - 将富文本转换为小程序可用的格式
 */
function parseRichText(text) {
  if (!text) return '';
  
  // 如果已经是HTML格式，直接返回
  if (text.includes('<') && text.includes('>')) {
    return text;
  }
  
  // 解析Markdown格式
  return parseMarkdown(text);
}

module.exports = {
  parseRichText,
  parseMarkdown,
  highlightCode,
  formatCodeBlock,
  formatLatexFormula,
  textToNodes,
  SUPPORTED_LANGUAGES
};

