/** 前端只认识 /api/ai，永远不接触 DeepSeek Key */
function apiUrl() {
  // 部分托管预览网关用 sharecode 校验请求；带上当前页面参数可避免 Cookie 被拦时失效。
  // Vercel / 本地环境没有这个参数，路径仍是 /api/ai。
  const sharecode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('sharecode')
      : null;
  return sharecode ? `/api/ai?sharecode=${encodeURIComponent(sharecode)}` : '/api/ai';
}

const offline = () => globalThis.navigator?.onLine === false;
const connectionError = (error) => error instanceof TypeError || /load failed|failed to fetch|networkerror|network request failed|network connection was lost/i.test(error?.message || String(error || ''));

// 也用于展示旧记录里保存的 Safari「Load failed」，不让浏览器原始错误直接进界面。
export function aiErrorMessage(error) {
  if (error?.name === 'AbortError') return '这次加工等得有点久，原文已保留，请再试一次。';
  if (connectionError(error)) return offline()
    ? '网络已断开，原文已保留。连接网络后再试一次。'
    : '网络连接中断，原文已保留。请检查网络后再试一次。';
  return (typeof error === 'string' ? error : error?.message) || '这次加工没有完成，原文已保留，请再试一次。';
}

export async function callAI(action, payload) {
  if (offline()) throw new Error('网络已断开，原文已保留。连接网络后再试一次。');
  const controller = new AbortController();
  // 两次上游请求最多 40 秒；客户端总等待 55 秒，生产函数留 60 秒收尾。
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(apiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) {
          await res.body?.cancel();
          const error = new Error(res.status === 429
            ? '加工请求有点多，请稍后再试，原文已保留。'
            : '加工服务暂时没连上，原文已保留，请稍后再试。');
          error.retryable = [502, 503, 504].includes(res.status);
          throw error;
        }
        let json;
        try {
          json = await res.json();
        } catch (error) {
          if (error.name === 'AbortError' || connectionError(error)) throw error;
          throw new Error('加工结果未能完整读取，原文已保留，请再试一次。');
        }
        if (!json?.ok) throw new Error(json?.error || '加工失败，请稍后重试');
        return json;
      } catch (error) {
        // 仅对临时断线/网关故障补试一次；不重建记录，不重复追加结果。
        if (attempt || controller.signal.aborted || offline() || !(connectionError(error) || error.retryable)) throw error;
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  } catch (error) {
    throw new Error(aiErrorMessage(controller.signal.aborted ? { name: 'AbortError' } : error));
  } finally {
    clearTimeout(timer);
  }
}
