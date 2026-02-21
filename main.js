// State & Structure
const WHATSAPP_NUMBER = "01015138486";
const ADMIN_PASSWORD = "1357";

let state = {
    isAdmin: false,
    aboutText: "🔥 أهلاً بك في معقل اللاعبين.. GX STORE! 🔥\n\nهنا حيث يبدأ الاحتراف وتكتمل متعة اللعب. نحن لا نقدم مجرد شحن للألعاب، بل نقدم لك مفاتيح السيطرة! أسرع خدمة، أقوى العروض، وأعلى درجات الأمان لحسابك. سواء كنت في ساحة المعركة في PUBG أو في تحديات Free Fire، متجرنا هو سلاحك السري للوصول للقمة. 🎮⚡",
    categories: [],
    cart: [],
    currentCategoryId: null,
    editingCatId: null,
    editingProdId: null
};

// Initialize State from LocalStorage
function init() {
    const savedCategories = localStorage.getItem('gxStore_categories');
    if (savedCategories) {
        state.categories = JSON.parse(savedCategories);
    } else {
        state.categories = [];
        saveData();
    }

    const savedAbout = localStorage.getItem('gxStore_about');
    const oldDefault = "مرحباً بكم في متجر GX STORE. متجركم الموثوق لشراء شحن كافة الألعاب بأفضل الأسعار وأسرع وقت.";
    if (savedAbout && savedAbout !== oldDefault) {
        state.aboutText = savedAbout;
    } else {
        saveData(); // Save the new awesome default
    }

    const savedCart = localStorage.getItem('gxStore_cart');
    if (savedCart) state.cart = JSON.parse(savedCart);

    document.getElementById('about-text').innerText = state.aboutText;

    renderCategories();
    updateCartCount();
}

function saveData() {
    localStorage.setItem('gxStore_categories', JSON.stringify(state.categories));
    localStorage.setItem('gxStore_about', state.aboutText);
    localStorage.setItem('gxStore_cart', JSON.stringify(state.cart));
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (sectionId === 'currencies') {
        showCategories();
    }
}

function showCategories() {
    document.getElementById('categories-container').style.display = 'grid';
    document.getElementById('products-view').style.display = 'none';
    if (state.isAdmin) document.getElementById('admin-category-controls').style.display = 'block';
    renderCategories();
}

function showProducts(categoryId) {
    state.currentCategoryId = categoryId;
    const cat = state.categories.find(c => c.id === categoryId);
    if (!cat) return;

    document.getElementById('categories-container').style.display = 'none';
    document.getElementById('products-view').style.display = 'block';
    if (state.isAdmin) document.getElementById('admin-category-controls').style.display = 'none';

    document.getElementById('current-category-title').innerText = "منتجات " + cat.name;

    renderProducts(categoryId);
}

// Render Functions
function renderCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    state.categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${cat.image || 'https://via.placeholder.com/200x200?text=غلاف+اللعبة'}" alt="${cat.name}">
            <h3>${cat.name}</h3>
            <button class="btn btn-success" onclick="showProducts(${cat.id})">عرض المنتجات</button>
            <div class="admin-card-actions">
                <div class="action-icon action-edit" onclick="editCategory(${cat.id}, event)"><i class="fa-solid fa-pen"></i></div>
                <div class="action-icon action-delete" onclick="deleteCategory(${cat.id}, event)"><i class="fa-solid fa-trash"></i></div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderProducts(categoryId) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    const cat = state.categories.find(c => c.id === categoryId);
    if (!cat) return;

    cat.products.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${prod.image || 'https://via.placeholder.com/200x200?text=المنتج'}" alt="${prod.name}">
            <h3>${prod.name}</h3>
            <div class="price">${prod.price} جنيه/دولار</div>
            <button class="btn btn-success" onclick="addToCart(${prod.id})"><i class="fa-solid fa-cart-shopping"></i> إضافة للسلة</button>
            <div class="admin-card-actions">
                <div class="action-icon action-edit" onclick="editProduct(${prod.id}, event)"><i class="fa-solid fa-pen"></i></div>
                <div class="action-icon action-delete" onclick="deleteProduct(${prod.id}, event)"><i class="fa-solid fa-trash"></i></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Admin Capabilities
function promptAdmin() {
    if (state.isAdmin) {
        alert("أنت بالفعل في وضع الأدمن.");
        return;
    }
    const pass = prompt("الرجاء إدخال الرقم السري للأدمن:");
    if (pass === ADMIN_PASSWORD) {
        setAdminMode(true);
        alert("تم تفعيل وضع الأدمن بنجاح!");
    } else if (pass !== null) {
        alert("كلمة المرور خاطئة!");
    }
}

function setAdminMode(isActive) {
    state.isAdmin = isActive;
    if (isActive) {
        document.body.classList.add('admin-active');
        document.getElementById('admin-category-controls').style.display = 'block';
        document.getElementById('admin-product-controls').style.display = 'block';
        document.getElementById('admin-about-controls').style.display = 'block';
    }
}

function editAboutText() {
    const newText = prompt("أدخل النبذة الجديدة:", state.aboutText);
    if (newText !== null && newText.trim() !== "") {
        state.aboutText = newText;
        document.getElementById('about-text').innerText = state.aboutText;
        saveData();
    }
}

// Modals
function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.style.display = 'none';

        el.querySelectorAll('input').forEach(input => {
            if (input.type === 'file') input.value = '';
            else input.value = '';
        });
        el.querySelectorAll('img').forEach(img => {
            img.style.display = 'none';
            img.src = '';
        });
    });
    state.editingCatId = null;
    state.editingProdId = null;
}

// Categories Admin Functions
function openCategoryModal() {
    document.getElementById('category-modal-title').innerText = "إضافة تصنيف";
    document.getElementById('category-modal').style.display = 'flex';
}

function editCategory(id, event) {
    event.stopPropagation();
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    state.editingCatId = id;
    document.getElementById('category-modal-title').innerText = "تعديل التصنيف";
    document.getElementById('cat-name-input').value = cat.name;

    if (cat.image) {
        const img = document.getElementById('cat-image-preview');
        img.src = cat.image;
        img.style.display = 'block';
    }

    document.getElementById('category-modal').style.display = 'flex';
}

function saveCategory() {
    const name = document.getElementById('cat-name-input').value.trim();
    const file = document.getElementById('cat-image-input').files[0];

    if (!name) {
        alert("الرجاء إدخال اسم اللعبة");
        return;
    }

    if (state.editingCatId) {
        const cat = state.categories.find(c => c.id === state.editingCatId);
        cat.name = name;
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                cat.image = e.target.result;
                finishSaveCategory();
            };
            reader.readAsDataURL(file);
        } else {
            finishSaveCategory();
        }
    } else {
        const newCat = {
            id: Date.now(),
            name: name,
            image: "",
            products: []
        };
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                newCat.image = e.target.result;
                state.categories.push(newCat);
                finishSaveCategory();
            };
            reader.readAsDataURL(file);
        } else {
            state.categories.push(newCat);
            finishSaveCategory();
        }
    }
}

function finishSaveCategory() {
    saveData();
    renderCategories();
    closeModals();
}

function deleteCategory(id, event) {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه اللعبة بجميع منتجاتها؟')) {
        state.categories = state.categories.filter(c => c.id !== id);
        saveData();
        renderCategories();
    }
}

// Products Admin Functions
function openProductModal() {
    document.getElementById('product-modal-title').innerText = "إضافة منتج";
    document.getElementById('product-modal').style.display = 'flex';
}

function editProduct(prodId, event) {
    event.stopPropagation();
    const cat = state.categories.find(c => c.id === state.currentCategoryId);
    const prod = cat.products.find(p => p.id === prodId);
    if (!prod) return;

    state.editingProdId = prodId;
    document.getElementById('product-modal-title').innerText = "تعديل المنتج";
    document.getElementById('prod-name-input').value = prod.name;
    document.getElementById('prod-price-input').value = prod.price;

    if (prod.image) {
        const img = document.getElementById('prod-image-preview');
        img.src = prod.image;
        img.style.display = 'block';
    }

    document.getElementById('product-modal').style.display = 'flex';
}

function saveProduct() {
    const name = document.getElementById('prod-name-input').value.trim();
    const price = document.getElementById('prod-price-input').value.trim();
    const file = document.getElementById('prod-image-input').files[0];

    if (!name || !price) {
        alert("الرجاء إدخال اسم وسعر المنتج");
        return;
    }

    const catIndex = state.categories.findIndex(c => c.id === state.currentCategoryId);
    if (catIndex === -1) return;

    if (state.editingProdId) {
        const prod = state.categories[catIndex].products.find(p => p.id === state.editingProdId);
        prod.name = name;
        prod.price = parseFloat(price);
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                prod.image = e.target.result;
                finishSaveProduct();
            };
            reader.readAsDataURL(file);
        } else {
            finishSaveProduct();
        }
    } else {
        const newProd = {
            id: Date.now(),
            name: name,
            price: parseFloat(price),
            image: ""
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                newProd.image = e.target.result;
                state.categories[catIndex].products.push(newProd);
                finishSaveProduct();
            };
            reader.readAsDataURL(file);
        } else {
            state.categories[catIndex].products.push(newProd);
            finishSaveProduct();
        }
    }
}

function finishSaveProduct() {
    saveData();
    renderProducts(state.currentCategoryId);
    closeModals();
}

function deleteProduct(prodId, event) {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        const cat = state.categories.find(c => c.id === state.currentCategoryId);
        cat.products = cat.products.filter(p => p.id !== prodId);
        saveData();
        renderProducts(state.currentCategoryId);
    }
}

// Cart System
function addToCart(prodId) {
    const cat = state.categories.find(c => c.id === state.currentCategoryId);
    const prod = cat.products.find(p => p.id === prodId);

    if (prod) {
        const existing = state.cart.find(item => item.id === prod.id && item.catName === cat.name);
        if (existing) {
            existing.qty += 1;
        } else {
            state.cart.push({ ...prod, catName: cat.name, qty: 1 });
        }

        saveData();
        updateCartCount();
        alert(`تم إضافة ${prod.name} إلى السلة!`);
    }
}

function updateCartCount() {
    const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-count').innerText = totalQty;
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    } else {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        renderCartItems();
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    let total = 0;

    if (state.cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">السلة فارغة حالياً</p>';
    } else {
        state.cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>[${item.catName}] ${item.name} (${item.qty}x)</h4>
                        <span>${itemTotal} جنيه/دولار</span>
                    </div>
                    <div class="cart-item-delete" onclick="removeFromCart(${index})">
                        <i class="fa-solid fa-trash"></i>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('cart-total-price').innerText = total;
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    saveData();
    updateCartCount();
    renderCartItems();
}



function sendOrder() {
    if (state.cart.length === 0) {
        alert("السلة فارغة. الرجاء إضافة منتجات أولاً.");
        return;
    }

    let message = "مرحباً، أود طلب المنتجات التالية من GX STORE:\n\n";
    let total = 0;

    state.cart.forEach((item, i) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `${i + 1}- اللعبة: ${item.catName} | المنتج: ${item.name} (الكمية: ${item.qty}) = ${itemTotal}\n`;
    });

    message += `\nالإجمالي = ${total}\n\nرجاء الإفادة بطرق الدفع المتاحة.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/20${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    clearCartOnSubmit();
    window.open(whatsappUrl, '_blank');
}

function clearCartOnSubmit() {
    state.cart = [];
    saveData();
    updateCartCount();
    toggleCart();
}

// Image Preview Handlers
document.getElementById('cat-image-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const img = document.getElementById('cat-image-preview');
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';
    }
});

document.getElementById('prod-image-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const img = document.getElementById('prod-image-preview');
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';
    }
});

// Start App
init();
