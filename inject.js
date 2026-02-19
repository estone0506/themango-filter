// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V3.4)

(function() {
    console.log("🔥 [더망고 V2] inject.js 로드됨 - 페이지 내부 함수 접근 가능");

    // 1. 메시지 수신 (content.js -> inject.js)
    window.addEventListener("message", function(event) {
        if (event.source !== window) return;

        if (event.data.type && (event.data.type === "EXECUTE_MARKET_DELETE")) {
            console.log("🔥 [inject.js] 삭제 명령 수신:", event.data.mode);
            tryExecuteWithRetry(event.data.mode, 0);
        }
    });

    function tryExecuteWithRetry(mode, retryCount) {
        if (typeof window.goods_permanent_delete === 'function') {
            executeDelete(mode);
        } else if (retryCount < 5) {
            console.log(`⏳ [inject.js] 함수 로딩 대기 중... (${retryCount + 1}/5)`);
            setTimeout(() => tryExecuteWithRetry(mode, retryCount + 1), 1000);
        } else {
            console.error("❌ [오류] goods_permanent_delete 함수를 찾을 수 없습니다.");
            alert("더망고 페이지 함수(goods_permanent_delete)를 찾을 수 없습니다.");
        }
    }

    // 2. 삭제 실행 로직
    function executeDelete(mode) {
        console.log(`🚀 [실행] 마켓 삭제 함수 호출 - 유형: ${mode}`);

        // 자동 승인(confirm 오버라이드) 로직을 모두 제거했습니다.
        // 이제 더망고 페이지의 원래 확인창이 나타납니다.
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
})();
