import { fetchAccounts, fetchAccountById } from '../services/adminUserService.js';
import { renderAdminAccountList } from '../service/renderlistadmin.js';
import { showMessage } from '../service/uiHelpersAdmin.js';

function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function setupAdminSearch(elements) {
    const {
        accountSearchEl,
        accountListEl,
        selectedAccountEl,
        prevAccountBtn,
        nextAccountBtn,
        pageInfoAccount,
        onAccountSelected
    } = elements;

    let currentAccountPage = 1;
    let nextAccountPage = null;
    let totalAccounts = 0;
    let currentAccounts = [];
    let searchTimeout = null;

    // --- Búsqueda con debounce de 2s
    accountSearchEl.addEventListener('input', () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchAccounts();
        }, 2000); 
    });

    accountSearchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (searchTimeout) clearTimeout(searchTimeout);
            searchAccounts();
        }
    });

    // --- PAGINACIÓN DE CUENTAS ---
    prevAccountBtn?.addEventListener('click', () => {
        if (currentAccountPage > 1) {
            searchAccounts(currentAccountPage - 1);
        }
    });

    nextAccountBtn?.addEventListener('click', () => {
        if (nextAccountPage && nextAccountPage > currentAccountPage) {
            searchAccounts(nextAccountPage);
        }
    });

    async function searchAccounts(page = 1) {
        const loadingEl = document.getElementById('accounts-loading');
        if (loadingEl) loadingEl.style.display = 'block';
        accountListEl.innerHTML = ''; // Limpia la lista mientras carga

        const search = accountSearchEl.value.trim();
        try {
            if (search && isUUID(search)) {
                const response = await fetchAccountById(search, 1, "");
                const account = response.data?.account;
                renderAdminAccountList([account], accountListEl, onAccountSelectedInternal);
                if (account) {
                    selectedAccountEl.textContent = ` ${account.email || account.id}`;
                }
                // Actualiza paginación de cuentas (solo una cuenta)
                currentAccountPage = 1;
                nextAccountPage = null;
                totalAccounts = 1;
                if (pageInfoAccount) pageInfoAccount.textContent = `Página 1`;
                if (prevAccountBtn) prevAccountBtn.disabled = true;
                if (nextAccountBtn) nextAccountBtn.disabled = true;
            } else {
                const { data: accounts = [], total, next_page, current_page } = await fetchAccounts({ page, search });
                currentAccounts = accounts;
                renderAdminAccountList(accounts, accountListEl, onAccountSelectedInternal);

                // Actualiza paginación de cuentas
                currentAccountPage = current_page || page;
                nextAccountPage = next_page || null;
                totalAccounts = total || accounts.length;
                if (pageInfoAccount) pageInfoAccount.textContent = `Página ${currentAccountPage}`;
                if (prevAccountBtn) prevAccountBtn.disabled = currentAccountPage <= 1;
                if (nextAccountBtn) nextAccountBtn.disabled = !nextAccountPage || nextAccountPage <= currentAccountPage;
            }
            const pagination2 = document.querySelector('.pagination2');
            if (pagination2) {
                if (currentAccounts.length > 0) {
                    pagination2.style.display = 'flex'; // o 'block', según tu CSS
                } else {
                    pagination2.style.display = 'none';
                }
            }

        } catch (err) {
            showMessage("Error al buscar cuentas: " + err.message);
            renderAdminAccountList([], accountListEl, onAccountSelectedInternal);
            const pagination2 = document.querySelector('.pagination2');
            if (pagination2) pagination2.style.display = 'none';
            if (pageInfoAccount) pageInfoAccount.textContent = '';
            if (prevAccountBtn) prevAccountBtn.disabled = true;
            if (nextAccountBtn) nextAccountBtn.disabled = true;
        } finally {
            const loadingEl = document.getElementById('accounts-loading');
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    async function onAccountSelectedInternal(account) {
        if (typeof onAccountSelected === "function") onAccountSelected(account.id);
        selectedAccountEl.textContent = ` ${account.email || account.id}`;
    }

    // Inicializa
    await searchAccounts();
}