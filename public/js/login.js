/* eslint-disable */
import axios from 'axios';
import showAlert from './alerts';

// export default object = export object
export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'post',
            url: 'http://localhost:3000/api/v1/users/login', //-> CAN NOT work with 127.0.0.1:3000
            data: {
                email,
                password
            }
        });
        //console.log(res);

        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (e) {
        showAlert('error', e.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'get',
            url: 'http://localhost:3000/api/v1/users/logout'
        });
        if (res.data.status === 'success') {
            location.reload(true); // reload page coming from server
        }
    } catch (e) {
        showAlert('error', 'Error logging out! Try again!');
    }
};
