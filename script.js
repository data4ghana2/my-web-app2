// ==================== Supabase Configuration ====================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';

const SUPABASE_URL = 'https://tjueeyetxfmatenjokjl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6EzAMrLWBCw3Cnc6f3HBtw_hXJvJgCF';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== Auth State Management ====================
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && window.location.pathname.includes('dashboard')) {
            window.location.href = 'index.html';
        } else if (session && window.location.pathname === '/' || window.location.pathname.includes('index')) {
            window.location.href = 'dashboard.html';
        }
        
        return session;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

checkAuth();

// ==================== User Session ====================
async function getUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// ==================== Load User Profile ====================
async function loadUserProfile() {
    try {
        const user = await getUser();
        
        if (user) {
            // Fetch user profile from database
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                updateProfileUI(data);
                console.log('User profile loaded:', data);
            } else if (error && error.code !== 'PGRST116') {
                console.error('Error loading profile:', error);
            }
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Update profile UI elements
function updateProfileUI(profile) {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileName) profileName.textContent = profile.full_name || 'User';
    if (profileEmail) profileEmail.textContent = profile.email || '';
    
    // Update avatar
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && profile.full_name) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=0D8ABC&color=fff`;
    }
}

// ==================== Load Wallet Balance ====================
async function loadWalletBalance() {
    try {
        const user = await getUser();
        
        if (user) {
            const { data, error } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                const displayBalance = document.getElementById('displayBalance');
                if (displayBalance) {
                    displayBalance.textContent = parseFloat(data.balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                }
                console.log('Wallet balance loaded:', data.balance);
            } else if (error && error.code !== 'PGRST116') {
                console.error('Error loading wallet:', error);
            }
        }
    } catch (error) {
        console.error('Wallet load error:', error);
    }
}

// ==================== Load Transactions ====================
async function loadTransactions() {
    try {
        const user = await getUser();
        
        if (user) {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (data) {
                displayTransactions(data);
                console.log('Transactions loaded:', data);
            } else if (error) {
                console.error('Error loading transactions:', error);
            }
        }
    } catch (error) {
        console.error('Transaction load error:', error);
    }
}

// Display transactions in UI
function displayTransactions(transactions) {
    const transactionsList = document.querySelector('.transactions-list');
    
    if (transactionsList) {
        transactionsList.innerHTML = '';
        
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            const iconClass = getTransactionIcon(transaction.category);
            const amountClass = transaction.type === 'income' ? 'positive' : 'negative';
            const amountSign = transaction.type === 'income' ? '+' : '-';
            
            transactionItem.innerHTML = `
                <div class="transaction-icon ${transaction.category.toLowerCase()}">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <p class="transaction-name">${transaction.description}</p>
                    <p class="transaction-date">${new Date(transaction.created_at).toLocaleDateString()}</p>
                </div>
                <p class="transaction-amount ${amountClass}">${amountSign}$${parseFloat(transaction.amount).toFixed(2)}</p>
            `;
            
            transactionsList.appendChild(transactionItem);
        });
    }
}

// Get icon for transaction category
function getTransactionIcon(category) {
    const icons = {
        'groceries': 'shopping-cart',
        'salary': 'briefcase',
        'utilities': 'bolt',
        'restaurant': 'utensils',
        'entertainment': 'film',
        'transportation': 'car',
        'shopping': 'bag'
    };
    return icons[category.toLowerCase()] || 'tag';
}

// ==================== Login Page Functionality ====================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Login with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                alert('Login failed: ' + error.message);
            } else if (data.user) {
                console.log('Login successful:', data.user);
                
                // Load profile and redirect
                await loadUserProfile();
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });
}

// Signup Link
const signupLink = document.querySelector('.signup-link');
if (signupLink) {
    signupLink.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = prompt('Enter your email:');
        if (!email) return;
        
        const password = prompt('Enter your password:');
        if (!password) return;
        
        const fullName = prompt('Enter your full name:');
        if (!fullName) return;
        
        try {
            // Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            
            if (error) {
                alert('Signup failed: ' + error.message);
            } else if (data.user) {
                // Create user profile
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert([
                        {
                            user_id: data.user.id,
                            full_name: fullName,
                            email: email
                        }
                    ]);
                
                // Create wallet
                const { error: walletError } = await supabase
                    .from('wallets')
                    .insert([
                        {
                            user_id: data.user.id,
                            balance: 0
                        }
                    ]);
                
                alert('Signup successful! Please verify your email and log in.');
                console.log('User created:', data.user);
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('An error occurred during signup');
        }
    });
}

// Forgot Password
const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = prompt('Enter your email:');
        if (!email) return;
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert('Password reset email sent! Check your inbox.');
            }
        } catch (error) {
            console.error('Password reset error:', error);
        }
    });
}

// ==================== Dashboard Page Functionality ====================

// Load dashboard data
if (window.location.pathname.includes('dashboard')) {
    loadUserProfile();
    loadWalletBalance();
    loadTransactions();
    
    // Refresh data every 5 minutes
    setInterval(() => {
        loadWalletBalance();
        loadTransactions();
    }, 300000);
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
const dropdownLogout = document.getElementById('dropdownLogout');

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
        } else {
            console.log('Logged out successfully');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);
if (dropdownLogout) dropdownLogout.addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pageContents = document.querySelectorAll('.page-content');
const pageTitle = document.getElementById('pageTitle');

const pageTitles = {
    dashboard: 'Dashboard',
    profile: 'My Profile',
    transactions: 'All Transactions',
    settings: 'Settings'
};

navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        navItems.forEach(nav => nav.classList.remove('active'));
        pageContents.forEach(page => page.classList.remove('active'));
        
        this.classList.add('active');
        const page = this.getAttribute('data-page');
        const pageElement = document.getElementById(`${page}-page`);
        
        if (pageElement) {
            pageElement.classList.add('active');
            pageTitle.textContent = pageTitles[page] || 'Dashboard';
        }
    });
});

// Dropdown profile menu
const userAvatar = document.querySelector('.user-avatar');
const dropdownMenu = document.querySelector('.dropdown-menu');

if (userAvatar && dropdownMenu) {
    userAvatar.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!document.querySelector('.user-menu').contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });
}

// Profile dropdown navigation
const profileDropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item[data-page]');

profileDropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        navItems.forEach(nav => nav.classList.remove('active'));
        pageContents.forEach(page => page.classList.remove('active'));
        
        const page = this.getAttribute('data-page');
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem) navItem.classList.add('active');
        
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
            pageTitle.textContent = pageTitles[page] || 'Dashboard';
        }
        
        dropdownMenu.classList.remove('active');
    });
});

// Balance visibility toggle
const toggleBalanceBtn = document.getElementById('toggleBalance');
const balanceAmount = document.getElementById('balanceAmount');
let balanceVisible = true;

if (toggleBalanceBtn && balanceAmount) {
    toggleBalanceBtn.addEventListener('click', function() {
        balanceVisible = !balanceVisible;
        if (balanceVisible) {
            loadWalletBalance();
            this.innerHTML = '<i class="fas fa-eye"></i>';
        } else {
            const amount = balanceAmount.querySelector('.amount');
            if (amount) amount.textContent = '••••••';
            this.innerHTML = '<i class="fas fa-eye-slash"></i>';
        }
    });
}

// Sidebar toggle
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');

if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', function() {
        sidebar.style.width = sidebar.style.width === '70px' ? '280px' : '70px';
    });
}

// Chart initialization (Spending Overview)
const canvasElement = document.getElementById('spendingChart');

if (canvasElement) {
    const ctx = canvasElement.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Groceries', 'Entertainment', 'Utilities', 'Dining', 'Others'],
            datasets: [{
                data: [350, 280, 200, 150, 200],
                backgroundColor: [
                    '#0D8ABC',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        }
    });
}

// Update last updated time
function updateLastUpdate() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        lastUpdateElement.textContent = `today at ${hours}:${minutes}`;
    }
}

updateLastUpdate();
setInterval(updateLastUpdate, 60000);

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Transaction filtering
const filterInputs = document.querySelectorAll('.filter-input, .filter-select');

if (filterInputs.length > 0) {
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            console.log('Filter applied:', this.value);
        });
    });
}

// Notification click
const notificationBtn = document.querySelector('.notification-btn');
if (notificationBtn) {
    notificationBtn.addEventListener('click', function() {
        alert('You have 3 new notifications!');
    });
}

// Animation on scroll
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 0.5s ease forwards';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });
}

console.log('FinanceApp with Supabase loaded successfully');