document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // VARIABLES DE ESTADO
    // ==========================================================================
    let cartItems = [];
    let selectedShalomAgency = null;
    
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
            
            const title = card.querySelector('.product-title').textContent;
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
    function addToCart(title, price, qty, img, size = 'Única', color = 'Único') {
        const existingItem = cartItems.find(item => item.title === title && item.size === size && item.color === color);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cartItems.push({ title, price, qty, img, size, color, id: Date.now() });
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
            
            // Renderizar colores dinámicamente
            const colorOptionsContainer = document.querySelector('.modal-details-col .color-options');
            if (colorOptionsContainer) {
                colorOptionsContainer.innerHTML = '';
                const colorsJson = card.getAttribute('data-colors');
                const colors = colorsJson ? JSON.parse(colorsJson) : ["#f4f4f4"];
                
                const colorNamesMap = {
                    "#ff7a00": "Naranja",
                    "#333333": "Negro",
                    "#f4f4f4": "Blanco",
                    "#faf6ef": "Crema",
                    "#faf4ee": "Alabastro",
                    "#fcfaf0": "Hueso",
                    "#eadecd": "Beige",
                    "#3e5a7a": "Azul Acero",
                    "#e2e8e4": "Gris Claro",
                    "#e7eee9": "Verde Menta"
                };

                colors.forEach((color, idx) => {
                    const btn = document.createElement('button');
                    btn.className = `color-btn${idx === 0 ? ' active' : ''}`;
                    btn.style.background = color;
                    btn.setAttribute('data-color', color);
                    btn.setAttribute('data-color-name', colorNamesMap[color] || color);
                    
                    btn.addEventListener('click', () => {
                        colorOptionsContainer.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        const colorImages = JSON.parse(card.getAttribute('data-color-images') || '{}');
                        if (colorImages[color]) {
                            const imgEl = modalImageContainer.querySelector('img');
                            if (imgEl) {
                                imgEl.src = colorImages[color];
                            }
                        } else {
                            const svgPaths = modalImageContainer.querySelectorAll('svg path');
                            svgPaths.forEach(path => {
                                const currentFill = path.getAttribute('fill');
                                if (currentFill && currentFill !== 'none') {
                                    path.setAttribute('fill', color);
                                }
                            });
                        }
                    });
                    
                    colorOptionsContainer.appendChild(btn);
                });
            }
            
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
        const activeColorBtn = document.querySelector('.modal-details-col .color-btn.active');
        const color = activeColorBtn ? (activeColorBtn.getAttribute('data-color-name') || 'Único') : 'Único';
        
        addToCart(title, price, currentQty, svgArt, size, color);
        showToast(`¡${currentQty}x "${title}" (Talla ${size}, Color ${color}) añadido al carrito!`);
        closeModal();
    });
    
    document.getElementById('modal-buy-now').addEventListener('click', () => {
        const title = modalTitle.textContent;
        const price = parseFloat(modalPrice.textContent.replace('S/', '').trim());
        const svgArt = modalImageContainer.innerHTML;
        const activeSizeBtn = document.querySelector('.size-btn.active');
        const size = activeSizeBtn ? activeSizeBtn.textContent : 'Única';
        const activeColorBtn = document.querySelector('.modal-details-col .color-btn.active');
        const color = activeColorBtn ? (activeColorBtn.getAttribute('data-color-name') || 'Único') : 'Único';
        
        addToCart(title, price, currentQty, svgArt, size, color);
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
        const buyerForm = document.getElementById('cart-buyer-form');
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
            if (cartSubtotalPrice) cartSubtotalPrice.textContent = 'S/ 0.00';
            const cartShippingPrice = document.getElementById('cart-shipping-price');
            const cartTotalPrice = document.getElementById('cart-total-price');
            if (cartShippingPrice) cartShippingPrice.textContent = 'Gratis';
            if (cartTotalPrice) cartTotalPrice.textContent = 'S/ 0.00';
            cartDrawerCount.textContent = '0';
            if (buyerForm) buyerForm.classList.add('hidden');
            return;
        }
        
        if (buyerForm) buyerForm.classList.remove('hidden');
        
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
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 5px;">Talla: <strong style="color: var(--color-text-main);">${item.size}</strong> | Color: <strong style="color: var(--color-text-main);">${item.color || 'Único'}</strong></div>
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
        
        // Calcular costo de envío y total final
        const agencySelect = document.getElementById('buyer-agency');
        const shippingCost = (agencySelect && agencySelect.value === 'Otra') ? 20 : 0;
        const total = subtotal + shippingCost;

        if (cartSubtotalPrice) cartSubtotalPrice.textContent = `S/ ${subtotal.toFixed(2)}`;
        
        const cartShippingPrice = document.getElementById('cart-shipping-price');
        const cartTotalPrice = document.getElementById('cart-total-price');
        
        if (cartShippingPrice) {
            cartShippingPrice.textContent = shippingCost > 0 ? `S/ ${shippingCost.toFixed(2)}` : 'Gratis';
            cartShippingPrice.style.color = shippingCost > 0 ? 'var(--color-accent)' : 'var(--color-primary-light)';
            cartShippingPrice.style.fontWeight = '700';
        }
        if (cartTotalPrice) cartTotalPrice.textContent = `S/ ${total.toFixed(2)}`;
        
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

    // Configurar redirección a WhatsApp al hacer click en Comprar (checkout-btn)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cartItems.length === 0) {
                showToast('Tu carrito está vacío. Añade algunas prendas para comprar.');
                return;
            }
            
            // Referencias a los campos del formulario del comprador
            const nameInput = document.getElementById('buyer-name');
            const docTypeSelect = document.getElementById('buyer-doc-type');
            const docNumberInput = document.getElementById('buyer-doc-number');
            const agencySelect = document.getElementById('buyer-agency');
            const customAgencyInput = document.getElementById('buyer-custom-agency');
            const destinationInput = document.getElementById('buyer-destination');
            const btnOpenShalomSelector = document.getElementById('btn-open-shalom-selector');
            
            const name = nameInput.value.trim();
            const docType = docTypeSelect.value;
            const docNumber = docNumberInput.value.trim();
            const agency = agencySelect.value;
            const customAgency = customAgencyInput.value.trim();
            const destination = destinationInput.value.trim();
            
            // Validaciones
            let hasErrors = false;
            
            // Limpiar clases de error previas
            const allInputs = [nameInput, docNumberInput, customAgencyInput, destinationInput];
            if (btnOpenShalomSelector) allInputs.push(btnOpenShalomSelector);
            allInputs.forEach(el => el.classList.remove('input-error'));
            
            if (!name) {
                nameInput.classList.add('input-error');
                hasErrors = true;
            }
            
            // Validar según el tipo de documento (DNI: 8 dígitos numéricos, CE: 9 dígitos numéricos)
            if (docType === 'DNI') {
                const dniRegex = /^\d{8}$/;
                if (!dniRegex.test(docNumber)) {
                    docNumberInput.classList.add('input-error');
                    hasErrors = true;
                }
            } else if (docType === 'CE') {
                const ceRegex = /^\d{9}$/;
                if (!ceRegex.test(docNumber)) {
                    docNumberInput.classList.add('input-error');
                    hasErrors = true;
                }
            }

            // Validar agencia y destino
            if (agency === 'Otra' && !customAgency) {
                customAgencyInput.classList.add('input-error');
                hasErrors = true;
            }
            if (agency === 'Shalom' && !selectedShalomAgency) {
                if (btnOpenShalomSelector) btnOpenShalomSelector.classList.add('input-error');
                hasErrors = true;
            }
            if (!destination) {
                destinationInput.classList.add('input-error');
                hasErrors = true;
            }
            
            if (hasErrors) {
                showToast('⚠️ Completa tus datos, agencia y destino de envío de forma correcta.');
                return;
            }
            
            let message = '¡Hola! Quisiera comprar los siguientes productos en Out Silver:\n\n';
            let subtotal = 0;
            
            cartItems.forEach(item => {
                const itemTotal = item.price * item.qty;
                subtotal += itemTotal;
                message += `- ${item.qty}x ${item.title} (Talla: ${item.size}, Color: ${item.color || 'Único'}) - S/ ${itemTotal.toFixed(2)}\n`;
            });
            
            message += `\n*Datos del Comprador:*\n`;
            message += `- Nombre Completo: ${name}\n`;
            message += `- Documento: ${docType} (${docNumber})\n\n`;

            const finalAgency = agency === 'Shalom' && selectedShalomAgency 
                ? `Shalom (Agencia: ${selectedShalomAgency.name})` 
                : customAgency;
            const finalDestination = agency === 'Shalom' && selectedShalomAgency
                ? selectedShalomAgency.address
                : destination;

            message += `*Datos de Envío:*\n`;
            message += `- Agencia: ${finalAgency}\n`;
            message += `- Destino: ${finalDestination}\n\n`;
            
            const shippingCost = agency === 'Otra' ? 20 : 0;
            const total = subtotal + shippingCost;
            
            message += `*Subtotal:* S/ ${subtotal.toFixed(2)}\n`;
            if (shippingCost > 0) {
                message += `- Costo de Envío: S/ ${shippingCost.toFixed(2)} (Otra Agencia)\n`;
            } else {
                message += `- Costo de Envío: Gratis (Agencia Shalom)\n`;
            }
            message += `*Total Final:* S/ ${total.toFixed(2)}\n\n`;
            message += 'Por favor, confírmame disponibilidad y los pasos para el pago. ¡Gracias!';
            
            const encodedMessage = encodeURIComponent(message);
            const phoneNumber = '51966314626'; // Código de país 51 (Perú) + número 966314626
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }

    // Cambiar dinámicamente placeholder y maxlength del número de documento según la selección
    const docTypeSelect = document.getElementById('buyer-doc-type');
    const docNumberInput = document.getElementById('buyer-doc-number');
    if (docTypeSelect && docNumberInput) {
        // Establecer valores iniciales por defecto (DNI)
        docNumberInput.placeholder = 'Número de DNI (8 dígitos)';
        docNumberInput.maxLength = 8;

        docTypeSelect.addEventListener('change', (e) => {
            const docType = e.target.value;
            if (docType === 'DNI') {
                docNumberInput.placeholder = 'Número de DNI (8 dígitos)';
                docNumberInput.maxLength = 8;
            } else if (docType === 'CE') {
                docNumberInput.placeholder = 'Número de CE (9 dígitos)';
                docNumberInput.maxLength = 9;
            }
            // Limpiar valores al cambiar para evitar envíos cruzados incorrectos
            docNumberInput.value = '';
            docNumberInput.classList.remove('input-error');
        });
    }

    // Mostrar/ocultar dinámicamente el campo de agencia personalizada o buscador de Shalom según la selección
    const agencySelect = document.getElementById('buyer-agency');
    const customAgencyGroup = document.getElementById('buyer-custom-agency-group');
    const customAgencyInput = document.getElementById('buyer-custom-agency');
    const shalomAgencyGroup = document.getElementById('shalom-agency-finder-group');
    const btnOpenShalomSelector = document.getElementById('btn-open-shalom-selector');
    const destinationInput = document.getElementById('buyer-destination');

    if (agencySelect) {
        agencySelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'Otra') {
                if (customAgencyGroup) customAgencyGroup.classList.remove('hidden');
                if (shalomAgencyGroup) shalomAgencyGroup.classList.add('hidden');
                if (customAgencyInput) customAgencyInput.focus();
                
                // Limpiar selección de Shalom y cerrar panel flotante
                clearShalomSelection();
                closeShalomSelector();
            } else if (val === 'Shalom') {
                if (customAgencyGroup) customAgencyGroup.classList.add('hidden');
                if (shalomAgencyGroup) shalomAgencyGroup.classList.remove('hidden');
                if (customAgencyInput) {
                    customAgencyInput.value = '';
                    customAgencyInput.classList.remove('input-error');
                }
                // Abrir buscador lateral automáticamente
                openShalomSelector();
            }
            
            // Re-renderizar carrito para actualizar el costo de envío y total final
            renderCart();
        });
    }

    // ==========================================================================
    // BUSCADOR FLOTANTE DE AGENCIAS SHALOM
    // ==========================================================================
    const shalomFloatingSelector = document.getElementById('shalom-floating-selector');
    const closeShalomSelectorBtn = document.getElementById('close-shalom-selector');
    const shalomSearchInput = document.getElementById('shalom-search-input');
    const clearShalomSearchBtn = document.getElementById('clear-shalom-search');
    const shalomSelectorResults = document.getElementById('shalom-selector-results');
    const selectedAgencyBadge = document.getElementById('selected-agency-badge');
    const selectedAgencyInfo = document.getElementById('selected-agency-info');

    let highlightedIndex = -1;
    let filteredAgencies = [];

    // Abrir el selector de agencias
    function openShalomSelector() {
        if (shalomFloatingSelector) {
            shalomFloatingSelector.classList.remove('hidden');
            if (shalomSearchInput) {
                shalomSearchInput.focus();
                
                // Si la caja de búsqueda está vacía, cargar las primeras 30 agencias para explorar inmediatamente
                if (!shalomSearchInput.value.trim()) {
                    if (typeof SHALOM_AGENCIES !== 'undefined') {
                        filteredAgencies = SHALOM_AGENCIES.slice(0, 30);
                        renderAgencyResults();
                    }
                }
            }
        }
    }

    // Cerrar el selector de agencias
    function closeShalomSelector() {
        if (shalomFloatingSelector) {
            shalomFloatingSelector.classList.add('hidden');
            highlightedIndex = -1;
        }
    }

    // Limpiar selección de agencias
    function clearShalomSelection() {
        selectedShalomAgency = null;
        
        if (btnOpenShalomSelector) {
            btnOpenShalomSelector.innerHTML = '<span>🔍 Seleccionar Agencia Shalom...</span>';
            btnOpenShalomSelector.classList.remove('input-error');
        }
        
        if (selectedAgencyBadge) selectedAgencyBadge.classList.add('hidden');
        if (selectedAgencyInfo) selectedAgencyInfo.innerHTML = 'Ninguna';
        
        if (destinationInput) {
            destinationInput.value = '';
            destinationInput.classList.remove('input-error');
        }
        
        if (shalomSearchInput) {
            shalomSearchInput.value = '';
            shalomSearchInput.classList.remove('input-error');
        }
        if (clearShalomSearchBtn) clearShalomSearchBtn.classList.add('hidden');
        
        if (shalomSelectorResults) {
            shalomSelectorResults.innerHTML = '';
        }
        
        filteredAgencies = [];
        highlightedIndex = -1;
    }

    // Registrar disparador en el carrito
    if (btnOpenShalomSelector) {
        btnOpenShalomSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            openShalomSelector();
        });
    }

    // Registrar botón de cerrar
    if (closeShalomSelectorBtn) {
        closeShalomSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeShalomSelector();
        });
    }

    // Registrar limpiar búsqueda
    if (clearShalomSearchBtn) {
        clearShalomSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (shalomSearchInput) {
                shalomSearchInput.value = '';
                clearShalomSearchBtn.classList.add('hidden');
                shalomSearchInput.focus();
                
                // Cargar sugerencias por defecto (primeras 30)
                if (typeof SHALOM_AGENCIES !== 'undefined') {
                    filteredAgencies = SHALOM_AGENCIES.slice(0, 30);
                    renderAgencyResults();
                }
            }
        });
    }

    // Controlar escritura en buscador flotante
    if (shalomSearchInput) {
        shalomSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            
            if (!query) {
                if (clearShalomSearchBtn) clearShalomSearchBtn.classList.add('hidden');
                if (typeof SHALOM_AGENCIES !== 'undefined') {
                    filteredAgencies = SHALOM_AGENCIES.slice(0, 30);
                    renderAgencyResults();
                }
                return;
            }

            if (clearShalomSearchBtn) clearShalomSearchBtn.classList.remove('hidden');

            // Filtrar agencias en tiempo real
            if (typeof SHALOM_AGENCIES !== 'undefined') {
                filteredAgencies = SHALOM_AGENCIES.filter(agency => 
                    agency.name.toLowerCase().includes(query) || 
                    agency.address.toLowerCase().includes(query)
                ).slice(0, 30); // Limitar a 30 por rendimiento
            }

            renderAgencyResults();
        });

        // Eventos de teclado (flechas y enter) para el buscador flotante
        shalomSearchInput.addEventListener('keydown', (e) => {
            if (shalomFloatingSelector.classList.contains('hidden') || filteredAgencies.length === 0) return;

            const cards = shalomSelectorResults.querySelectorAll('.shalom-panel-agency-card');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex + 1) % cards.length;
                updateHighlightedCard(cards);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex - 1 + cards.length) % cards.length;
                updateHighlightedCard(cards);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredAgencies.length) {
                    selectAgency(filteredAgencies[highlightedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeShalomSelector();
            }
        });
    }

    // Ocultar selector si se hace click fuera del panel y fuera del botón de apertura
    document.addEventListener('click', (e) => {
        if (shalomFloatingSelector && !shalomFloatingSelector.classList.contains('hidden')) {
            const clickedInsidePanel = shalomFloatingSelector.contains(e.target);
            const clickedTriggerBtn = btnOpenShalomSelector && btnOpenShalomSelector.contains(e.target);
            
            if (!clickedInsidePanel && !clickedTriggerBtn) {
                closeShalomSelector();
            }
        }
    });

    // Renderizar resultados de agencias en el panel flotante
    function renderAgencyResults() {
        if (!shalomSelectorResults) return;
        
        highlightedIndex = -1;
        shalomSelectorResults.innerHTML = '';
        
        if (filteredAgencies.length === 0) {
            shalomSelectorResults.innerHTML = '<div class="no-results-msg">No se encontraron agencias coincidentes</div>';
            return;
        }

        filteredAgencies.forEach((agency, index) => {
            const card = document.createElement('div');
            card.className = 'shalom-panel-agency-card';
            
            // Marcar activa si es la actualmente seleccionada
            if (selectedShalomAgency && selectedShalomAgency.name === agency.name) {
                card.classList.add('active');
            }
            
            card.setAttribute('data-index', index);
            card.innerHTML = `
                <span class="shalom-panel-agency-name">${agency.name}</span>
                <span class="shalom-panel-agency-address">${agency.address}</span>
                <span class="shalom-panel-agency-select-indicator">Seleccionar →</span>
            `;
            
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                selectAgency(agency);
            });

            shalomSelectorResults.appendChild(card);
        });
    }

    // Actualizar visualmente la tarjeta destacada mediante teclado
    function updateHighlightedCard(cards) {
        cards.forEach(card => card.classList.remove('active'));
        if (highlightedIndex >= 0 && highlightedIndex < cards.length) {
            const activeCard = cards[highlightedIndex];
            activeCard.classList.add('active');
            
            // Auto-scroll del contenedor hacia la tarjeta destacada si se sale de vista
            activeCard.scrollIntoView({ block: 'nearest' });
        }
    }

    // Seleccionar agencia y sincronizar UI con el carrito lateral
    function selectAgency(agency) {
        selectedShalomAgency = agency;
        
        // Actualizar botón disparador en el carrito
        if (btnOpenShalomSelector) {
            btnOpenShalomSelector.innerHTML = `<span>🔍 ${agency.name}</span>`;
            btnOpenShalomSelector.classList.remove('input-error');
        }
        
        // Actualizar distintivo (badge)
        if (selectedAgencyInfo) {
            selectedAgencyInfo.innerHTML = `<strong>${agency.name}</strong><br><small style="color: var(--color-text-muted); font-size: 0.8rem;">${agency.address}</small>`;
        }
        if (selectedAgencyBadge) {
            selectedAgencyBadge.classList.remove('hidden');
        }
        
        // Auto-completar destino físico
        if (destinationInput) {
            destinationInput.value = `${agency.name} - ${agency.address}`;
            destinationInput.classList.remove('input-error');
        }

        // Cerrar panel flotante
        closeShalomSelector();
    }

    // ==========================================================================
    // EJECUCIÓN INICIAL
    // ==========================================================================
    initFilterListeners();
    initSorting();
    
    console.log('Interacciones de Out Silver cargadas con éxito.');
});
