// content.js - 다리 역할 스크립트 (V5.3)

(function() {
    console.log("🌐 [더망고 V2] content.js 로드됨");

    // 1. inject.js 파일 주입 (CSP 보안 정책을 통과하는 안전한 방식)
    const injectScriptFile = () => {
        if (document.getElementById('themango-v2-inject')) return;
        const script = document.createElement('script');
        script.id = 'themango-v2-inject';
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
            console.log("✅ [성공] inject.js 파일 로드 완료");
            this.remove(); 
        };
        (document.head || document.documentElement).appendChild(script);
    };

    // 즉시 주입
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectScriptFile();
    } else {
        window.addEventListener('load', injectScriptFile);
    }

    let currentFilterName = "";

    // 2. 팝업 메시지 수신 및 포워딩
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "SYNC_MARKETS") {
            window.postMessage({ type: "SET_MARKET_SYNC", market: request.market, checked: request.checked }, "*");
        }
        if (request.action === "TRIGGER_DELETE") {
            window.postMessage({ type: "EXECUTE_MARKET_DELETE", mode: request.mode }, "*");
        }
        if (request.action === "CLICK_REAL_DELETE_ALL_BTN") {
            currentFilterName = request.filterName; 
            // 삭제 페이지 내의 버튼 클릭 연동
            const allButtons = Array.from(document.querySelectorAll('a, button'));
            const targetBtn = allButtons.find(btn => btn.innerText.includes('마켓삭제시작') && btn.innerText.includes('검색결과모든상품'));
            if (targetBtn) targetBtn.click();
        }
        if (request.action === "GET_FILTERS") { sendResponse({ data: scrapeFilters() }); }
        if (request.action === "GET_PAGE_MARKET_STATUS") { sendResponse({ status: getPageMarketStatus() }); }
        return true;
    });

    function scrapeFilters() {
        const filters = [];
        const rows = document.querySelectorAll('#search_category tbody tr');
        rows.forEach(row => {
            const checkbox = row.querySelector('input[name="chk_value"]');
            const nameInput = row.querySelector('input.input_[type="text"]');
            if (checkbox && nameInput) {
                filters.push({ id: checkbox.value.split('|')[0], name: nameInput.value.trim() });
            }
        });
        return filters.slice(0, 10);
    }

    function getPageMarketStatus() {
        const checkboxMap = { 'coupang': 'chk_coupang_yn', 'gmarket': 'chk_gmarket20_yn', '11st': 'chk_11st_yn', 'smartstore': 'chk_smartstore_yn', 'lotteon': 'chk_lotteon_yn', 'auction': 'chk_auction20_yn' };
        const status = {};
        for (const [key, id] of Object.entries(checkboxMap)) {
            const el = document.getElementById(id);
            status[key] = el ? el.checked : false;
        }
        return status;
    }

    // 작업 완료 감시 (V4.8 로직)
    const observer = new MutationObserver(() => {
        const targetNode = document.getElementById('layer_page');
        if (targetNode && targetNode.innerText.includes("마켓삭제가 완료되었습니다")) {
            const urlParams = new URLSearchParams(window.location.search);
            const filterName = currentFilterName || urlParams.get('ps_subject') || "";
            setTimeout(() => {
                window.location.href = `https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=${encodeURIComponent(filterName)}&ft_num=10&ft_show=&ft_sort=register_asc&is_after_del=Y`;
            }, 3000);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
