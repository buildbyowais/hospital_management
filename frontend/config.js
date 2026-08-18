const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

const BACKEND_URL = (isLocal || window.location.protocol === 'file:')
    ? 'http://127.0.0.1:8000' 
    : 'https://hospital-management-lmfv.onrender.com';

window.API_BASE_URL = BACKEND_URL;