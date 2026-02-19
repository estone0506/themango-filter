// background.js - Service Worker

chrome.runtime.onInstalled.addListener(() => {
    console.log('더망고 필터 수집 익스텐션이 설치되었습니다.');
});

// 메시지 리스너 (필요시 확장 가능)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'collectFilters') {
        // 필터 수집 로직은 popup.js에서 처리
        sendResponse({ success: true });
    }
    return true;
});
