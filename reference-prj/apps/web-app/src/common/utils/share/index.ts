/**
 * https://github.com/mash-up-kr/proof_web/blob/master/apps/service/src/utils/share.ts
 */

import copyToClipboard from './copyToClipboard';

export const isShareSupported = () => navigator.share ?? false;

/**
 * 인자로 받은 data를 OS 기본옵션으로 공유합니다.
 * 기본 공유옵션이 지원되지 않을 경우, url만을 클립보드에 링크를 복사하는 기능으로 대체됩니다.
 *
 * @param data 공유할 data 객체
 * @param data.url 공유될 또는 클립복드에 복사될 url
 * @param data.text 공유시 해당 메신저에 추가적인 텍스트로 전달되는 문구
 * @param data.title 공유시 썸네일에 제공되는 타이틀 문구
 * @param data.files 공유할 file 리스트
 *
 * @example
 * ```ts
 * const result = await share('data');
 * if (result === 'share') {
 *   console.log('공유 성공');
 * } else if (result === 'clipboard') {
 *   console.log('클립보드 복사 성공');
 * } else {
 *   console.log('공유 실패');
 * }
 * ```
 */

export const share = (data: ShareData) => {
  const promise = new Promise<'shared' | 'copiedToClipboard' | 'failed'>(
    (resolve) => {
      if (isShareSupported()) {
        navigator.share(data).then(() => {
          resolve('shared');
          return 'shared';
        });
      }

      if (data.url) {
        copyToClipboard(data.url).then((result) => {
          if (result) {
            resolve('copiedToClipboard');
            return 'copiedToClipboard';
          }
        });
      }
      resolve('failed');
      return 'failed';
    },
  );
  return promise;
};

export default share;
