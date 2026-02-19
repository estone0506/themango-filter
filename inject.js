// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V5.3)

(function() {
    console.log("🔥 [더망고 V2] inject.js 로드됨 - 페이지 내부 함수 호출 준비 완료");

    // 1. 메시지 수신 리스너
    window.addEventListener("message", function(event) {
        if (event.source !== window) return;
        if (event.data.type === "EXECUTE_MARKET_DELETE") {
            tryExecuteWithRetry(event.data.mode, 0);
        }
        if (event.data.type === "SET_MARKET_SYNC") {
            setMarketStatus(event.data.market, event.data.checked);
        }
    });

    // 2. 삭제 완료 후 자동 체크 및 수집 실행 (핵심 통합 로직)
    function checkAutoRun() {
        const url = window.location.href;
        if (url.includes('getGoodsCategory.php') && url.includes('is_after_del=Y')) {
            console.log("🚀 [더망고 V2] 자동화 프로세스 가동 - 요소를 찾는 중...");
            
            let retry = 0;
            const timer = setInterval(() => {
                const firstCheckbox = document.querySelector('#search_category tbody tr input[name="chk_value"]');
                const isFuncReady = typeof window.site_check_window === 'function';

                if (firstCheckbox && isFuncReady) {
                    clearInterval(timer);
                    
                    // (1) 체크박스 체크
                    firstCheckbox.checked = true;
                    console.log("✅ [성공] 필터 자동 체크 완료");
                    
                    // (2) 수집 함수 실행 (페이지 내부 함수 호출)
                    setTimeout(() => {
                        console.log("🚀 [실행] site_check_window() 호출");
                        window.site_check_window();
                    }, 300);
                } else {
                    retry++;
                    if (retry > 50) { 
                        clearInterval(timer);
                        console.log("❌ [중단] 자동 실행 요소를 찾지 못했습니다 (5초 경과)");
                    }
                }
            }, 100); 
        }
    }

    // 페이지 진입 시 실행
    checkAutoRun();

    // --- 유틸리티 함수들 ---
    function tryExecuteWithRetry(mode, retryCount) {
        if (typeof window.goods_permanent_delete === 'function') {
            if (mode === 'all') window.goods_permanent_delete('all', '', '', '');
            else window.goods_permanent_delete('', '', '', '');
        } else if (retryCount < 5) {
            setTimeout(() => tryExecuteWithRetry(mode, retryCount + 1), 1000);
        }
    }

    function setMarketStatus(market, checked) {
        const checkboxMap = { 'coupang': 'chk_coupang', 'gmarket': 'chk_gmarket20', '11st': 'chk_11st', 'smartstore': 'chk_smartstore', 'lotteon': 'chk_lotteon', 'auction': 'chk_auction20' };
        const baseId = checkboxMap[market];
        if (baseId && typeof window.select_tab === 'function') {
            const checkbox = document.getElementById(baseId + '_yn');
            if (checkbox && checkbox.checked !== checked) {
                window.select_tab(baseId, 'primary');
            }
        }
    }
})();
