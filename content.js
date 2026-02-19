// content.js - 다리 역할 스크립트 (V2)

(function() {
    console.log("🌐 [더망고 V2] content.js 로드됨");

    // 1. inject.js 페이지 내 주입 (핵심)
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function() {
        this.remove(); // 실행 후 스크립트 태그 삭제 (메모리 절약)
        console.log("✅ [성공] inject.js 실행 완료");
    };
    (document.head || document.documentElement).appendChild(script);

    // 2. 팝업 메시지 수신 (Popup -> content.js)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("📨 [수신] Popup 메시지:", request);

        if (request.action === "TRIGGER_DELETE") {
            // (1) 메시지 포워딩 (content.js -> inject.js)
            window.postMessage({
                type: "EXECUTE_MARKET_DELETE",
                mode: request.mode // 'all' or 'selected'
            }, "*");

            sendResponse({ status: "forwarded" });
        }
    });
})();
