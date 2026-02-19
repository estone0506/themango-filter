// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V3.7)

(function() {
    console.log("🔥 [더망고 V2] inject.js 로드됨");

    window.addEventListener("message", function(event) {
        if (event.source !== window) return;

        // 1. 삭제 실행 명령
        if (event.data.type === "EXECUTE_MARKET_DELETE") {
            console.log("🔥 [inject.js] 삭제 명령 수신:", event.data.mode);
            tryExecuteWithRetry(event.data.mode, 0);
        }

        // 2. 마켓 선택 명령 (추가)
        if (event.data.type === "SET_MARKET_SYNC") {
            setMarketStatus(event.data.market, event.data.checked);
        }
    });

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
        } catch (e) {
            console.error("❌ [실행 오류] 호출 실패:", e);
        }
    }

    // 페이지의 원래 함수를 사용하여 마켓 상태 변경 (중복 알람 방지)
    function setMarketStatus(market, checked) {
        const checkboxMap = {
            'coupang': 'chk_coupang',
            'gmarket': 'chk_gmarket20',
            '11st': 'chk_11st',
            'smartstore': 'chk_smartstore',
            'lotteon': 'chk_lotteon',
            'auction': 'chk_auction20'
        };

        const baseId = checkboxMap[market];
        if (!baseId) return;

        const checkbox = document.getElementById(baseId + '_yn');
        if (!checkbox) return;

        // 현재 상태와 요청된 상태가 다를 때만 실행
        if (checkbox.checked !== checked) {
            if (typeof window.select_tab === 'function') {
                // 페이지의 원래 함수 호출 (라벨 색상까지 자동 변경됨)
                window.select_tab(baseId, 'primary');
            } else {
                // 함수가 없을 경우 대비한 백업
                checkbox.checked = checked;
                const span = document.getElementById(baseId);
                if (span) span.className = checked ? 'label label-primary market btn_style1' : 'label label-default market btn_style1';
            }
        }
    }
})();
