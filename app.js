document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // VARIABLES DE ESTADO
    // ==========================================================================
    let cartItems = [];
    
    // Elementos del DOM
    const cartCountBadge = document.getElementById('cart-count-badge');
    const searchInput = document.getElementById('search-product-input');
    const sortSelect = document.getElementById('product-sort-select');
    const cardsGrid = document.getElementById('main-product-cards-grid');
    const emptyState = document.getElementById('products-empty-state');
    const toastHub = document.getElementById('toast-notification-hub');
    const resetFiltersBtn = document.getElementById('btn-reset-filters');
    
    // Colección de todas las tarjetas de productos
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    
    // Elementos de los Filtros
    const categoryLinks = document.querySelectorAll('.nav-dropdown-menu .nav-dropdown-item');
    const typeCheckboxes = document.querySelectorAll('#filter-device-type input[type="checkbox"]');
    const priceRadios = document.querySelectorAll('#filter-price input[type="radio"]');
    const ratingRadios = document.querySelectorAll('#filter-review input[type="radio"]');
    const finishCheckboxes = document.querySelectorAll('#filter-finish input[type="checkbox"]');
    const materialCheckboxes = document.querySelectorAll('#filter-material input[type="checkbox"]');
    const offerCheckboxes = document.querySelectorAll('#filter-offer input[type="checkbox"]');
    
    // Objeto del estado activo de los filtros
    const activeFilters = {
        category: 'all',
        searchQuery: '',
        types: [],
        priceRange: 'all',
        minRating: 0,
        finishes: [],
        materials: [],
        offers: []
    };

    // ==========================================================================
    // OPERACIONES DEL CARRITO Y LISTA DE DESEOS
    // ==========================================================================
    
    // Configurar controladores de click para añadir al carrito
    productCards.forEach(card => {
        // Configurar controlador para favoritos (corazón)
        const favBtn = card.querySelector('.favorite-toggle-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            favBtn.classList.toggle('liked');
            
            const isLiked = favBtn.classList.contains('liked');
            if (isLiked) {
                showToast(`¡"${title}" añadido a la lista de deseos! ❤️`);
                // Animación de pulso
                const heart = favBtn.querySelector('.heart-icon');
                heart.style.transform = 'scale(1.3)';
                setTimeout(() => heart.style.transform = '', 200);
            } else {
                showToast(`"${title}" eliminado de la lista de deseos.`);
            }
        });
    });

    // Añadir al carrito
    function addToCart(title, price, qty, img, size = 'Única') {
        const existingItem = cartItems.find(item => item.title === title && item.size === size);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cartItems.push({ title, price, qty, img, size, id: Date.now() });
        }
        updateCartBadge();
        renderCart();
    }

    // Actualizar el número del carrito con animación
    function updateCartBadge() {
        const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);
        cartCountBadge.textContent = totalQty;
        cartCountBadge.classList.add('bump');
        setTimeout(() => {
            cartCountBadge.classList.remove('bump');
        }, 300);
    }

    // Creador de notificaciones flotantes (Toasts)
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span class="toast-success-icon">✓</span>
            <span class="toast-message">${message}</span>
        `;
        toastHub.appendChild(toast);
        
        // Eliminar notificación después de terminar animación
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // ==========================================================================
    // LÓGICA DE FILTRADO COMBINADO
    // ==========================================================================

    // Inicializar todos los controladores de eventos para los filtros
    function initFilterListeners() {
        // Búsqueda en tiempo real
        searchInput.addEventListener('input', (e) => {
            activeFilters.searchQuery = e.target.value.toLowerCase().trim();
            applyFilters();
        });

        // Enlaces del menú de categorías
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedCat = link.getAttribute('data-category');
                activeFilters.category = selectedCat;
                
                // Resaltar estilo del enlace de categoría activo
                categoryLinks.forEach(l => l.style.fontWeight = '500');
                link.style.fontWeight = '700';
                
                applyFilters();
            });
        });

        // Checkboxes de tipo de dispositivo
        typeCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateCheckboxFilter('types', typeCheckboxes);
                toggleFilterBtnActive('filter-device-type', activeFilters.types.length > 0);
                applyFilters();
            });
        });

        // Radios de precio
        priceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                activeFilters.priceRange = radio.value;
                toggleFilterBtnActive('filter-price', radio.value !== 'all');
                applyFilters();
            });
        });

        // Radios de valoración (estrellas)
        ratingRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                activeFilters.minRating = parseFloat(radio.value);
                toggleFilterBtnActive('filter-review', parseFloat(radio.value) > 0);
                applyFilters();
            });
        });

        // Checkboxes de acabados
        finishCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateCheckboxFilter('finishes', finishCheckboxes);
                toggleFilterBtnActive('filter-finish', activeFilters.finishes.length > 0);
                applyFilters();
            });
        });

        // Checkboxes de materiales
        materialCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateCheckboxFilter('materials', materialCheckboxes);
                toggleFilterBtnActive('filter-material', activeFilters.materials.length > 0);
                applyFilters();
            });
        });

        // Checkboxes de ofertas
        offerCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateCheckboxFilter('offers', offerCheckboxes);
                toggleFilterBtnActive('filter-offer', activeFilters.offers.length > 0);
                applyFilters();
            });
        });

        // Botón de restablecer filtros en estado vacío
        resetFiltersBtn.addEventListener('click', resetAllFilters);
    }

    // Auxiliar: Almacena los valores de checkboxes seleccionados
    function updateCheckboxFilter(stateKey, checkboxes) {
        activeFilters[stateKey] = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    // Auxiliar: Resalta el botón si tiene criterios de filtrado activos
    function toggleFilterBtnActive(btnId, isActive) {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }

    // Combinación de filtros y alternancia de visibilidad de tarjetas
    function applyFilters() {
        let visibleCount = 0;

        productCards.forEach(card => {
            const price = parseFloat(card.getAttribute('data-price'));
            const rating = parseFloat(card.getAttribute('data-rating'));
            const category = card.getAttribute('data-category');
            const type = card.getAttribute('data-type');
            const finish = card.getAttribute('data-finish');
            const material = card.getAttribute('data-material');
            const offer = card.getAttribute('data-offer');
            
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const subtext = card.querySelector('.product-subtext').textContent.toLowerCase();

            // Filtrado por categoría
            const matchesCategory = activeFilters.category === 'all' || category === activeFilters.category;

            // Filtrado por búsqueda en caja de texto
            const matchesSearch = activeFilters.searchQuery === '' || 
                                  title.includes(activeFilters.searchQuery) || 
                                  subtext.includes(activeFilters.searchQuery);

            // Filtrado por tipo de dispositivo
            const matchesType = activeFilters.types.length === 0 || activeFilters.types.includes(type);

            // Filtrado por rango de precios
            let matchesPrice = true;
            if (activeFilters.priceRange === 'under-150') {
                matchesPrice = price < 150;
            } else if (activeFilters.priceRange === '150-300') {
                matchesPrice = price >= 150 && price <= 300;
            } else if (activeFilters.priceRange === 'over-300') {
                matchesPrice = price > 300;
            }

            // Filtrado por valoración estrellas
            const matchesRating = rating >= activeFilters.minRating;

            // Filtrado por acabados
            const matchesFinish = activeFilters.finishes.length === 0 || activeFilters.finishes.includes(finish);

            // Filtrado por materiales
            const matchesMaterial = activeFilters.materials.length === 0 || activeFilters.materials.includes(material);

            // Filtrado por ofertas
            const matchesOffer = activeFilters.offers.length === 0 || activeFilters.offers.includes(offer);

            // Intersección de todas las condiciones de filtrado
            const isVisible = matchesCategory && matchesSearch && matchesType && matchesPrice && 
                              matchesRating && matchesFinish && matchesMaterial && matchesOffer;

            if (isVisible) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        // Mostrar estado vacío si no hay coincidencias
        if (visibleCount === 0) {
            cardsGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            cardsGrid.classList.remove('hidden');
            emptyState.classList.add('hidden');
        }
    }

    // Restablece todas las opciones a los valores por defecto
    function resetAllFilters() {
        // Limpiar búsqueda
        searchInput.value = '';
        activeFilters.searchQuery = '';

        // Restablecer categorías del menú
        activeFilters.category = 'all';
        categoryLinks.forEach(l => l.style.fontWeight = '500');

        // Desmarcar checkboxes de tipo
        typeCheckboxes.forEach(cb => cb.checked = false);
        activeFilters.types = [];
        toggleFilterBtnActive('filter-device-type', false);

        // Restablecer radios de precio a 'todos'
        priceRadios.forEach(radio => {
            radio.checked = radio.value === 'all';
        });
        activeFilters.priceRange = 'all';
        toggleFilterBtnActive('filter-price', false);

        // Restablecer radios de estrellas a 'cualquiera'
        ratingRadios.forEach(radio => {
            radio.checked = radio.value === '0';
        });
        activeFilters.minRating = 0;
        toggleFilterBtnActive('filter-review', false);

        // Desmarcar checkboxes de acabados
        finishCheckboxes.forEach(cb => cb.checked = false);
        activeFilters.finishes = [];
        toggleFilterBtnActive('filter-finish', false);

        // Desmarcar checkboxes de materiales
        materialCheckboxes.forEach(cb => cb.checked = false);
        activeFilters.materials = [];
        toggleFilterBtnActive('filter-material', false);

        // Desmarcar checkboxes de ofertas
        offerCheckboxes.forEach(cb => cb.checked = false);
        activeFilters.offers = [];
        toggleFilterBtnActive('filter-offer', false);

        // Aplicar estado limpio
        applyFilters();
        showToast('Todos los filtros han sido restablecidos.');
    }

    // ==========================================================================
    // OPERACIONES DE ORDENACIÓN (SORT)
    // ==========================================================================
    
    function initSorting() {
        sortSelect.addEventListener('change', (e) => {
            const criteria = e.target.value;
            sortGridItems(criteria);
        });
    }

    // Reordenar elementos de la cuadrícula en el DOM
    function sortGridItems(criteria) {
        if (criteria === 'default') {
            // Ordenar por ID original
            productCards.sort((a, b) => {
                const idA = parseInt(a.id.replace('card-', ''));
                const idB = parseInt(b.id.replace('card-', ''));
                return idA - idB;
            });
        } else if (criteria === 'price-asc') {
            // Precio de menor a mayor
            productCards.sort((a, b) => {
                return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
            });
        } else if (criteria === 'price-desc') {
            // Precio de mayor a menor
            productCards.sort((a, b) => {
                return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
            });
        } else if (criteria === 'rating-desc') {
            // Valoraciones de clientes descendente
            productCards.sort((a, b) => {
                return parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating'));
            });
        }

        // Volver a añadir las tarjetas ordenadas al DOM
        productCards.forEach(card => {
            cardsGrid.appendChild(card);
        });

        // Micro-animación en la cuadrícula al reordenarse
        cardsGrid.style.opacity = '0.3';
        cardsGrid.style.transform = 'translateY(5px)';
        setTimeout(() => {
            cardsGrid.style.opacity = '1';
            cardsGrid.style.transform = '';
        }, 150);

        showToast('Productos reordenados.');
    }

    // ==========================================================================
    // MODAL DE DETALLES DEL PRODUCTO
    // ==========================================================================
    const productModal = document.getElementById('product-detail-modal');
    const closeProductModalBtn = document.getElementById('close-modal-btn');
    
    const modalImageContainer = document.getElementById('modal-image-container');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');
    const modalFinancing = document.getElementById('modal-financing');
    const modalRatingContainer = document.getElementById('modal-rating-container');
    const modalCategory = document.getElementById('modal-breadcrumb-category');
    const modalProductTitle = document.getElementById('modal-breadcrumb-title');
    const modalStock = document.getElementById('modal-stock');
    
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyValue = document.getElementById('qty-value');
    let currentQty = 1;
    
    productCards.forEach(card => {
        card.style.cursor = 'pointer'; // Indicador visual
        card.addEventListener('click', (e) => {
            // Evitar abrir modal si se hace clic en botones de acción rápida como favoritos
            if (e.target.closest('.favorite-toggle-btn')) {
                return;
            }
            
            const title = card.querySelector('.product-title').textContent;
            const price = parseFloat(card.getAttribute('data-price'));
            const desc = card.querySelector('.product-subtext').textContent;
            const category = card.getAttribute('data-category');
            const ratingHtml = card.querySelector('.stars-container').innerHTML;
            const reviewCount = card.querySelector('.review-count').textContent;
            const svgArt = card.querySelector('.vector-art-container').innerHTML;
            
            modalTitle.textContent = title;
            modalProductTitle.textContent = title;
            modalCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            modalDesc.textContent = desc;
            modalPrice.textContent = `S/ ${price.toFixed(2)}`;
            if(modalFinancing) modalFinancing.style.display = 'none';
            modalImageContainer.innerHTML = svgArt;
            
            modalRatingContainer.innerHTML = `<div class="stars-container" style="display:flex;">${ratingHtml}</div> <span class="modal-review-count">${reviewCount}</span>`;
            
            const randomStock = Math.floor(Math.random() * 15) + 2;
            modalStock.textContent = `${randomStock} unidades`;
            
            currentQty = 1;
            qtyValue.textContent = currentQty;
            
            productModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    });
    
    const closeModal = () => {
        productModal.classList.add('hidden');
        document.body.style.overflow = '';
    };
    
    closeProductModalBtn.addEventListener('click', closeModal);
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        // Manejado abajo para soportar ambos modales
    });
    
    qtyMinus.addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            qtyValue.textContent = currentQty;
        }
    });
    
    qtyPlus.addEventListener('click', () => {
        currentQty++;
        qtyValue.textContent = currentQty;
    });
    
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Size buttons
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Size Guide Modal
    const sizeGuideModal = document.getElementById('size-guide-modal');
    const openSizeGuideBtn = document.getElementById('open-size-guide');
    const closeSizeGuideBtn = document.getElementById('close-size-guide-btn');
    
    const closeSizeGuide = () => {
        sizeGuideModal.classList.add('hidden');
    };
    
    openSizeGuideBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sizeGuideModal.classList.remove('hidden');
    });
    
    closeSizeGuideBtn.addEventListener('click', closeSizeGuide);
    sizeGuideModal.addEventListener('click', (e) => {
        if (e.target === sizeGuideModal) closeSizeGuide();
    });
    
    // Integrar Escape para modal de medidas
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!sizeGuideModal.classList.contains('hidden')) {
                closeSizeGuide();
            } else if (!productModal.classList.contains('hidden')) {
                closeModal();
            }
        }
    });
    
    document.getElementById('modal-add-cart').addEventListener('click', () => {
        const title = modalTitle.textContent;
        const price = parseFloat(modalPrice.textContent.replace('S/', '').trim());
        const svgArt = modalImageContainer.innerHTML;
        const activeSizeBtn = document.querySelector('.size-btn.active');
        const size = activeSizeBtn ? activeSizeBtn.textContent : 'Única';
        
        addToCart(title, price, currentQty, svgArt, size);
        showToast(`¡${currentQty}x "${title}" (Talla ${size}) añadido al carrito!`);
        closeModal();
    });
    
    document.getElementById('modal-buy-now').addEventListener('click', () => {
        const title = modalTitle.textContent;
        const price = parseFloat(modalPrice.textContent.replace('S/', '').trim());
        const svgArt = modalImageContainer.innerHTML;
        const activeSizeBtn = document.querySelector('.size-btn.active');
        const size = activeSizeBtn ? activeSizeBtn.textContent : 'Única';
        
        addToCart(title, price, currentQty, svgArt, size);
        closeModal();
        cartDrawer.classList.remove('hidden');
    });

    // ==========================================================================
    // LOGICA DEL CARRITO LATERAL (DRAWER)
    // ==========================================================================
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartSubtotalPrice = document.getElementById('cart-subtotal-price');
    const cartDrawerCount = document.getElementById('cart-drawer-count');
    
    // Icono del carrito en la barra superior
    const headerCartBtn = document.getElementById('cart-btn');
    if (headerCartBtn) {
        headerCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderCart();
            cartDrawer.classList.remove('hidden');
        });
    }
    
    closeCartBtn.addEventListener('click', () => cartDrawer.classList.add('hidden'));
    
    cartDrawer.addEventListener('click', (e) => {
        if (e.target === cartDrawer) cartDrawer.classList.add('hidden');
    });
    
    // Extender Escape para cerrar el carrito
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!cartDrawer.classList.contains('hidden')) {
                cartDrawer.classList.add('hidden');
            }
        }
    });
    
    function renderCart() {
        if (cartItems.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart-msg">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <p>Tu carrito está vacío</p>
                    <button class="btn btn-primary" onclick="document.getElementById('cart-drawer').classList.add('hidden')" style="margin-top: 15px;">Seguir Comprando</button>
                </div>
            `;
            cartSubtotalPrice.textContent = 'S/ 0.00';
            cartDrawerCount.textContent = '0';
            return;
        }
        
        let subtotal = 0;
        let totalItems = 0;
        cartItemsList.innerHTML = '';
        
        cartItems.forEach((item, index) => {
            subtotal += item.price * item.qty;
            totalItems += item.qty;
            
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <div class="cart-item-img">${item.img}</div>
                <div class="cart-item-details">
                    <div class="cart-item-title">
                        <span>${item.title}</span>
                        <button class="cart-item-remove" data-index="${index}">&times;</button>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 5px;">Talla: <strong style="color: var(--color-text-main);">${item.size}</strong></div>
                    <div class="cart-item-price">S/ ${item.price.toFixed(2)}</div>
                    <div class="cart-qty-controls">
                        <button class="cart-qty-btn decrease-qty" data-index="${index}">&minus;</button>
                        <span class="cart-qty-val">${item.qty}</span>
                        <button class="cart-qty-btn increase-qty" data-index="${index}">&plus;</button>
                    </div>
                </div>
            `;
            cartItemsList.appendChild(cartItemEl);
        });
        
        cartSubtotalPrice.textContent = `S/ ${subtotal.toFixed(2)}`;
        cartDrawerCount.textContent = totalItems;
        
        // Listeners for remove and qty
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cartItems.splice(idx, 1);
                updateCartBadge();
                renderCart();
            });
        });
        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                if (cartItems[idx].qty > 1) {
                    cartItems[idx].qty--;
                } else {
                    cartItems.splice(idx, 1);
                }
                updateCartBadge();
                renderCart();
            });
        });
        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cartItems[idx].qty++;
                updateCartBadge();
                renderCart();
            });
        });
    }

    // ==========================================================================
    // EJECUCIÓN INICIAL
    // ==========================================================================
    initFilterListeners();
    initSorting();
    
    console.log('Interacciones de Out Silver cargadas con éxito.');
});
