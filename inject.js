// inject.js - 더망고 페이지 내부로 주입되는 스크립트 (V3.3)

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
        console.log(`🚀 [실행] 마켓 삭제 프로세스 시작 - 유형: ${mode}`);

        // (1) 브라우저 확인창(confirm) 임시 백업 및 자동 승인 설정
        // 첫 번째 "정말 삭제할까요?" 질문만 자동으로 넘깁니다.
        const originalConfirm = window.confirm;
        window.confirm = function() { 
            console.log("✅ [자동승인] 첫 번째 삭제 확인창 통과");
            return true; 
        };

        try {
            // (2) 더망고 전역 함수 호출
            if (mode === 'all') {
                window.goods_permanent_delete('all', '', '', '');
            } else {
                window.goods_permanent_delete('', '', '', '');
            }
        } catch (e) {
            console.error("❌ [실행 오류] 호출 실패:", e);
        }

        // (3) ★ 핵심: 함수 호출 직후 즉시 복구
        // 삭제 성공 후 뜨는 alert(5.JPG)이 정상적으로 작동할 수 있도록 보장함
        // 딜레이 없이 즉시 복구하여 뒤따르는 알림창을 가로채지 않습니다.
        window.confirm = originalConfirm;
        console.log("🔄 [복구] 브라우저 알림 기능을 즉시 정상화했습니다.");
    }
})();
