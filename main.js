import { db, storage, ref, uploadString, getDownloadURL } from './firebase-config.js';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Initialize State from Firebase
async function init() {
    // 1. Listen to Categories from Firestore (Real-time)
    onSnapshot(collection(db, "categories"), (querySnapshot) => {
        state.categories = [];
        querySnapshot.forEach((doc) => {
            state.categories.push({ id: doc.id, ...doc.data() });
        });
        renderCategories();
        if (state.currentCategoryId) renderProducts(state.currentCategoryId);
    });

    // 2. Load About Text
    onSnapshot(doc(db, "settings", "about"), (docSnap) => {
        if (docSnap.exists()) {
            state.aboutText = docSnap.data().text;
            document.getElementById('about-text').innerText = state.aboutText;
        } else {
            document.getElementById('about-text').innerText = state.aboutText;
        }
    });

    // 3. Cart remains Local or Session based (usually best)
    const savedCart = localStorage.getItem('gxStore_cart');
    if (savedCart) state.cart = JSON.parse(savedCart);
    updateCartCount();
}

function saveData() {
    // Cart is the only thing we save locally now
    localStorage.setItem('gxStore_cart', JSON.stringify(state.cart));
}

// Global exposure for HTML onclicks (since we are a module now)
window.showSection = (sectionId) => {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    if (sectionId === 'currencies') showCategories();
};

window.showCategories = () => {
    document.getElementById('categories-container').style.display = 'grid';
    document.getElementById('products-view').style.display = 'none';
    if (state.isAdmin) document.getElementById('admin-category-controls').style.display = 'block';
    renderCategories();
};

window.showProducts = (categoryId) => {
    state.currentCategoryId = categoryId;
    document.getElementById('categories-container').style.display = 'none';
    document.getElementById('products-view').style.display = 'block';
    if (state.isAdmin) document.getElementById('admin-category-controls').style.display = 'none';
    const cat = state.categories.find(c => String(c.id) === String(categoryId));
    if (cat) document.getElementById('current-category-title').innerText = "منتجات " + cat.name;
    renderProducts(categoryId);
};

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
            <button class="btn btn-success" onclick="showProducts('${cat.id}')">عرض المنتجات</button>
            <div class="admin-card-actions">
                <div class="action-icon action-edit" onclick="editCategory('${cat.id}', event)"><i class="fa-solid fa-pen"></i></div>
                <div class="action-icon action-delete" onclick="deleteCategory('${cat.id}', event)"><i class="fa-solid fa-trash"></i></div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderProducts(categoryId) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    const cat = state.categories.find(c => String(c.id) === String(categoryId));
    if (!cat || !cat.products) return;
    cat.products.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${prod.image || 'https://via.placeholder.com/200x200?text=المنتج'}" alt="${prod.name}">
            <h3>${prod.name}</h3>
            <div class="price">${prod.price} جنيه/دولار</div>
            <button class="btn btn-success" onclick="addToCart('${prod.id}')"><i class="fa-solid fa-cart-shopping"></i> إضافة للسلة</button>
            <div class="admin-card-actions">
                <div class="action-icon action-edit" onclick="editProduct('${prod.id}', event)"><i class="fa-solid fa-pen"></i></div>
                <div class="action-icon action-delete" onclick="deleteProduct('${prod.id}', event)"><i class="fa-solid fa-trash"></i></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Admin
window.promptAdmin = () => {
    if (state.isAdmin) return alert("أنت بالفعل في وضع الأدمن.");
    const pass = prompt("الرجاء إدخال الرقم السري للأدمن:");
    if (pass === ADMIN_PASSWORD) setAdminMode(true);
    else if (pass !== null) alert("كلمة المرور خاطئة!");
};

function setAdminMode(isActive) {
    state.isAdmin = isActive;
    if (isActive) {
        document.body.classList.add('admin-active');
        document.getElementById('admin-category-controls').style.display = 'block';
        document.getElementById('admin-product-controls').style.display = 'block';
        document.getElementById('admin-about-controls').style.display = 'block';
    }
}

window.editAboutText = async () => {
    const newText = prompt("أدخل النبذة الجديدة:", state.aboutText);
    if (newText !== null && newText.trim() !== "") {
        await updateDoc(doc(db, "settings", "about"), { text: newText });
    }
};

// Modals
window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.style.display = 'none';
        el.querySelectorAll('input').forEach(input => input.value = '');
        el.querySelectorAll('img').forEach(img => { img.style.display = 'none'; img.src = ''; });
    });
    state.editingCatId = null;
    state.editingProdId = null;
};

// Category Add/Edit
window.openCategoryModal = () => {
    document.getElementById('category-modal-title').innerText = "إضافة تصنيف";
    document.getElementById('category-modal').style.display = 'flex';
};

window.editCategory = (id, event) => {
    event.stopPropagation();
    const cat = state.categories.find(c => String(c.id) === String(id));
    if (!cat) return;
    state.editingCatId = id;
    document.getElementById('category-modal-title').innerText = "تعديل التصنيف";
    document.getElementById('cat-name-input').value = cat.name;
    if (cat.image) {
        const img = document.getElementById('cat-image-preview');
        img.src = cat.image; img.style.display = 'block';
    }
    document.getElementById('category-modal').style.display = 'flex';
};

window.saveCategory = async () => {
    const name = document.getElementById('cat-name-input').value.trim();
    const file = document.getElementById('cat-image-input').files[0];
    if (!name) return alert("الرجاء إدخال اسم اللعبة");

    let imageUrl = "";
    if (state.editingCatId) {
        imageUrl = state.categories.find(c => String(c.id) === String(state.editingCatId)).image || "";
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target.result;
            const storageRef = ref(storage, `categories/${Date.now()}`);
            await uploadString(storageRef, base64, 'data_url');
            imageUrl = await getDownloadURL(storageRef);
            await finishSaveCategory(name, imageUrl);
        };
        reader.readAsDataURL(file);
    } else {
        await finishSaveCategory(name, imageUrl);
    }
};

async function finishSaveCategory(name, imageUrl) {
    if (state.editingCatId) {
        await updateDoc(doc(db, "categories", state.editingCatId), { name, image: imageUrl });
    } else {
        await setDoc(doc(collection(db, "categories")), { name, image: imageUrl, products: [] });
    }
    closeModals();
}

window.deleteCategory = async (id, event) => {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه اللعبة بجميع منتجاتها؟')) {
        await deleteDoc(doc(db, "categories", id));
    }
};

// Products
window.openProductModal = () => {
    document.getElementById('product-modal-title').innerText = "إضافة منتج";
    document.getElementById('product-modal').style.display = 'flex';
};

window.editProduct = (prodId, event) => {
    event.stopPropagation();
    const cat = state.categories.find(c => String(c.id) === String(state.currentCategoryId));
    const prod = cat.products.find(p => String(p.id) === String(prodId));
    state.editingProdId = prodId;
    document.getElementById('product-modal-title').innerText = "تعديل المنتج";
    document.getElementById('prod-name-input').value = prod.name;
    document.getElementById('prod-price-input').value = prod.price;
    if (prod.image) {
        const img = document.getElementById('prod-image-preview');
        img.src = prod.image; img.style.display = 'block';
    }
    document.getElementById('product-modal').style.display = 'flex';
};

window.saveProduct = async () => {
    const name = document.getElementById('prod-name-input').value.trim();
    const price = document.getElementById('prod-price-input').value.trim();
    const file = document.getElementById('prod-image-input').files[0];
    if (!name || !price) return alert("الرجاء إدخال اسم وسعر المنتج");

    const cat = state.categories.find(c => String(c.id) === String(state.currentCategoryId));
    let newProducts = [...cat.products];
    let imageUrl = "";

    if (state.editingProdId) {
        imageUrl = newProducts.find(p => String(p.id) === String(state.editingProdId)).image || "";
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target.result;
            const storageRef = ref(storage, `products/${Date.now()}`);
            await uploadString(storageRef, base64, 'data_url');
            imageUrl = await getDownloadURL(storageRef);
            await finishSaveProduct(cat, newProducts, name, price, imageUrl);
        };
        reader.readAsDataURL(file);
    } else {
        await finishSaveProduct(cat, newProducts, name, price, imageUrl);
    }
};

async function finishSaveProduct(cat, products, name, price, imageUrl) {
    if (state.editingProdId) {
        const idx = products.findIndex(p => String(p.id) === String(state.editingProdId));
        products[idx] = { id: state.editingProdId, name, price: parseFloat(price), image: imageUrl };
    } else {
        products.push({ id: Date.now().toString(), name, price: parseFloat(price), image: imageUrl });
    }
    await updateDoc(doc(db, "categories", cat.id), { products });
    closeModals();
}

window.deleteProduct = async (prodId, event) => {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        const cat = state.categories.find(c => String(c.id) === String(state.currentCategoryId));
        const newProducts = cat.products.filter(p => String(p.id) === String(prodId));
        await updateDoc(doc(db, "categories", cat.id), { products: cat.products.filter(p => String(p.id) !== String(prodId)) });
    }
};

// Cart
window.addToCart = (prodId) => {
    const cat = state.categories.find(c => String(c.id) === String(state.currentCategoryId));
    const prod = cat.products.find(p => String(p.id) === String(prodId));
    if (prod) {
        const existing = state.cart.find(item => item.id === prod.id && item.catName === cat.name);
        if (existing) existing.qty += 1;
        else state.cart.push({ ...prod, catName: cat.name, qty: 1 });
        saveData(); updateCartCount();
        alert(`تم إضافة ${prod.name} إلى السلة!`);
    }
};

window.updateCartCount = () => {
    document.getElementById('cart-count').innerText = state.cart.reduce((sum, item) => sum + item.qty, 0);
};

window.toggleCart = () => {
    const modal = document.getElementById('cart-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    } else {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        renderCartItems();
    }
};

function renderCartItems() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    let total = 0;
    if (state.cart.length === 0) container.innerHTML = '<p style="text-align:center; color:#888;">السلة فارغة حالياً</p>';
    else {
        state.cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>[${item.catName}] ${item.name} (${item.qty}x)</h4>
                        <span>${itemTotal} جنيه/دولار</span>
                    </div>
                    <div class="cart-item-delete" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash"></i></div>
                </div>`;
        });
    }
    document.getElementById('cart-total-price').innerText = total;
}

window.removeFromCart = (index) => {
    state.cart.splice(index, 1);
    saveData(); updateCartCount(); renderCartItems();
};

window.sendOrder = () => {
    if (state.cart.length === 0) return alert("السلة فارغة.");
    let message = "مرحباً، أود طلب المنتجات التالية من GX STORE:\n\n";
    let total = 0;
    state.cart.forEach((item, i) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `${i + 1}- اللعبة: ${item.catName} | المنتج: ${item.name} (الكمية: ${item.qty}) = ${itemTotal}\n`;
    });
    message += `\nالإجمالي = ${total}\n\nرجاء الإفادة بطرق الدفع المتاحة.`;
    window.open(`https://wa.me/20${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    state.cart = []; saveData(); updateCartCount(); window.toggleCart();
};

// Preview handlers
document.getElementById('cat-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const img = document.getElementById('cat-image-preview');
        img.src = URL.createObjectURL(file); img.style.display = 'block';
    }
});

document.getElementById('prod-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const img = document.getElementById('prod-image-preview');
        img.src = URL.createObjectURL(file); img.style.display = 'block';
    }
});

init();
