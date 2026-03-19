import { fetchAccountById } from '../services/adminUserService.js';
import { showMessage } from '../service/uiHelpersAdmin.js';
import { renderAdminPasswordList } from '../service/renderlistadmin.js';
import { setupAdminModals, openAdminPasswordModal } from './modalControllerAdmin.js';
import { deleteAccount } from '../services/adminUserService.js';
import { showDeleteConfirmModal } from '../service/uiHelpersAdmin.js';

export async function openAccountPasswordsModal(account) {
    const modal = document.getElementById('accountPasswordsModal');
    const emailTitle = document.getElementById('accountEmailTitle');
    const passwordList = document.getElementById('password-list');
    const backBtn = document.getElementById('backToAccountsBtn');
    const menuBtn = document.getElementById('accountMenuBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const addBtn = document.getElementById('addPasswordBtn');
    const createModal = document.getElementById('createModal');
    const viewModal = document.getElementById('viewModal');
    const createName = document.getElementById('createName');
    const createPassword = document.getElementById('createPassword');
    const createDescription = document.getElementById('createDescription');
    const confirmPassword = document.getElementById('confirmPassword');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const passwordSearchEl = document.getElementById('search2');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const pageInfo = document.getElementById('pageinfo');
    const loadingEl = document.getElementById('passwords-loading');

    emailTitle.textContent = account.email || account.name || account.id;

    let currentPage = 1;
    let nextPage = null;
    let totalPasswords = 0;

    async function loadPasswordsPage(page = 1, search = '') {
        if (loadingEl) loadingEl.style.display = 'block';
        passwordList.innerHTML = '';

        try {
            const response = await fetchAccountById(account.id, page, search);
            const passwords = response.data?.passwords || [];
            currentPage = response.current_page || page;
            nextPage = response.next_page || null;
            totalPasswords = response.total || passwords.length;

            renderAdminPasswordList(passwords, passwordList);

            // Evento para ver contraseña
            passwordList.querySelectorAll('.password-item').forEach(item => {
                const passwordId = item.dataset.id;
                item.onclick = () => openAdminPasswordModal(account.id, passwordId);
            });

            if (pageInfo) pageInfo.textContent = `Página ${currentPage}`;
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = !nextPage || nextPage <= currentPage;
        } catch (err) {
            passwordList.innerHTML = '<div >Error al cargar contraseñas</div>';
            if (pageInfo) pageInfo.textContent = '';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
            const searchbar2 = document.getElementById('search2');
            const pagination1 = document.querySelector('.pagination');

            if (pagination1 && passwordList.children.length > 0 && !passwordList.innerHTML.includes('Error')) {
                pagination1.style.display = 'flex';
            } else if (pagination1) {
                pagination1.style.display = 'none';
            }

            if (searchbar2 && passwordList.children.length > 0 && !passwordList.innerHTML.includes('Error')) {
                searchbar2.style.display = 'block';
            } else if (searchbar2) {
                searchbar2.style.display = 'none';
            }
        }
    }

    // --- Listener único para passwordUpdated ---
    function passwordUpdatedHandler(e) {
        const { accountId } = e.detail || {};
        if (accountId === account.id) {
            loadPasswordsPage(currentPage, passwordSearchEl ? passwordSearchEl.value : '');
        }
    }
    document.addEventListener('passwordUpdated', passwordUpdatedHandler);

    let passwordSearchTimeout = null;

    // Listeners de paginación y búsqueda
    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPasswordsPage(currentPage - 1, passwordSearchEl.value);
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (nextPage && nextPage > currentPage) {
            loadPasswordsPage(nextPage, passwordSearchEl.value);
        }
    });

    passwordSearchEl?.addEventListener('input', () => {
        if (passwordSearchTimeout) clearTimeout(passwordSearchTimeout);
        passwordSearchTimeout = setTimeout(() => {
            loadPasswordsPage(1, passwordSearchEl.value);
        }, 2000);
    });

    passwordSearchEl?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            if (passwordSearchTimeout) clearTimeout(passwordSearchTimeout);
            loadPasswordsPage(1, passwordSearchEl.value);
        }
    });

    // Inicializa la lista
    loadPasswordsPage();

    // Mostrar modal
    modal.classList.add('show');

    // Botón regresar
    backBtn.onclick = () => {
        modal.classList.remove('show');
        const searchbar2 = document.getElementById('search2');
        if (searchbar2){
            searchbar2.style.display = 'none';
            searchbar2.value = '';
        }
        const pagination1 = document.querySelector('.pagination');
        if (pagination1) pagination1.style.display = 'none';
        // Remueve el listener al cerrar el modal
        document.removeEventListener('passwordUpdated', passwordUpdatedHandler);
    };

    // Menú tres puntos
    menuBtn.onclick = () => {
        menuBtn.parentElement.classList.toggle('open');
    };

    // Eliminar cuenta
    deleteBtn.onclick = async () => {
        showDeleteConfirmModal({
            title: "Eliminar cuenta",
            message: "¿Seguro que deseas eliminar esta cuenta? Esta acción no se puede deshacer.<br>Escribe <b>eliminar</b> para confirmar.",
            onConfirm: async () => {
                try {
                    await deleteAccount(account.id);
                    showMessage("Cuenta eliminada correctamente");
                    // Recarga la página inmediatamente
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } catch (err) {
                    showMessage("Error al eliminar la cuenta: " + err.message);
                }
            },
            onCancel: () => {
                // Acción al cancelar, si es necesario
            }
        });
    };

    // Cierre del modal de ver contraseña también actualiza la lista
    const closeBtns = viewModal.querySelectorAll('.close-btn');
    closeBtns.forEach(btn => {
        btn.onclick = () => {
            viewModal.classList.remove('show');
            document.dispatchEvent(new CustomEvent('passwordUpdated', { detail: { accountId: account.id } }));
        };
    });

    // --- Lógica para crear contraseña dentro del modal ---
    setupAdminModals({
        addBtn,
        createModal,
        viewModal,
        fields: {
            createName,
            createPassword,
            createDescription,
            confirmPassword,
            savePasswordBtn
        },
        listEl: passwordList,
        renderList: () => loadPasswordsPage(currentPage, passwordSearchEl.value),
        getSelectedAccountId: () => account.id
    });
}