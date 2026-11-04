/** 前端只认识 /api/ai，永远不接触 DeepSeek Key */
function apiUrl() {
  // 部分托管预览网关用 sharecode 校验请求；带上当前页面参数可避免 Cookie 被拦时失效。
  // Vercel / 本地环境没有这个参数，路径仍是 /api/ai。
  const sharecode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('sharecode')
    : null;
  return sharecode ? `/api/ai?sharecode=${encodeURIComponent(sharecode)}` : '/api/ai';
}

export async function callAI(action, payload) {
  const res = await fetch(apiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('服务端返回异常，请稍后重试');
  }
  if (!res.ok || !json.ok) throw new Error(json.error || '加工失败，请稍后重试');
  return json;
}
