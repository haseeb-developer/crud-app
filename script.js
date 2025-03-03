var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});

let items = [];
let currentId = 1;

if (localStorage.getItem('crudItems')) {
    items = JSON.parse(localStorage.getItem('crudItems'));
    if (items.length > 0) {
        currentId = Math.max(...items.map(item => item.id)) + 1;
    }
}

const crudForm = document.getElementById('crud-form');
const itemNameInput = document.getElementById('itemName');
const itemDescInput = document.getElementById('itemDesc');
const itemsContainer = document.getElementById('itemsContainer');

const editModal = new bootstrap.Modal(document.getElementById('editModal'));
const editItemNameInput = document.getElementById('editItemName');
const editItemDescInput = document.getElementById('editItemDesc');
const editItemIdInput = document.getElementById('editItemId');
const saveEditBtn = document.getElementById('saveEditBtn');

const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortOrderSelect = document.getElementById('sortOrder');
const totalCountSpan = document.getElementById('totalCount');
const completedCountSpan = document.getElementById('completedCount');
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast' + Date.now();
    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function updateLocalStorage() {
    localStorage.setItem('crudItems', JSON.stringify(items));
}

function updateStats() {
    totalCountSpan.textContent = 'Total: ' + items.length;
    const completedCount = items.filter(item => item.completed).length;
    completedCountSpan.textContent = 'Completed: ' + completedCount;
}

function validateItem(name, desc, currentId = null) {
    name = name.trim();
    desc = desc.trim();
    if (name.length < 3) {
        showToast("Item name must be at least 3 characters.", "danger");
        return false;
    }
    if (desc.length > 200) {
        showToast("Description must be 200 characters or less.", "danger");
        return false;
    }
    const duplicate = items.find(item =>
        item.name.toLowerCase() === name.toLowerCase() && item.id !== currentId
    );
    if (duplicate) {
        showToast("An item with this name already exists.", "danger");
        return false;
    }
    return true;
}

function renderItems(filterText = '', filterStatus = 'all', sortOrder = 'default') {
    let sortedItems = [...items];
    if (sortOrder === 'asc') {
        sortedItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'desc') {
        sortedItems.sort((a, b) => b.name.localeCompare(a.name));
    }

    itemsContainer.innerHTML = '';
    sortedItems
        .filter(item => {
            const searchMatches = item.name.toLowerCase().includes(filterText.toLowerCase()) ||
                item.desc.toLowerCase().includes(filterText.toLowerCase());
            let statusMatches = true;
            if (filterStatus === 'completed') {
                statusMatches = item.completed === true;
            } else if (filterStatus === 'pending') {
                statusMatches = item.completed === false;
            }
            return searchMatches && statusMatches;
        })
        .forEach(item => {
            const cardWrapper = document.createElement('div');
            cardWrapper.classList.add('card-enter');
            cardWrapper.setAttribute('data-id', item.id);

            cardWrapper.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title ${item.completed ? 'completed' : ''}">
                #${item.id} - ${item.name}
              </h5>
              <p class="card-text ${item.completed ? 'completed' : ''}">
                ${item.desc}
              </p>
              <p>
                ${item.completed
                    ? '<span class="badge bg-success">Completed</span>'
                    : '<span class="badge bg-warning">Pending</span>'
                }
              </p>
              <div class="d-flex">
                <button class="btn btn-sm btn-info me-2 edit-btn">Edit</button>
                <button class="btn btn-sm btn-danger me-2 delete-btn">Delete</button>
                <button class="btn btn-sm btn-secondary complete-btn">
                  ${item.completed ? 'Undo' : 'Complete'}
                </button>
              </div>
            </div>
          </div>
        `;
            itemsContainer.appendChild(cardWrapper);
        });
    updateStats();
}

renderItems();

itemDescInput.addEventListener('input', function () {
    if (this.value.length > 200) {
        this.value = this.value.substring(0, 200);
    }
    document.getElementById('descCounter').textContent = this.value.length + '/200';
});

editItemDescInput.addEventListener('input', function () {
    if (this.value.length > 200) {
        this.value = this.value.substring(0, 200);
    }
    document.getElementById('editDescCounter').textContent = this.value.length + '/200';
});

crudForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = itemNameInput.value;
    const desc = itemDescInput.value;
    if (!validateItem(name, desc)) {
        itemNameInput.classList.add('is-invalid');
        return;
    }
    itemNameInput.classList.remove('is-invalid');

    const newItem = { id: currentId++, name: name.trim(), desc: desc.trim(), completed: false };
    items.push(newItem);
    updateLocalStorage();
    renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
    crudForm.reset();
    document.getElementById('descCounter').textContent = '0/200';
    showToast('Item added!', 'success');
});

itemsContainer.addEventListener('click', function (e) {
    const target = e.target;
    const cardWrapper = target.closest('.card-enter');
    if (!cardWrapper) return;
    const id = parseInt(cardWrapper.getAttribute('data-id'));

    if (target.classList.contains('edit-btn')) {
        const item = items.find(item => item.id === id);
        if (item) {
            editItemNameInput.value = item.name;
            editItemDescInput.value = item.desc;
            document.getElementById('editDescCounter').textContent = item.desc.length + '/200';
            editItemIdInput.value = item.id;
            editItemNameInput.classList.remove('is-invalid');
            editModal.show();
        }
    } else if (target.classList.contains('delete-btn')) {
        cardWrapper.classList.add('fade-out');
        setTimeout(() => {
            items = items.filter(item => item.id !== id);
            updateLocalStorage();
            renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
            showToast('Item deleted!', 'danger');
        }, 500);
    } else if (target.classList.contains('complete-btn')) {
        const item = items.find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            updateLocalStorage();
            renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
            showToast(item.completed ? 'Marked as complete!' : 'Marked as pending!', 'info');
        }
    }
});

saveEditBtn.addEventListener('click', function () {
    const id = parseInt(editItemIdInput.value);
    const newName = editItemNameInput.value;
    const newDesc = editItemDescInput.value;
    if (!validateItem(newName, newDesc, id)) {
        editItemNameInput.classList.add('is-invalid');
        return;
    }
    editItemNameInput.classList.remove('is-invalid');
    const item = items.find(item => item.id === id);
    if (item) {
        item.name = newName.trim();
        item.desc = newDesc.trim();
        updateLocalStorage();
        renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
        editModal.hide();
        showToast('Item updated!', 'warning');
    }
});

searchInput.addEventListener('input', function () {
    renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
});

statusFilter.addEventListener('change', function () {
    renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
});

sortOrderSelect.addEventListener('change', function () {
    renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
});

toggleDarkModeBtn.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
});

Sortable.create(itemsContainer, {
    animation: 150,
    onEnd: function () {
        let newOrder = [];
        itemsContainer.querySelectorAll('.card-enter').forEach(card => {
            const id = parseInt(card.getAttribute('data-id'));
            const item = items.find(item => item.id === id);
            if (item) newOrder.push(item);
        });
        items = newOrder;
        updateLocalStorage();
        renderItems(searchInput.value, statusFilter.value, sortOrderSelect.value);
        showToast('Items reordered!', 'secondary');
    }
});