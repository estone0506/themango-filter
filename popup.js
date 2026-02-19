// popup.js - 더망고 V2 리모컨 (삭제 버튼 제어)

document.addEventListener('DOMContentLoaded', async () => {
    const collectFiltersBtn = document.getElementById('collectFiltersBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const statusDiv = document.getElementById('status');
    const filterTableBody = document.getElementById('filterTableBody');
    const marketSection = document.getElementById('marketSection');
    const startDeleteBtn = document.getElementById('startDeleteBtn');

    const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

    let lastDataJson = ""; 

    // 1. 팝업 시작 시 저장된 데이터 불러오기 및 페이지 확인
    loadSavedData();
    checkCurrentPage();

    // 2. 1초마다 실시간 수집 실행 (필터 페이지일 때만 업데이트)
    const pollInterval = setInterval(() => {
        fetchRealtimeData();
        checkCurrentPage();
    }, 1000);

    async function checkCurrentPage() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('admin_goods_update_delete.php')) {
            marketSection.style.display = 'block';
        } else {
            marketSection.style.display = 'none';
        }
    }

    // 마켓 체크박스 연동 (1대1 실시간)
    document.querySelectorAll('.market-chk').forEach(chk => {
        chk.addEventListener('change', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: "SYNC_MARKETS",
                    market: chk.value,
                    checked: chk.checked
                });
            }
        });
    });

    // 마켓 삭제 시작 버튼
    startDeleteBtn.addEventListener('click', async () => {
        // 팝업 내 중복 confirm을 제거하여 더망고 자체 알람만 뜨게 합니다.
        await sendDeleteMessage('selected');
        updateStatus('🚀 마켓 삭제 프로세스 요청됨');
    });

    async function loadSavedData() {
        chrome.storage.local.get(['savedFilters'], (result) => {
            if (result.savedFilters) {
                renderFilterTable(result.savedFilters);
                lastDataJson = JSON.stringify(result.savedFilters);
                updateStatus('📦 저장된 필터 목록을 불러왔습니다.');
            }
        });
    }

    async function fetchRealtimeData() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('getGoodsCategory.php')) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_FILTERS" });
                if (response && response.data) {
                    const currentDataJson = JSON.stringify(response.data);
                    
                    if (currentDataJson !== lastDataJson) {
                        renderFilterTable(response.data);
                        lastDataJson = currentDataJson;
                        
                        // 데이터 저장 (영구성 확보)
                        chrome.storage.local.set({ savedFilters: response.data });
                        updateStatus('📡 실시간 동기화 완료');
                    } else {
                        updateStatus('📡 실시간 연결 중...');
                    }
                }
            } else {
                // 필터 페이지가 아니어도 테이블은 유지됨 (상태 메시지만 변경)
                if (lastDataJson) {
                    updateStatus('✅ 수집된 데이터 유지 중 (페이지 이동 가능)');
                } else {
                    updateStatus('ℹ️ 필터 수집 페이지에서 데이터를 가져오세요.');
                }
            }
        } catch (e) {
            // 통신 에러 시에도 기존 데이터는 유지
        }
    }

    function renderFilterTable(filters) {
        filterTableBody.innerHTML = '';
        // 받은 데이터 렌더링
        filters.forEach((filter, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" data-id="${filter.id}" data-name="${filter.name}"></td>
                <td style="text-align:left; padding-left:10px;">${filter.name}</td>
                <td>${filter.id}</td>
            `;
            filterTableBody.appendChild(tr);
        });

        // 10줄을 맞추기 위한 빈 행 추가
        for (let i = filters.length; i < 10; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td></td><td></td><td></td>';
            filterTableBody.appendChild(tr);
        }
    }

    // 1. 과거 필터 수집 버튼 이벤트 (URL 이동)
    collectFiltersBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.update(tab.id, { url: TARGET_FILTER_URL });
            updateStatus('🔄 필터 수집 페이지로 이동 중...');
        }
    });

    // 2. 삭제 페이지로 이동 버튼 이벤트
    deleteAllBtn.addEventListener('click', async () => {
        // 체크된 필터 찾기
        const selectedCheckbox = document.querySelector('#filterTableBody input[type="checkbox"]:checked');
        
        if (!selectedCheckbox) {
            alert('이동할 필터를 테이블에서 먼저 선택해주세요.');
            return;
        }

        const filterName = selectedCheckbox.getAttribute('data-name');
        const encodedName = encodeURIComponent(filterName);

        // 동적 URL 생성 (ps_subject 부분 교체)
        const DELETE_PAGE_URL = `https://tmg4084.mycafe24.com/mall/admin/admin_goods_update_delete.php?bmode=market_only&amode=detail_search&search_d=&pg=1&search_type=&ps_fn=&ps_sort=&ps_num=10&ps_simple=1&ps_modify=&ps_gmarket_option=&filter_code=&date_type=&ps_chd=&start_yy=2026&start_mm=2&start_dd=19&end_yy=2026&end_mm=2&end_dd=19&ps_site_id=&ps_market_id=&ps_status=sale&search_type=filter_name&ps_subject=${encodedName}&hid_order_sql=%2522%2520order%2520by%2520%2520uid%2520asc%2522&hid_search_sql=+where+goods_class+%3D+%270%27++and+goods_status+%3D+%270%27+`;
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.update(tab.id, { url: DELETE_PAGE_URL });
            updateStatus(`🔄 [${filterName}] 검색 결과로 이동 중...`);
        }
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
