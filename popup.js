// popup.js - 더망고 V2 리모컨 (삭제 버튼 제어)

document.addEventListener('DOMContentLoaded', async () => {
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const statusDiv = document.getElementById('status');

    // 1. 선택 삭제 버튼 이벤트
    deleteSelectedBtn.addEventListener('click', async () => {
        if (!confirm('선택된 상품의 마켓 삭제를 시작하시겠습니까?')) return;
        await sendDeleteMessage('selected');
        updateStatus('✅ 선택 상품 삭제 요청 전송');
    });

    // 2. 전체 삭제 버튼 이벤트
    deleteAllBtn.addEventListener('click', async () => {
        if (!confirm('🚨 경고: 검색 결과의 모든 상품을 마켓에서 삭제하시겠습니까?
(취소할 수 없습니다.)')) return;
        await sendDeleteMessage('all');
        updateStatus('🚨 전체 상품 삭제 요청 전송');
    });

    // 3. 메시지 전송 함수 (Popup -> Content)
    async function sendDeleteMessage(mode) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url.includes('tmg4084.mycafe24.com')) {
                updateStatus('❌ 더망고 관리자 페이지가 아닙니다.');
                return;
            }

            // 메시지 전송
            await chrome.tabs.sendMessage(tab.id, { 
                action: "TRIGGER_DELETE", 
                mode: mode 
            });

        } catch (error) {
            console.error(error);
            updateStatus('❌ 전송 실패: ' + error.message);
        }
    }

    function updateStatus(msg) {
        statusDiv.textContent = msg;
        statusDiv.style.opacity = '1';
        setTimeout(() => { statusDiv.style.opacity = '0'; }, 3000);
    }
});
