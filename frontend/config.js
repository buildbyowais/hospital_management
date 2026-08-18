const BACKEND_URL = window.location.hostname.includes('localhost')
    ? 'http://127.0.0.1:8000'                       // Local Backend
    : 'https://your-app-name.onrender.com';         // Render Backend URL (Yahan apna Render URL daalo)

// 3. Global variable assign karo taake sab JS files use kar sakein
window.API_BASE_URL = BACKEND_URL;

// 4. Debug ke liye console mein print karo (Optional)
console.log("✅ Using Backend URL:", window.API_BASE_URL);