/**
 * 3D MONOLITH AI - ПОЛНЫЙ ДОСТУП КО ВСЕЙ СИСТЕМЕ
 * Файл: ai-studio-access.js
 */

window.AI_STUDIO_ACCESS = {
    getPrinters: function() {
        if (window.PRINTER_FARM && Array.isArray(window.PRINTER_FARM)) return window.PRINTER_FARM;
        if (window.PRINTER_SYSTEM && typeof window.PRINTER_SYSTEM.getAllPrinters === 'function') return window.PRINTER_SYSTEM.getAllPrinters();
        if (window.printers && Array.isArray(window.printers)) return window.printers;
        for (const key in window) { if (key.includes('PRINTER') && Array.isArray(window[key])) return window[key]; }
        return [];
    },
    
    getPrinterCount: function() {
        const printers = this.getPrinters();
        return {
            total: printers.length,
            fdm: printers.filter(p => p.technology === 'FDM').length,
            sla: printers.filter(p => p.technology === 'SLA').length,
            active: printers.filter(p => p.state === 'active').length,
            printing: printers.filter(p => p.state === 'printing').length,
            maintenance: printers.filter(p => p.state === 'maintenance').length,
            broken: printers.filter(p => p.state === 'broken').length
        };
    },
    
    getMaterials: function() {
        if (window.MATERIALS_DB && Array.isArray(window.MATERIALS_DB)) return window.MATERIALS_DB;
        if (window.materials && Array.isArray(window.materials)) return window.materials;
        for (const key in window) { if (key.includes('MATERIAL') && Array.isArray(window[key])) return window[key]; }
        return [];
    },
    
    getMaterialStock: function() {
        const materials = this.getMaterials();
        return materials.map(m => ({
            name: m.name || m.type || 'Неизвестно',
            type: m.type || 'N/A',
            stock: m.stock || m.weight || m.remaining || 0,
            price: m.price || m.cost || 0,
            totalValue: (m.stock || 0) * (m.price || 0) / 1000
        }));
    },
    
    getLowStockMaterials: function(threshold = 500) {
        return this.getMaterials().filter(m => (m.stock || 0) < threshold);
    },
    
    getTotalStockValue: function() {
        return this.getMaterialStock().reduce((sum, m) => sum + m.totalValue, 0);
    },
    
    getOrders: function() {
        if (window.CRM_ORDERS && Array.isArray(window.CRM_ORDERS)) return window.CRM_ORDERS;
        if (window.ORDERS_DB && Array.isArray(window.ORDERS_DB)) return window.ORDERS_DB;
        if (window.orders && Array.isArray(window.orders)) return window.orders;
        return [];
    },
    
    getOrderStats: function() {
        const orders = this.getOrders();
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending' || o.status === 'new').length,
            inProgress: orders.filter(o => o.status === 'in_progress').length,
            completed: orders.filter(o => o.status === 'completed').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price || 0), 0)
        };
    },
    
    getClients: function() {
        if (window.CLIENTS_DB && Array.isArray(window.CLIENTS_DB)) return window.CLIENTS_DB;
        if (window.clients && Array.isArray(window.clients)) return window.clients;
        return [];
    },
    
    getFinances: function() {
        if (window.FINANCE_DB) return window.FINANCE_DB;
        return { income: [], expenses: [] };
    },
    
    getFinanceStats: function() {
        const finances = this.getFinances();
        const income = finances.income || [];
        const expenses = finances.expenses || [];
        return {
            totalIncome: income.reduce((sum, t) => sum + (t.amount || 0), 0),
            totalExpenses: expenses.reduce((sum, t) => sum + (t.amount || 0), 0),
            profit: income.reduce((sum, t) => sum + (t.amount || 0), 0) - expenses.reduce((sum, t) => sum + (t.amount || 0), 0)
        };
    },
    
    getBox: function() {
        if (window.BOX_ORDERS && Array.isArray(window.BOX_ORDERS)) return window.BOX_ORDERS;
        if (window.boxOrders && Array.isArray(window.boxOrders)) return window.boxOrders;
        return [];
    },
    
    getBoxTotal: function() {
        return this.getBox().reduce((sum, item) => sum + (item.price || 0), 0);
    },
    
    getMargin: function() {
        if (window.USER_CONFIG && window.USER_CONFIG.margin) return window.USER_CONFIG.margin;
        return 1.15;
    },
    
    setMargin: function(value) {
        let marginValue = value <= 1 ? 1 + (value / 100) : value;
        if (!window.USER_CONFIG) window.USER_CONFIG = {};
        window.USER_CONFIG.margin = marginValue;
        localStorage.setItem('mon_user_config', JSON.stringify(window.USER_CONFIG));
        return marginValue;
    },
    
    getMarginPercent: function() {
        return Math.round((this.getMargin() - 1) * 100);
    },
    
    getStudioSummary: function() {
        return {
            printers: this.getPrinterCount(),
            orders: this.getOrderStats(),
            finances: this.getFinanceStats(),
            materials: { total: this.getMaterials().length, totalValue: this.getTotalStockValue(), lowStock: this.getLowStockMaterials().length },
            box: { items: this.getBox().length, total: this.getBoxTotal() },
            alerts: { lowStock: this.getLowStockMaterials().length, brokenPrinters: this.getPrinterCount().broken, pendingOrders: this.getOrderStats().pending }
        };
    }
};

console.log('✅ AI_STUDIO_ACCESS загружен');
