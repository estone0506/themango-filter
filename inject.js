// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V5.2)

(function() {
    console.log("🔥 [더망고 V2] inject.js 로드됨");

    // 1. 메시지 수신 리스너 (기존 기능 유지)
    window.addEventListener("message", function(event) {
        if (event.source !== window) return;
        if (event.data.type === "EXECUTE_MARKET_DELETE") {
            tryExecuteWithRetry(event.data.mode, 0);
        }
        if (event.data.type === "SET_MARKET_SYNC") {
            setMarketStatus(event.data.market, event.data.checked);
        }
    });

    // 2. 삭제 완료 후 자동 체크 및 수집 실행 (V5.2 통합)
    function checkAutoRun() {
        const url = window.location.href;
        if (url.includes('getGoodsCategory.php') && url.includes('is_after_del=Y')) {
            console.log("🚀 [더망고 V2] 삭제 후 이동 감지 - 자동화 프로세스 가동");
            
            // 함수와 체크박스가 로드될 때까지 최대 5초간 감시
            let retry = 0;
            const timer = setInterval(() => {
                const firstCheckbox = document.querySelector('#search_category tbody tr input[name="chk_value"]');
                const isFuncReady = typeof window.site_check_window === 'function';

                if (firstCheckbox && isFuncReady) {
                    clearInterval(timer);
                    firstCheckbox.checked = true;
                    console.log("✅ [더망고 V2] 필터 자동 체크 완료");
                    
                    // 체크가 반영될 시간을 짧게 주고 함수 실행
                    setTimeout(() => {
                        console.log("🚀 [더망고 V2] site_check_window() 실행");
                        window.site_check_window();
                    }, 300);
                } else {
                    retry++;
                    if (retry > 50) { // 5초 경과 시 포기
                        clearInterval(timer);
                        console.error("❌ [더망고 V2] 자동 실행 요소를 찾지 못해 중단합니다.");
                    }
                }
            }, 100); // 0.1초 단위로 정밀하게 체크
        }
    }

    // 초기 실행
    checkAutoRun();

    // --- 유틸리티 함수들 ---
    function tryExecuteWithRetry(mode, retryCount) {
        if (typeof window.goods_permanent_delete === 'function') {
            executeDelete(mode);
        } else if (retryCount < 5) {
            setTimeout(() => tryExecuteWithRetry(mode, retryCount + 1), 1000);
        }
    }

    function executeDelete(mode) {
        try {
            if (mode === 'all') {
                window.goods_permanent_delete('all', '', '', '');
            } else {
                window.goods_permanent_delete('', '', '', '');
            }
        } catch (e) { console.error("❌ 호출 실패:", e); }
    }

    function setMarketStatus(market, checked) {
        const checkboxMap = { 'coupang': 'chk_coupang', 'gmarket': 'chk_gmarket20', '11st': 'chk_11st', 'smartstore': 'chk_smartstore', 'lotteon': 'chk_lotteon', 'auction': 'chk_auction20' };
        const baseId = checkboxMap[market];
        if (!baseId) return;
        const checkbox = document.getElementById(baseId + '_yn');
        if (checkbox && checkbox.checked !== checked) {
            if (typeof window.select_tab === 'function') {
                window.select_tab(baseId, 'primary');
            }
        }
    }
})();
