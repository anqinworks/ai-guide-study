/**
 * LaTeX公式渲染器
 * 在小程序中，LaTeX公式需要转换为图片或使用特殊方式渲染
 */

const config = require('./config')

/**
 * 将LaTeX公式转换为图片URL（需要服务端支持）
 * @param {string} formula - LaTeX公式
 * @param {boolean} isBlock - 是否为块级公式
 * @returns {Promise<string>} - 图片URL
 */
async function renderLatexToImage(formula, isBlock = false) {
  try {
    // 使用配置的LaTeX渲染服务
    const apiUrl = config.getLatexRenderUrl(formula, isBlock);
    
    // 注意：小程序中需要配置合法域名
    // 或者使用自己的服务端API来渲染LaTeX
    
    return apiUrl;
  } catch (error) {
    console.error('LaTeX渲染失败:', error);
    return null;
  }
}

/**
 * 检测文本中的LaTeX公式
 * @param {string} text - 文本内容
 * @returns {Array} - 公式列表 [{formula, isBlock, index}]
 */
function detectLatexFormulas(text) {
  const formulas = [];
  
  // 检测块级公式 $$
  const blockRegex = /\$\$([^$]+)\$\$/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    formulas.push({
      formula: match[1].trim(),
      isBlock: true,
      index: match.index,
      length: match[0].length,
      original: match[0]
    });
  }
  
  // 检测行内公式 $
  const inlineRegex = /\$([^$]+)\$/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    formulas.push({
      formula: match[1].trim(),
      isBlock: false,
      index: match.index,
      length: match[0].length,
      original: match[0]
    });
  }
  
  return formulas;
}

/**
 * 将文本中的LaTeX公式替换为占位符
 * @param {string} text - 原始文本
 * @returns {Object} - {text: 替换后的文本, formulas: 公式列表}
 */
function replaceLatexWithPlaceholders(text) {
  const formulas = detectLatexFormulas(text);
  let processedText = text;
  const formulaMap = new Map();
  
  formulas.forEach((formula, index) => {
    const placeholder = `__LATEX_FORMULA_${index}__`;
    formulaMap.set(placeholder, formula);
    processedText = processedText.replace(formula.original, placeholder);
  });
  
  return {
    text: processedText,
    formulas: Array.from(formulaMap.values()),
    formulaMap: formulaMap
  };
}

module.exports = {
  renderLatexToImage,
  detectLatexFormulas,
  replaceLatexWithPlaceholders
};

