// Mobile Safari can ignore viewport scale limits. Keep its page gestures
// from zooming the app while ordinary scrolling and text editing still work.
export function installStableViewport() {
  const preventPageZoom = (event) => event.preventDefault();
  for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(name, preventPageZoom, { passive: false });
  }
}
