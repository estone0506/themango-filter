// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V2)

(function() {
    console.log("🔥 [더망고 V2] inject.js 로드됨 - 페이지 내부 함수 접근 가능");

    // 1. 메시지 수신 (content.js -> inject.js)
    window.addEventListener("message", function(event) {
        // 보안: 같은 윈도우에서 온 메시지만 처리
        if (event.source !== window) return;

        if (event.data.type && (event.data.type === "EXECUTE_MARKET_DELETE")) {
            console.log("🔥 [inject.js] 삭제 명령 수신:", event.data.mode);
            executeDelete(event.data.mode);
        }
    });

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
        if (typeof window.goods_permanent_delete === 'function') {
            console.log(`🚀 [실행] goods_permanent_delete('${mode === 'all' ? 'all' : ''}') 호출`);
            
            if (mode === 'all') {
                // 전체 삭제 (검색 결과)
                window.goods_permanent_delete('all', '', '', '');
            } else {
                // 선택 삭제
                window.goods_permanent_delete('', '', '', '');
            }
        } else {
            console.error("❌ [오류] goods_permanent_delete 함수를 찾을 수 없습니다.");
            alert("더망고 페이지 함수(goods_permanent_delete)를 찾을 수 없습니다.");
        }
    }
})();
