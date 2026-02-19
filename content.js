// content.js - 다리 역할 스크립트 (V3.6)

(function() {
    console.log("🌐 [더망고 V2] content.js 로드됨");

    // 1. inject.js 페이지 내 주입
    const injectScript = () => {
        if (document.getElementById('themango-v2-inject')) return;
        const script = document.createElement('script');
        script.id = 'themango-v2-inject';
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() { this.remove(); };
        (document.head || document.documentElement).appendChild(script);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
    } else {
        injectScript();
    }

    // 2. 팝업 메시지 수신
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "GET_FILTERS") {
            sendResponse({ data: scrapeFilters() });
        }

        if (request.action === "SYNC_MARKETS") {
            window.postMessage({
                type: "SET_MARKET_SYNC",
                market: request.market,
                checked: request.checked
            }, "*");
            sendResponse({ status: "forwarded" });
        }

        if (request.action === "GET_PAGE_MARKET_STATUS") {
            sendResponse({ status: getPageMarketStatus() });
        }

        if (request.action === "TRIGGER_DELETE") {
            injectScript();
            setTimeout(() => {
                window.postMessage({
                    type: "EXECUTE_MARKET_DELETE",
                    mode: request.mode 
                }, "*");
            }, 100);
            sendResponse({ status: "forwarded" });
        }
        return true;
    });

    // 필터 수집 함수
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
        return filters.slice(0, 10);
    }

    // 마켓 상태 동기화 (팝업 -> 페이지)
    function syncMarketOnPage(market, checked) {
        const checkboxMap = {
            'coupang': 'chk_coupang_yn',
            'gmarket': 'chk_gmarket20_yn',
            '11st': 'chk_11st_yn',
            'smartstore': 'chk_smartstore_yn',
            'lotteon': 'chk_lotteon_yn',
            'auction': 'chk_auction20_yn'
        };
        const checkboxId = checkboxMap[market];
        if (checkboxId) {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.checked = checked;
                const spanId = checkboxId.replace('_yn', '');
                const span = document.getElementById(spanId);
                if (span) {
                    span.className = checked ? 'label label-primary market btn_style1' : 'label label-default market btn_style1';
                }
            }
        }
    }

    // 현재 페이지 마켓 상태 가져오기 (페이지 -> 팝업)
    function getPageMarketStatus() {
        const checkboxMap = {
            'coupang': 'chk_coupang_yn',
            'gmarket': 'chk_gmarket20_yn',
            '11st': 'chk_11st_yn',
            'smartstore': 'chk_smartstore_yn',
            'lotteon': 'chk_lotteon_yn',
            'auction': 'chk_auction20_yn'
        };
        const status = {};
        for (const [key, id] of Object.entries(checkboxMap)) {
            const el = document.getElementById(id);
            status[key] = el ? el.checked : false;
        }
        return status;
    }
})();
