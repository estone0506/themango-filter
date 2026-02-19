// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V2.1)

(function() {
    console.log("🔥 [더망고 V2] inject.js 로드됨 - 페이지 내부 함수 접근 가능");

    // 1. 메시지 수신 (content.js -> inject.js)
    window.addEventListener("message", function(event) {
        // 보안: 같은 윈도우에서 온 메시지만 처리
        if (event.source !== window) return;

        if (event.data.type && (event.data.type === "EXECUTE_MARKET_DELETE")) {
            console.log("🔥 [inject.js] 삭제 명령 수신:", event.data.mode);
            
            // 함수 존재 여부 확인 후 실행 (최대 3회 재시도)
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
            alert("더망고 페이지 함수(goods_permanent_delete)를 찾을 수 없습니다. 페이지를 완전히 불러온 후 다시 시도해 주세요.");
        }
    }

    // 2. 삭제 실행 로직
    function executeDelete(mode) {
        // (1) 브라우저 확인창(confirm, alert) 자동 승인 처리
        window.confirm = function(msg) { 
            console.log("✅ [자동승인] confirm 창 무시:", msg);
            return true; 
        };
        window.alert = function(msg) { 
            console.log("ℹ️ [알림] alert 창 내용:", msg);
            return true; 
        };

        // (2) 더망고 전역 함수 호출
        console.log(`🚀 [실행] goods_permanent_delete('${mode === 'all' ? 'all' : ''}') 호출`);
        
        try {
            if (mode === 'all') {
                window.goods_permanent_delete('all', '', '', '');
            } else {
                window.goods_permanent_delete('', '', '', '');
            }
        } catch (e) {
            console.error("❌ [실행 오류] goods_permanent_delete 호출 실패:", e);
        }
    }
})();
