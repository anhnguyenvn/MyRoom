/**
 * https://github.com/mash-up-kr/proof_web/blob/master/apps/service/src/utils/copyToClipboard.ts
 */
const getDummyTextarea = () => {
  const textarea = document.createElement('textarea') as HTMLTextAreaElement;
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.display = 'fixed';

  return textarea;
};

export const isClipboardSupported = () => navigator?.clipboard != null;
export const isClipboardCommandSupported = () =>
  document.queryCommandSupported?.('copy') ?? false;

/**
 * 인자로 받은 텍스트를 클립보드에 복사합니다.
 * @param text 복사할 텍스트
 *
 * @example
 * ```ts
 * const result = await copyToClipboard('하이');
 * if (result) {
 *   console.log('클립보드에 복사 성공');
 * } else {
 *   console.log('클립보드에 복사 실패');
 * }
 * ```
 */

export const copyToClipboard = (text: string) => {
  const promise = new Promise<boolean>((resolve) => {
    const rootElement = document.body;

    // if (isClipboardSupported()) {
    //   await navigator.clipboard.writeText(text);
    //   resolve(true);
    //   return;
    // }

    if (isClipboardCommandSupported()) {
      const textarea = getDummyTextarea();
      textarea.value = text;

      rootElement.appendChild(textarea);

      textarea.focus();
      textarea.select();

      document.execCommand('copy');
      rootElement.removeChild(textarea);
      resolve(true);
      return;
    }

    resolve(false);
    return;
  });
  return promise;
};

export default copyToClipboard;
