// popup.js - 더망고 필터 수집 익스텐션 (자동 이동 및 자동 수집 버전)

let filters = [];
const TARGET_FILTER_URL = "https://tmg4084.mycafe24.com/mall/admin/shop/getGoodsCategory.php?pmode=filter_delete&uids=&pg=1&site_id=&sch_keyword=&ft_num=10&ft_show=&ft_sort=register_asc";

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
        statusDiv.textContent = '🔄 페이지 확인 중...';
        statusDiv.className = 'status loading';
        collectBtn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('tmg4084.mycafe24.com')) {
            throw new Error('더망고 페이지에서 실행해주세요.');
        }

        // URL이 다르면 이동 후 자동 수집 프로세스 시작
        if (!tab.url.includes('ft_num=10') || !tab.url.includes('pmode=filter_delete')) {
            statusDiv.textContent = '🔄 수집 페이지로 이동 중... (자동 수집)';
            
            // 탭 업데이트
            await chrome.tabs.update(tab.id, { url: TARGET_FILTER_URL });

            // 페이지 로딩 완료 감지 리스너
            const listener = (tabId, changeInfo) => {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    statusDiv.textContent = '🔄 로딩 완료! 데이터 추출 중...';
                    
                    // 컨텐츠 스크립트가 로드될 시간을 잠시 준 뒤 수집 실행
                    setTimeout(() => collectFilters(), 1500);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            return;
        }

        // 이미 해당 페이지라면 즉시 수집
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
        const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_MANGO_DATA_FROM_DOM" });

        if (response && response.data && response.data.length > 0) {
            filters = response.data;
            statusDiv.textContent = `✅ ${filters.length}개의 필터를 수집했습니다.`;
            statusDiv.className = 'status success';
            displayFilters();
            saveFilters();
        } else {
            throw new Error('데이터를 추출하지 못했습니다. 화면을 확인하세요.');
        }
    } catch (error) {
        statusDiv.textContent = `❌ ${error.message}`;
        statusDiv.className = 'status error';
    } finally {
        collectBtn.disabled = false;
    }
}

function displayFilters() {
    const filterList = document.getElementById('filterList');
    const filterItems = document.getElementById('filterItems');
    if (!filterList || !filterItems) return;
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
    const url = `https://tmg4084.mycafe24.com/mall/admin/admin_goods_update_delete.php?bmode=market_only&amode=detail_search&search_type=filter_name&filter_code=${filter.id}&ps_subject=${encodeURIComponent(filter.name)}&ps_status=sale`;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.update(tab.id, { url: url });
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
    }
}

function clearFilters() {
    if (confirm('모든 필터 목록을 지우시겠습니까?')) {
        filters = [];
        const filterList = document.getElementById('filterList');
        if (filterList) filterList.style.display = 'none';
        const status = document.getElementById('status');
        if (status) status.textContent = '';
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
