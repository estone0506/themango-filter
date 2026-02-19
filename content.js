// content.js - 다리 역할 스크립트 (V2.1)

(function() {
    console.log("🌐 [더망고 V2] content.js 로드됨");

    // 1. inject.js 페이지 내 주입 (핵심)
    const injectScript = () => {
        if (document.getElementById('themango-v2-inject')) return;

        const script = document.createElement('script');
        script.id = 'themango-v2-inject';
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
            this.remove(); // 실행 후 스크립트 태그 삭제 (메모리 절약)
            console.log("✅ [성공] inject.js 실행 완료");
        };
        (document.head || document.documentElement).appendChild(script);
    };

    // 즉시 주입 시도
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
    } else {
        injectScript();
    }

    // 2. 팝업 메시지 수신 (Popup -> content.js)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("📨 [수신] Popup 메시지:", request);

        if (request.action === "GET_FILTERS") {
            const filters = scrapeFilters();
            sendResponse({ data: filters });
        }

        if (request.action === "TRIGGER_DELETE") {
            // 주입이 안 된 경우 다시 시도
            injectScript();

            // (1) 메시지 포워딩 (content.js -> inject.js)
            // 약간의 딜레이를 주어 inject.js의 리스너가 준비될 시간을 줌
            setTimeout(() => {
                window.postMessage({
                    type: "EXECUTE_MARKET_DELETE",
                    mode: request.mode // 'all' or 'selected'
                }, "*");
                console.log("📤 [송신] inject.js로 명령 전송 완료");
            }, 100);

            sendResponse({ status: "forwarded" });
        }
        return true;
    });

    // 3. 필터 수집 함수
    function scrapeFilters() {
        const filters = [];
        const rows = document.querySelectorAll('#search_category tbody tr');
        
        rows.forEach(row => {
            const checkbox = row.querySelector('input[name="chk_value"]');
            const nameInput = row.querySelector('input.input_[type="text"]');
            
            if (checkbox && nameInput) {
                const uid = checkbox.value.split('|')[0];
                const name = nameInput.value.trim();
                filters.push({ id: uid, name: name });
            }
        });
        
        return filters.slice(0, 10); // 상위 10개만 반환
    }
})();
