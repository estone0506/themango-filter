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
        applySavedMarketsOnLoad();
    } else {
        window.addEventListener('load', () => {
            injectScriptFile();
            applySavedMarketsOnLoad();
        });
    }

    // [추가] 페이지 로드 시 저장된 마켓 정보 자동 적용
    function applySavedMarketsOnLoad() {
        if (window.location.href.includes('admin_goods_update.php')) {
            chrome.storage.local.get(['savedMarkets'], (result) => {
                if (result.savedMarkets) {
                    console.log("📦 [더망고 V2] 저장된 마켓 정보 적용 중...");
                    Object.entries(result.savedMarkets).forEach(([market, checked]) => {
                        window.postMessage({ type: "SET_MARKET_SYNC", market: market, checked: checked }, "*");
                    });
                }
            });
        }
    }

    let currentFilterName = "";

    // 2. 팝업 메시지 수신 및 포워딩
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "NAVIGATE") {
            window.location.href = request.url;
            return;
        }
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

    // 작업 완료 감시 (V5.4 업데이트)
    const observer = new MutationObserver(() => {
        const targetNode = document.getElementById('layer_page') || document.body;
        const pageText = targetNode.innerText || "";

        // 1. 마켓삭제 완료 감시 (기존 로직)
        if (pageText.includes("마켓삭제가 완료되었습니다")) {
            const urlParams = new URLSearchParams(window.location.search);
            const filterName = currentFilterName || urlParams.get('ps_subject') || "";
            console.log(`✅ [마켓삭제 완료] 3초 후 수집 페이지로 이동: ${filterName}`);
            
            setTimeout(() => {
                window.location.href = `https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=${encodeURIComponent(filterName)}&ft_num=10&ft_show=&ft_sort=register_asc&is_after_del=Y`;
            }, 3000);
            observer.disconnect();
        }

        // 2. 신규상품수집 완료 감시 (신규 추가)
        if (pageText.includes("신규상품수집이 모두 완료되었습니다")) {
            console.log("🎊 [신규상품수집 완료] 감지됨! 3초 후 상품 관리 페이지로 이동합니다.");
            
            const urlParams = new URLSearchParams(window.location.search);
            const filterName = currentFilterName || urlParams.get('sch_keyword') || "";
            
            // 날짜 정보 (오늘 날짜 기준)
            const now = new Date();
            const yy = now.getFullYear();
            const mm = now.getMonth() + 1;
            const dd = now.getDate();

            // 이동할 목표 URL (필터명 동적 반영)
            const REDIRECT_URL = `https://tmg4084.mycafe24.com/mall/admin/admin_goods_update.php?amode=detail_search&search_d=&pg=1&search_type=&ps_fn=&ps_sort=&ps_category=&s_market=%5B%2211ST%22%2C%22SMART%22%2C%22LTON%22%5D&ps_gmarket_option=&filter_code=&date_type=&ps_chd=&start_yy=${yy}&start_mm=${mm}&start_dd=${dd}&end_yy=${yy}&end_mm=${mm}&end_dd=${dd}&ps_market_id=no_reg&ps_status=stock&search_type=filter_name&ps_subject=${encodeURIComponent(filterName)}&search_order=asc`;

            setTimeout(() => {
                window.location.href = REDIRECT_URL;
            }, 3000);
            
            observer.disconnect();
        }

        // 3. 마켓 전송(업데이트) 완료 감시 (V5.5.8 추가)
        if (pageText.includes("상품의 가격 업데이트 및 선택하신 마켓으로 상품 전송이 모두 완료되었습니다")) {
            const filterInput = document.querySelector('input[name="ps_subject"]');
            const filterName = filterInput ? filterInput.value : "알 수 없는 필터";
            
            console.log("🏁 [더망고 V2] 모든 프로세스 완료 감지");
            alert(`${filterName} + 마켓 삭제 + 신규 수집 + 마켓 신규 등록 완료`);
            
            // 알림창 확인 후 탭 닫기 명령 전송
            chrome.runtime.sendMessage({ action: "CLOSE_TAB" });
            
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
