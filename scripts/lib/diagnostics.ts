/** 保留錯誤結構供診斷，但任何層級的認證資料都不得寫入日誌。 */
export function safeDiagnostics(error: unknown, apiKey = process.env.GEMINI_API_KEY): unknown {
  const seen = new WeakSet<object>();
  const cleanText = (text: string) => {
    let cleaned = apiKey ? text.replaceAll(apiKey, '[REDACTED]') : text;
    cleaned = cleaned.replace(/AIza[\w-]+/g, '[REDACTED]');
    cleaned = cleaned.replace(/(Bearer\s+)[^\s"'<>]+/gi, '$1[REDACTED]');
    return cleaned.replace(/([?&](?:key|api_key|token|access_token)=)[^&\s"']+/gi, '$1[REDACTED]');
  };
  function visit(value: unknown): unknown {
    if (typeof value === 'string') {
      // error.message 常是包住伺服器 errorDetails 的 JSON 字串。
      try { return visit(JSON.parse(value)); } catch { return cleanText(value); }
    }
    if (!value || typeof value !== 'object') return typeof value === 'function' ? '[Function]' : value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.map(visit);
    const result: Record<string, unknown> = {};
    for (const name of Object.getOwnPropertyNames(value)) {
      if (/authorization|cookie|api.?key|token|secret|password/i.test(name)) { result[name] = '[REDACTED]'; continue; }
      try { result[name] = visit(Reflect.get(value, name)); } catch { result[name] = '[Unreadable]'; }
    }
    return result;
  }
  return visit(error);
}
