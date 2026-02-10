// Constants
const audio = new Audio('fireentity.mp3');

// Settings
audio.loop = true;
audio.muted = true;

// Play
audio.play().then(() => {
    console.log("Looping started silently.");
}).catch(error => {
    console.log("Autoplay blocked even with mute.");
});

// Ensure Play
window.addEventListener('click', () => {
    audio.muted = false;
}, { once: true });
