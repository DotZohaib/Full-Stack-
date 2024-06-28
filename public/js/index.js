/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import displayMap from './mapbox';
import { updateUserData } from './updateUserData';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserInfoForm = document.querySelector('.form-user-data');
const updateUserPasswordForm = document.querySelector('.form-user-password');

// MAP BOX
if (mapBox) {
    const locations = JSON.parse(
        document.getElementById('map').dataset.locations
    );
    displayMap(locations);
}

// LOGIN FORM
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        //console.log(email.value, password.value);
        login(email.value, password.value);
    });
}

// LOGOUT
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// UPDATE USER INFO
if (updateUserInfoForm) {
    updateUserInfoForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        updateUserData({ name, email }, 'data');
    });
}

if (updateUserPasswordForm) {
    updateUserPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent =
            'Updating...';
        const password = document.getElementById('password-current').value;
        const newPassword = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm')
            .value;
        await updateUserData(
            { password, newPassword, passwordConfirm },
            'password'
        );
        document.querySelector('.btn--save-password').textContent =
            'Save Password';

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}
