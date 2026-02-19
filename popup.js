// popup.js - 더망고 V2 리모컨 (삭제 버튼 제어)

document.addEventListener('DOMContentLoaded', async () => {
    const collectFiltersBtn = document.getElementById('collectFiltersBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const statusDiv = document.getElementById('status');

    const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

    // 1. 과거 필터 수집 버튼 이벤트 (URL 이동)
    collectFiltersBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.update(tab.id, { url: TARGET_FILTER_URL });
            updateStatus('🔄 필터 수집 페이지로 이동 중...');
        }
    });

    // 2. 전체 삭제 버튼 이벤트
    deleteAllBtn.addEventListener('click', async () => {
        if (!confirm('🚨 경고: 검색 결과의 모든 상품을 마켓에서 삭제하시겠습니까?\n(취소할 수 없습니다.)')) return;
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
