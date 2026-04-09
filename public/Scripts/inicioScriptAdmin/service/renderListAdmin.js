import { escapeHtml } from './uiHelpersAdmin.js';
import { openAccountPasswordsModal } from '../controllers/accountPasswordsModalController.js';

export function renderAdminAccountList(accounts, listEl) {
    if (!listEl) return;
    if (!accounts.length) {
        listEl.innerHTML = "<div class='account-item'>No se encontraron cuentas.</div>";
        return;
    }
    listEl.innerHTML = accounts.map(acc => `
        <div class="account-item" data-id="${acc.id}">
            <div><b>Email:</b> ${acc.email || 'Sin correo'}</div>
            <div><b>Nombre:</b> ${acc.name || acc.nombre || 'Sin nombre'}</div>
        </div>
    `).join('');
    listEl.querySelectorAll('.account-item').forEach(item => {
        const acc = accounts.find(a => a.id === item.dataset.id);
        item.addEventListener('click', () => {
            openAccountPasswordsModal(acc); 
        });
    });
}


export function renderAdminPasswordList(passwords, listEl) {
    if (!listEl) return;


    if (!passwords || passwords.length === 0) {
        listEl.innerHTML = '<li class="empty">No se encontraron contraseñas.</li>';
        return;
    }

    listEl.innerHTML = passwords.map((p) => {
        const name = escapeHtml(p.name || p.nombre || p.title || 'Sin nombre');
        return `<li class="password-item" data-id="${p.id}" tabindex="0">${name}</li>`;
    }).join('');
}