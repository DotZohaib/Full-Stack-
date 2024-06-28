import axios from 'axios';
import showAlert from './alerts';

// Update date
export const updateUserData = async (data, type) => {
    try {
        const url = type === 'password' ? 'updatePassword' : 'updateMe';

        const res = await axios({
            method: 'patch',
            url: `http://localhost:3000/api/v1/users/${url}`,
            data
        });

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
        }
    } catch (e) {
        showAlert('error', e.response.data.message);
    }
};
