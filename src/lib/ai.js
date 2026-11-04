/** 前端只认识 /api/ai，永远不接触 DeepSeek Key */
export async function callAI(action, payload) {
  const res = await fetch('/api/ai', {
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
