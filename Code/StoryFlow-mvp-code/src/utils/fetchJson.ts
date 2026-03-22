/**
 * 带超时的 fetch JSON（避免旧版微信 WebView 上请求长时间挂起导致界面卡在「加载中」）
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs = 20000
): Promise<T> {
  const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
  return Promise.race([
    fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(timeoutError), timeoutMs);
    }),
  ]);
}
