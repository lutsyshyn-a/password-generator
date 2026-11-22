/** Копіює текст у буфер обміну. Повертає true, якщо вдалося. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const previousFocus = document.activeElement;
    const t = document.createElement("textarea");
    t.value = text;
    t.setAttribute("readonly", "");
    t.style.position = "fixed";
    t.style.opacity = "0";
    document.body.appendChild(t);
    try {
      t.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      t.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    }
  }
}
