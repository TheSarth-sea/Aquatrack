// ===== WATER TRACKER APP =====

// App State
let waterEntries = [];
let settings = {
    dailyGoal: 2000,
    theme: 'light',
    notifications: true,
    reminderTime: '09:00'
};
let charts = {};

// Initialize App
function initApp() {
    console.log('🚀 Initializing AquaTrack...');
    
    // Load data from localStorage
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initCharts();
    
    // Update UI
    updateDashboard();
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('appContainer').style.opacity = '1';
        }, 500);
    }, 1500);
    
    // Set current date
    updateCurrentDate();
    
    // Set current time for time input
    setCurrentTime();
}

// ===== DATA MANAGEMENT =====

function loadData() {
    // Load water entries
    const savedEntries = localStorage.getItem('waterEntries');
    if (savedEntries) {
        waterEntries = JSON.parse(savedEntries);
    }
    
    // Load settings
    const savedSettings = localStorage.getItem('waterTrackerSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Update UI with loaded data
    document.getElementById('dailyGoalInput').value = settings.dailyGoal;
    document.getElementById('reminderTime').value = settings.reminderTime;
    document.getElementById('notificationsToggle').checked = settings.notifications;
    document.getElementById('dailyGoal').textContent = `${settings.dailyGoal} ml`;
    document.getElementById('goalAmount').textContent = `${settings.dailyGoal} ml`;
    
    console.log('📊 Loaded data:', { entries: waterEntries.length, settings });
}

function saveData() {
    localStorage.setItem('waterEntries', JSON.stringify(waterEntries));
    localStorage.setItem('waterTrackerSettings', JSON.stringify(settings));
    console.log('💾 Data saved');
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
        });
    });
    
    // Quick add buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            document.getElementById('amountSlider').value = amount;
            document.getElementById('amountDisplay').textContent = `${amount} ml`;
            updatePreview();
        });
    });
    
    // Preset amount buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            document.getElementById('amountSlider').value = amount;
            document.getElementById('amountDisplay').textContent = `${amount} ml`;
            updatePreview();
        });
    });
    
    // Amount slider
    document.getElementById('amountSlider').addEventListener('input', function() {
        document.getElementById('amountDisplay').textContent = `${this.value} ml`;
        updatePreview();
    });
    
    // Purpose select
    document.getElementById('purposeSelect').addEventListener('change', updatePreview);
    
    // Time input
    document.getElementById('timeInput').addEventListener('change', updatePreview);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            settings.theme = this.dataset.theme;
            document.documentElement.setAttribute('data-theme', settings.theme);
            saveData();
        });
    });
    
    // Floating add button
    document.getElementById('floatingAddBtn').addEventListener('click', function() {
        showPage('add-water');
    });
}

// ===== PAGE MANAGEMENT =====

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName).classList.add('active');
    
    // Activate corresponding nav button
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Update page-specific content
    switch(pageName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'analytics':
            updateAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== DASHBOARD FUNCTIONS =====

function updateDashboard() {
    const today = getTodayDate();
    const todayEntries = waterEntries.filter(entry => entry.date === today);
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Update stats
    document.getElementById('todayTotal').textContent = `${todayTotal} ml`;
    document.getElementById('currentAmount').textContent = `${todayTotal} ml`;
    
    // Update progress
    const progressPercent = Math.min(100, (todayTotal / settings.dailyGoal) * 100);
    document.getElementById('progressPercent').textContent = `${Math.round(progressPercent)}%`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    
    // Update recent entries
    updateRecentEntries(todayEntries);
    
    // Update charts
    updateDashboardCharts(todayEntries);
    
    // Check for notifications
    checkNotifications(todayTotal, progressPercent);
}

function updateRecentEntries(entries) {
    const entriesList = document.getElementById('entriesList');
    
    if (entries.length === 0) {
        entriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tint"></i>
                <p>No entries yet. Add your first water entry!</p>
            </div>
        `;
        return;
    }
    
    // Sort by time (newest first)
    const sortedEntries = [...entries].sort((a, b) => b.time.localeCompare(a.time));
    
    entriesList.innerHTML = sortedEntries.slice(0, 5).map(entry => `
        <div class="entry-item">
            <div class="entry-time">${formatTime(entry.time)}</div>
            <div class="entry-purpose">${entry.purpose}</div>
            <div class="entry-amount">${entry.amount} ml</div>
            <button class="entry-delete" onclick="deleteEntry('${entry.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// ===== ADD WATER FUNCTIONS =====

function addWaterEntry() {
    const amount = parseInt(document.getElementById('amountSlider').value);
    const purpose = document.getElementById('purposeSelect').value;
    const purposeText = document.getElementById('purposeSelect').options[document.getElementById('purposeSelect').selectedIndex].text;
    const time = document.getElementById('timeInput').value || getCurrentTime();
    const notes = document.getElementById('notesInput').value;
    
    // Validate
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    // Create entry
    const entry = {
        id: Date.now().toString(),
        date: getTodayDate(),
        time: time,
        amount: amount,
        purpose: purpose,
        purposeText: purposeText,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Add to entries
    waterEntries.push(entry);
    
    // Save data
    saveData();
    
    // Update UI
    updateDashboard();
    updatePreview();
    
    // Show success message
    showNotification(`✅ Added ${amount} ml for ${purposeText}`, 'success');
    
    // Animate button
    const btn = document.querySelector('.btn-add-water');
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Water Entry';
        btn.style.background = '';
    }, 2000);
    
    // Reset form after delay
    setTimeout(() => {
        document.getElementById('amountSlider').value = 500;
        document.getElementById('amountDisplay').textContent = '500 ml';
        document.getElementById('notesInput').value = '';
        updatePreview();
    }, 1000);
}

function updatePreview() {
    const amount = document.getElementById('amountSlider').value;
    const purpose = document.getElementById('purposeSelect').options[document.getElementById('purposeSelect').selectedIndex].text;
    const time = document.getElementById('timeInput').value;
    
    document.getElementById('previewAmount').textContent = `${amount} ml`;
    document.getElementById('previewPurpose').textContent = purpose;
    document.getElementById('previewTime').textContent = time || 'Current Time';
}

function setCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('timeInput').value = `${hours}:${minutes}`;
    updatePreview();
}

// ===== ANALYTICS FUNCTIONS =====

function updateAnalytics() {
    const period = parseInt(document.getElementById('periodSelect').value);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    // Filter entries for period
    const periodEntries = waterEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });
    
    // Calculate stats
    const totalWater = periodEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const avgDaily = periodEntries.length > 0 ? Math.round(totalWater / period) : 0;
    const goalDays = periodEntries.filter(entry => entry.amount >= settings.dailyGoal).length;
    const waterSaved = Math.max(0, (settings.dailyGoal * period) - totalWater) / 1000;
    
    // Update stats
    document.getElementById('avgDaily').textContent = `${avgDaily} ml`;
    document.getElementById('totalTracked').textContent = `${(totalWater / 1000).toFixed(1)} L`;
    document.getElementById('goalDays').textContent = goalDays;
    document.getElementById('waterSaved').textContent = `${waterSaved.toFixed(1)} L`;
    
    // Update charts
    updateAnalyticsCharts(periodEntries, period);
}

// ===== SETTINGS FUNCTIONS =====

function loadSettings() {
    // Settings are loaded in loadData()
    // Just update the UI if needed
}

function saveDailyGoal() {
    const newGoal = parseInt(document.getElementById('dailyGoalInput').value);
    if (newGoal >= 500 && newGoal <= 10000) {
        settings.dailyGoal = newGoal;
        saveData();
        showNotification('Daily goal updated!', 'success');
        
        // Update UI
        document.getElementById('dailyGoal').textContent = `${newGoal} ml`;
        document.getElementById('goalAmount').textContent = `${newGoal} ml`;
        updateDashboard();
    } else {
        showNotification('Please enter a valid goal (500-10000 ml)', 'error');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    settings.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    saveData();
    
    // Update theme button icon
    const icon = document.querySelector('#themeToggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== CHART FUNCTIONS =====

function initCharts() {
    // Pie Chart for Today's Breakdown
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    charts.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Drinking', 'Cooking', 'Bathing', 'Washing', 'Gardening', 'Other'],
            datasets: [{
                data: [40, 20, 15, 10, 5, 10],
                backgroundColor: [
                    '#0ea5e9',
                    '#10b981',
                    '#f59e0b',
                    '#8b5cf6',
                    '#84cc16',
                    '#64748b'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Line Chart for Weekly Trend
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    charts.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Water (ml)',
                data: [1800, 2200, 1900, 2500, 2100, 2300, 2000],
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Analytics Chart
    const analyticsCtx = document.getElementById('analyticsChart').getContext('2d');
    charts.analyticsChart = new Chart(analyticsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Water Consumption',
                data: [],
                backgroundColor: '#0ea5e9'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Distribution Chart
    const distributionCtx = document.getElementById('distributionChart').getContext('2d');
    charts.distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: []
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateDashboardCharts(todayEntries) {
    if (!charts.pieChart || !charts.lineChart) return;
    
    // Update pie chart with today's data
    const purposeData = {};
    todayEntries.forEach(entry => {
        purposeData[entry.purpose] = (purposeData[entry.purpose] || 0) + entry.amount;
    });
    
    const purposes = ['drinking', 'cooking', 'bathing', 'washing', 'gardening', 'other'];
    const data = purposes.map(p => purposeData[p] || 0);
    
    charts.pieChart.data.datasets[0].data = data;
    charts.pieChart.update();
}

function updateAnalyticsCharts(entries, period) {
    if (!charts.analyticsChart || !charts.distributionChart) return;
    
    // Group by date for line chart
    const dailyData = {};
    entries.forEach(entry => {
        if (!dailyData[entry.date]) {
            dailyData[entry.date] = 0;
        }
        dailyData[entry.date] += entry.amount;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dailyData).sort();
    const sortedData = sortedDates.map(date => dailyData[date]);
    
    // Update analytics chart
    charts.analyticsChart.data.labels = sortedDates.map(date => 
        new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    );
    charts.analyticsChart.data.datasets[0].data = sortedData;
    charts.analyticsChart.update();
    
    // Update distribution chart
    const purposeData = {};
    entries.forEach(entry => {
        purposeData[entry.purpose] = (purposeData[entry.purpose] || 0) + entry.amount;
    });
    
    const purposes = Object.keys(purposeData);
    const distributionData = purposes.map(p => purposeData[p]);
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#84cc16', '#64748b'];
    
    charts.distributionChart.data.labels = purposes.map(p => 
        p.charAt(0).toUpperCase() + p.slice(1)
    );
    charts.distributionChart.data.datasets[0].data = distributionData;
    charts.distributionChart.data.datasets[0].backgroundColor = colors.slice(0, purposes.length);
    charts.distributionChart.update();
}

// ===== UTILITY FUNCTIONS =====

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    notificationArea.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function checkNotifications(todayTotal, progressPercent) {
    if (!settings.notifications) return;
    
    // Check if goal is reached
    if (progressPercent >= 100) {
        showNotification('🎉 Congratulations! Daily goal achieved!', 'success');
    }
    // Check if approaching goal
    else if (progressPercent >= 80) {
        showNotification(`⚠️ Almost there! ${settings.dailyGoal - todayTotal}ml to go`, 'warning');
    }
}

function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    waterEntries = waterEntries.filter(entry => entry.id !== entryId);
    saveData();
    updateDashboard();
    showNotification('Entry deleted', 'success');
}

function exportData() {
    const data = {
        waterEntries,
        settings,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `water-tracker-${getTodayDate()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Data exported successfully!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.waterEntries && data.settings) {
                    waterEntries = data.waterEntries;
                    settings = data.settings;
                    saveData();
                    loadData();
                    updateDashboard();
                    showNotification('Data imported successfully!', 'success');
                } else {
                    showNotification('Invalid data format', 'error');
                }
            } catch (error) {
                showNotification('Error reading file', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearData() {
    if (!confirm('Are you sure you want to clear ALL data? This cannot be undone!')) return;
    
    waterEntries = [];
    settings = {
        dailyGoal: 2000,
        theme: 'light',
        notifications: true,
        reminderTime: '09:00'
    };
    
    saveData();
    loadData();
    updateDashboard();
    
    showNotification('All data cleared', 'success');
}

// ===== INITIALIZE APP =====

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make functions available globally
window.addWaterEntry = addWaterEntry;
window.setCurrentTime = setCurrentTime;
window.showPage = showPage;
window.saveDailyGoal = saveDailyGoal;
window.toggleTheme = toggleTheme;
window.exportData = exportData;
window.importData = importData;
window.clearData = clearData;
window.deleteEntry = deleteEntry;