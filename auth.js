document.addEventListener('DOMContentLoaded', () => {
    // Referencias a las secciones
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    // Referencias a los enlaces para cambiar de vista
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    // Formularios
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerSubmitBtn = document.getElementById('register-btn');

    // Campos del formulario de registro
    const regNameInput = document.getElementById('register-name');
    const regEmailInput = document.getElementById('register-email');
    const regPassInput = document.getElementById('register-password');

    // Alternar entre Login y Registro
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden-form');
        registerSection.classList.remove('hidden-form');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden-form');
        loginSection.classList.remove('hidden-form');
    });

    // Validaciones Expresiones Regulares
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Mínimo 8 caracteres, 1 mayúscula, 1 número
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    // Función para mostrar/ocultar errores
    function toggleError(inputElement, isValid) {
        const errorSpan = document.getElementById(`${inputElement.id}-error`);
        if (isValid) {
            inputElement.classList.remove('input-error');
            inputElement.classList.add('input-success');
            if (errorSpan) errorSpan.classList.remove('show');
        } else {
            inputElement.classList.remove('input-success');
            inputElement.classList.add('input-error');
            if (errorSpan) errorSpan.classList.add('show');
        }
    }

    // Validar el formulario de registro y habilitar/deshabilitar el botón
    function validateRegisterForm() {
        let isValidName = regNameInput.value.trim().length > 0;
        let isValidEmail = emailRegex.test(regEmailInput.value.trim());
        let isValidPass = passwordRegex.test(regPassInput.value);

        // Habilitar si todos son válidos
        if (isValidName && isValidEmail && isValidPass) {
            registerSubmitBtn.disabled = false;
        } else {
            registerSubmitBtn.disabled = true;
        }
    }

    // Event Listeners para validación en tiempo real en Registro
    regNameInput.addEventListener('input', () => {
        let isValid = regNameInput.value.trim().length > 0;
        toggleError(regNameInput, isValid);
        validateRegisterForm();
    });

    regEmailInput.addEventListener('input', () => {
        let isValid = emailRegex.test(regEmailInput.value.trim());
        toggleError(regEmailInput, isValid);
        validateRegisterForm();
    });

    regPassInput.addEventListener('input', () => {
        let isValid = passwordRegex.test(regPassInput.value);
        toggleError(regPassInput, isValid);
        validateRegisterForm();
    });

    // Envío del formulario de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!registerSubmitBtn.disabled) {
            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: regNameInput.value.trim(),
                        correo: regEmailInput.value.trim(),
                        password: regPassInput.value
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert('¡Registro exitoso! Bienvenido a Out Silver.');
                    registerForm.reset();
                    // Limpiar estilos de validación
                    [regNameInput, regEmailInput, regPassInput].forEach(el => {
                        el.classList.remove('input-success');
                        el.classList.remove('input-error');
                    });
                    registerSubmitBtn.disabled = true;
                } else {
                    alert('Error en el registro: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo conectar con el servidor.');
            }
        }
    });

    // Validaciones simples para Login al hacer submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        
        let valid = true;

        if (!emailRegex.test(emailInput.value.trim())) {
            toggleError(emailInput, false);
            valid = false;
        } else {
            toggleError(emailInput, true);
        }

        if (passInput.value.trim().length === 0) {
            toggleError(passInput, false);
            valid = false;
        } else {
            toggleError(passInput, true);
        }

        if (valid) {
            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        correo: emailInput.value.trim(),
                        password: passInput.value
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert('¡Inicio de sesión exitoso!');
                    window.location.href = 'index.html'; // Redirigir al inicio
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo conectar con el servidor.');
            }
        }
    });
});
