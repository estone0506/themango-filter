// popup.js - 더망고 필터 수집 익스텐션 (범용 도메인 수집 버전)

let filters = [];

document.addEventListener('DOMContentLoaded', () => {
    const collectBtn = document.getElementById('collectBtn');
    const selectAllCheckbox = document.getElementById('selectAll');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clear-btn') || document.getElementById('clearBtn');
    const selectAllMarkets = document.getElementById('selectAllMarkets');
    const deleteStartBtn = document.getElementById('deleteStartBtn');

    if (collectBtn) collectBtn.addEventListener('click', handleCollectClick);
    if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', toggleSelectAll);
    if (exportBtn) exportBtn.addEventListener('click', exportFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    if (selectAllMarkets) selectAllMarkets.addEventListener('change', toggleAllMarkets);
    if (deleteStartBtn) deleteStartBtn.addEventListener('click', startMarketDelete);

    document.querySelectorAll('.market-checkbox[name="market"]').forEach(checkbox => {
        checkbox.addEventListener('change', syncMarketCheckboxesToPage);
    });

    loadSavedFilters();
});

async function handleCollectClick() {
    const statusDiv = document.getElementById('status');
    const collectBtn = document.getElementById('collectBtn');
    
    try {
        statusDiv.textContent = '🔄 데이터 추출 중...';
        statusDiv.className = 'status loading';
        collectBtn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // 더망고 사이트 도메인만 확인 (상세 URL 체크는 생략)
        if (!tab.url.includes('tmg4084.mycafe24.com')) {
            throw new Error('더망고 관리자 페이지에서 실행해주세요.');
        }

        // 현재 탭에서 즉시 수집 시작
        await collectFilters();

    } catch (error) {
        statusDiv.textContent = `❌ ${error.message}`;
        statusDiv.className = 'status error';
        collectBtn.disabled = false;
    }
}

async function collectFilters() {
    const statusDiv = document.getElementById('status');
    const collectBtn = document.getElementById('collectBtn');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_MANGO_DATA" });

        if (response && response.data && response.data.length > 0) {
            filters = response.data.map(item => ({
                id: item.uid || item.id,
                siteId: item.siteId || '',
                name: item.name,
                createdDate: item.createdDate || '',
                checked: false
            }));

            statusDiv.textContent = `✅ ${filters.length}개의 필터를 수집했습니다.`;
            statusDiv.className = 'status success';
            displayFilters();
            saveFilters();
        } else {
            throw new Error('리스트를 찾을 수 없습니다. 필터 목록이 화면에 보이는지 확인하세요.');
        }
    } catch (error) {
        statusDiv.textContent = `❌ ${error.message}`;
        statusDiv.className = 'status error';
    } finally {
        collectBtn.disabled = false;
    }
}

// UI 렌더링 및 삭제 기능은 기존과 동일하게 유지
function displayFilters() {
    const filterList = document.getElementById('filterList');
    const filterItems = document.getElementById('filterItems');
    filterList.style.display = 'block';
    filterItems.innerHTML = '';
    filters.forEach((filter, index) => {
        const item = document.createElement('div');
        item.className = 'filter-item';
        item.innerHTML = `
            <input type="checkbox" id="filter_${index}" class="checkbox item-checkbox" ${filter.checked ? 'checked' : ''}>
            <input type="text" class="filter-name-input" value="${filter.name}" data-index="${index}">
            <div class="filter-info">
                ${filter.createdDate ? `<span class="filter-date">생성: ${filter.createdDate}</span>` : ''}
            </div>
        `;
        item.querySelector('.item-checkbox').addEventListener('change', (e) => {
            filters[index].checked = e.target.checked;
            updateSelectedCount();
            saveFilters();
        });
        item.querySelector('.filter-name-input').addEventListener('input', (e) => {
            filters[index].name = e.target.value;
            saveFilters();
        });
        filterItems.appendChild(item);
    });
    updateSelectedCount();
}
function toggleSelectAll(e) {
    const checked = e.target.checked;
    filters.forEach(filter => filter.checked = checked);
    document.querySelectorAll('.item-checkbox').forEach(checkbox => { checkbox.checked = checked; });
    updateSelectedCount();
    saveFilters();
}
function updateSelectedCount() {
    const selectedCount = filters.filter(f => f.checked).length;
    const countSpan = document.getElementById('selectedCount');
    if (countSpan) countSpan.textContent = `(${selectedCount}/${filters.length} 선택)`;
}
async function exportFilters() {
    const selectedFilters = filters.filter(f => f.checked);
    if (selectedFilters.length === 0) { alert('삭제할 필터를 선택해주세요.'); return; }
    if (selectedFilters.length > 1) { alert('한 번에 하나의 필터만 선택해주세요.'); return; }
    const filter = selectedFilters[0];
    const filterName = encodeURIComponent(filter.name);
    const filterId = filter.id;
    const url = `https://tmg4084.mycafe24.com/mall/admin/admin_goods_update_delete.php?bmode=market_only&amode=detail_search&search_type=filter_name&filter_code=${filterId}&ps_subject=${filterName}&ps_status=sale`;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.update(tab.id, { url: url });
    document.getElementById('marketOptions').style.display = 'block';
}
async function syncMarketCheckboxesToPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const marketStates = {};
        document.querySelectorAll('.market-checkbox[name="market"]').forEach(checkbox => {
            marketStates[checkbox.value] = checkbox.checked;
        });
        await chrome.tabs.sendMessage(tab.id, { action: "SYNC_MARKETS", states: marketStates });
    } catch (error) { console.error('동기화 오류:', error); }
}
async function toggleAllMarkets(e) {
    const checked = e.target.checked;
    document.querySelectorAll('.market-checkbox[name="market"]').forEach(checkbox => { checkbox.checked = checked; });
    await syncMarketCheckboxesToPage();
}
async function startMarketDelete() {
    const selectedMarkets = Array.from(document.querySelectorAll('.market-checkbox[name="market"]:checked')).map(cb => cb.value);
    if (selectedMarkets.length === 0) { alert('삭제할 마켓을 선택해주세요.'); return; }
    if (confirm(`선택한 ${selectedMarkets.length}개 마켓에서 상품을 삭제하시겠습니까?`)) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_DELETE" });
        alert('마켓 삭제가 시작되었습니다.');
    }
}
function clearFilters() {
    if (confirm('모든 필터 목록을 지우시겠습니까?')) {
        filters = [];
        document.getElementById('filterList').style.display = 'none';
        document.getElementById('status').textContent = '';
        saveFilters();
    }
}
function saveFilters() { chrome.storage.local.set({ filters: filters }); }
function loadSavedFilters() {
    chrome.storage.local.get(['filters'], (result) => {
        if (result.filters && result.filters.length > 0) {
            filters = result.filters;
            displayFilters();
        }
    });
}
