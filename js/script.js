document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('exitInterviewForm');
    const canvas = document.getElementById('signaturePad');
    const clearBtn = document.getElementById('clearSignature');
    const firmaInput = document.getElementById('firmaInput');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const successMessage = document.getElementById('successMessage');

    // Elementos del Token Maestro
    const masterTokenOverlay = document.getElementById('masterTokenOverlay');
    const masterTokenInput = document.getElementById('masterTokenInput');
    const authorizeBtn = document.getElementById('authorizeBtn');
    const tokenError = document.getElementById('tokenError');
    const MASTER_KEY = '0112358132172';

    // Verificar autorización previa
    const isAuthorized = localStorage.getItem('hsda_authorized');
    if (isAuthorized === 'true') {
        masterTokenOverlay.classList.add('hidden');
    }

    // Lógica de Autorización
    authorizeBtn.addEventListener('click', () => {
        if (masterTokenInput.value === MASTER_KEY) {
            localStorage.setItem('hsda_authorized', 'true');
            masterTokenOverlay.classList.add('hidden');
        } else {
            tokenError.classList.remove('hidden');
            masterTokenInput.value = '';
            masterTokenInput.focus();
        }
    });

    // Permitir Enter para autorizar
    masterTokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authorizeBtn.click();
    });

    
    // Configuración del Signature Pad
    const ctx = canvas.getContext('2d');
    let drawing = false;

    // Ajustar tamaño del canvas para resolución de tablet
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#3b82f6'; // Color azul de la guía de diseño
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDrawing(e) {
        drawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }

    function draw(e) {
        if (!drawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        e.preventDefault();
    }

    function stopDrawing() {
        drawing = false;
        // Comprimir la firma a un tamaño estándar antes de convertir a Base64
        // Esto evita que el string sea demasiado largo y se trunque al enviarse
        const offscreen = document.createElement('canvas');
        offscreen.width = 400;
        offscreen.height = 120;
        const offCtx = offscreen.getContext('2d');
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
        offCtx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
        // Calidad 0.7 = imagen más pequeña sin perder legibilidad de la firma
        firmaInput.value = offscreen.toDataURL('image/jpeg', 0.7);
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        firmaInput.value = '';
    });

    // Envío del Formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!firmaInput.value || firmaInput.value === '') {
            alert('Por favor firma la entrevista antes de enviar.');
            return;
        }

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Mostrar estado de carga
        form.classList.add('hidden');
        statusMessage.classList.remove('hidden');

        // URL del Web App de Google Apps Script
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyh-xPtCVGgGICJvmeJkW6IJBjQ7JaZAr1a-sYuyRwQwTIjJ-VrTWsj8SXHM5EB9KBH/exec';

        try {
            // Enviamos con URLSearchParams (método probado que funciona con GAS)
            const params = new URLSearchParams();
            for (const key in data) {
                params.append(key, data[key]);
            }

            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: params
            });

            console.log('Petición enviada correctamente');
            
            statusMessage.classList.add('hidden');
            successMessage.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            form.reset();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        } catch (error) {
            console.error('Error de red o de fetch:', error);
            alert('Error de conexión: No se pudo contactar con el servidor. Verifica tu conexión a internet.');
            statusMessage.classList.add('hidden');
            form.classList.remove('hidden');
        }
    });
});
