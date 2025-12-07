// AI Event Architect - Vendors Module (Vendor Management with AI Recommendations)

import { Utils } from './utils.js';
import { planner } from './planner.js';
import { uiManager } from './ui.js';

export class VendorManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupVendorsPanel();
        this.renderVendors();
        this.setupEventListeners();

        // Listen for panel shown event
        document.addEventListener('panelShown', (e) => {
            if (e.detail.panelId === 'vendors') {
                this.renderVendors();
            }
        });
        // Re-render when an event is loaded from server
        document.addEventListener('eventLoaded', () => {
            this.renderVendors();
        });
    }

    setupVendorsPanel() {
        const container = document.getElementById('vendors-content');
        if (!container) return;

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Vendor Management</h3>
                <div class="d-flex gap-2">
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" id="vendors-mode-auto">AI Recommendations</button>
                        <button class="btn btn-outline-secondary btn-sm" id="vendors-mode-manual">Manual Vendors</button>
                    </div>
                    <button class="btn btn-outline-success btn-sm" data-generate-component="vendors">Regenerate</button>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-info btn-sm active" id="filter-all-vendors">All Vendors</button>
                    <button class="btn btn-outline-info btn-sm" id="filter-booked">Booked</button>
                    <button class="btn btn-outline-info btn-sm" id="filter-pending">Pending</button>
                </div>
                <button class="btn btn-primary btn-sm" id="add-vendor">
                    <i class="fas fa-plus me-2"></i>Add Vendor
                </button>
            </div>

            <div id="vendors-container">
                <!-- Vendors will be rendered here -->
            </div>
        `;

        this.setMode('auto');
        this.currentFilter = 'all';
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('vendors-mode-auto')?.addEventListener('click', () => {
            this.setMode('auto');
        });

        document.getElementById('vendors-mode-manual')?.addEventListener('click', () => {
            this.setMode('manual');
        });

        // Filter switching
        document.getElementById('filter-all-vendors')?.addEventListener('click', () => {
            this.setFilter('all');
        });

        document.getElementById('filter-booked')?.addEventListener('click', () => {
            this.setFilter('booked');
        });

        document.getElementById('filter-pending')?.addEventListener('click', () => {
            this.setFilter('pending');
        });

        // Add new vendor
        document.getElementById('add-vendor')?.addEventListener('click', () => {
            this.addNewVendor();
        });

        // Global save event
        document.addEventListener('globalSave', () => {
            this.saveVendors();
        });
    }

    setMode(mode) {
        const autoBtn = document.getElementById('vendors-mode-auto');
        const manualBtn = document.getElementById('vendors-mode-manual');

        if (mode === 'auto') {
            autoBtn.classList.add('active');
            manualBtn.classList.remove('active');
            this.generateVendorRecommendations();
        } else {
            manualBtn.classList.add('active');
            autoBtn.classList.remove('active');
            this.renderVendors();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        const allBtn = document.getElementById('filter-all-vendors');
        const bookedBtn = document.getElementById('filter-booked');
        const pendingBtn = document.getElementById('filter-pending');

        [allBtn, bookedBtn, pendingBtn].forEach(btn => btn.classList.remove('active'));

        if (filter === 'all') allBtn.classList.add('active');
        else if (filter === 'booked') bookedBtn.classList.add('active');
        else if (filter === 'pending') pendingBtn.classList.add('active');

        this.renderVendors();
    }

    generateVendorRecommendations() {
        const basics = planner.eventState.basics;
        const eventType = basics.type || 'general';
        const attendeeCount = basics.attendees || 50;
        const budget = planner.eventState.budget;

        // Base vendor recommendations by event type
        const vendorTemplates = {
            'wedding': [
                {
                    category: 'Venue',
                    name: 'Grand Ballroom Venue',
                    type: 'Wedding Venue',
                    rating: 4.8,
                    priceRange: '$5000-$15000',
                    contact: 'info@grandballroom.com',
                    phone: '(555) 123-4567',
                    status: 'pending',
                    notes: 'Beautiful space for 200 guests'
                },
                {
                    category: 'Catering',
                    name: 'Elegant Cuisine',
                    type: 'Caterer',
                    rating: 4.9,
                    priceRange: '$75-$150/person',
                    contact: 'bookings@elegantcuisine.com',
                    phone: '(555) 234-5678',
                    status: 'pending',
                    notes: 'Award-winning wedding menus'
                },
                {
                    category: 'Photography',
                    name: 'Forever Moments Photography',
                    type: 'Photographer',
                    rating: 4.7,
                    priceRange: '$2000-$5000',
                    contact: 'hello@forevermoments.com',
                    phone: '(555) 345-6789',
                    status: 'pending',
                    notes: 'Documentary style photography'
                },
                {
                    category: 'Music',
                    name: 'Harmony Live Band',
                    type: 'Entertainment',
                    rating: 4.6,
                    priceRange: '$1500-$3000',
                    contact: 'book@harmonylive.com',
                    phone: '(555) 456-7890',
                    status: 'pending',
                    notes: 'Live band for ceremony and reception'
                },
                {
                    category: 'Florist',
                    name: 'Bloom & Blossom',
                    type: 'Florist',
                    rating: 4.5,
                    priceRange: '$800-$2000',
                    contact: 'orders@bloomblossom.com',
                    phone: '(555) 567-8901',
                    status: 'pending',
                    notes: 'Custom floral arrangements'
                }
            ],
            'corporate conference': [
                {
                    category: 'Venue',
                    name: 'Tech Conference Center',
                    type: 'Conference Venue',
                    rating: 4.7,
                    priceRange: '$3000-$8000',
                    contact: 'events@techcenter.com',
                    phone: '(555) 123-4567',
                    status: 'pending',
                    notes: 'Modern facility with AV equipment'
                },
                {
                    category: 'Catering',
                    name: 'Corporate Catering Co',
                    type: 'Caterer',
                    rating: 4.8,
                    priceRange: '$45-$85/person',
                    contact: 'corporate@catco.com',
                    phone: '(555) 234-5678',
                    status: 'pending',
                    notes: 'Business lunch and coffee service'
                },
                {
                    category: 'AV',
                    name: 'Pro AV Solutions',
                    type: 'AV Equipment',
                    rating: 4.6,
                    priceRange: '$1000-$3000',
                    contact: 'rentals@proav.com',
                    phone: '(555) 345-6789',
                    status: 'pending',
                    notes: 'Professional audio/video equipment'
                },
                {
                    category: 'Registration',
                    name: 'EventCheck',
                    type: 'Registration System',
                    rating: 4.5,
                    priceRange: '$500-$1500',
                    contact: 'support@eventcheck.com',
                    phone: '(555) 456-7890',
                    status: 'pending',
                    notes: 'Online registration and check-in'
                }
            ],
            'birthday party': [
                {
                    category: 'Venue',
                    name: 'Fun Zone Party Center',
                    type: 'Party Venue',
                    rating: 4.4,
                    priceRange: '$500-$1500',
                    contact: 'parties@funzone.com',
                    phone: '(555) 123-4567',
                    status: 'pending',
                    notes: 'Games, activities, and party rooms'
                },
                {
                    category: 'Catering',
                    name: 'Kids Cuisine',
                    type: 'Caterer',
                    rating: 4.6,
                    priceRange: '$15-$35/person',
                    contact: 'orders@kidscuisine.com',
                    phone: '(555) 234-5678',
                    status: 'pending',
                    notes: 'Kid-friendly party food'
                },
                {
                    category: 'Entertainment',
                    name: 'Magic Mike Entertainment',
                    type: 'Entertainer',
                    rating: 4.8,
                    priceRange: '$300-$600',
                    contact: 'book@magicmike.com',
                    phone: '(555) 345-6789',
                    status: 'pending',
                    notes: 'Magician and party games'
                }
            ],
            'general': [
                {
                    category: 'Venue',
                    name: 'Community Center',
                    type: 'Event Venue',
                    rating: 4.2,
                    priceRange: '$500-$2000',
                    contact: 'rentals@communitycenter.com',
                    phone: '(555) 123-4567',
                    status: 'pending',
                    notes: 'Flexible space for various events'
                },
                {
                    category: 'Catering',
                    name: 'Local Catering',
                    type: 'Caterer',
                    rating: 4.3,
                    priceRange: '$25-$75/person',
                    contact: 'events@localcatering.com',
                    phone: '(555) 234-5678',
                    status: 'pending',
                    notes: 'Local cuisine and service'
                }
            ]
        };

        const recommendations = vendorTemplates[eventType.toLowerCase()] || vendorTemplates.general;

        // Clear existing vendors
        planner.eventState.vendors = [];

        // Add recommended vendors
        recommendations.forEach(vendor => {
            planner.addVendor(vendor);
        });

        this.renderVendors();
        Utils.showToast('AI vendor recommendations generated!', 'success');
    }

    renderVendors() {
        const container = document.getElementById('vendors-container');
        if (!container) return;

        const vendors = planner.eventState.vendors;
        const filteredVendors = this.filterVendors(vendors);

        container.innerHTML = '';

        if (filteredVendors.length === 0) {
            container.innerHTML = '<div class="text-center text-muted mt-4"><i class="fas fa-store fa-3x mb-3"></i><p>No vendors found</p></div>';
            return;
        }

        // Group by category
        const groupedVendors = this.groupVendorsByCategory(filteredVendors);

        Object.entries(groupedVendors).forEach(([category, categoryVendors]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-4';
            categoryDiv.innerHTML = `<h5 class="mb-3">${category}</h5>`;

            const vendorList = document.createElement('div');
            vendorList.className = 'row';

            categoryVendors.forEach(vendor => {
                const vendorCard = document.createElement('div');
                vendorCard.className = 'col-md-6 mb-3';
                vendorCard.innerHTML = `
                    <div class="card h-100 ${vendor.status === 'booked' ? 'border-success' : 'border-warning'}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">${vendor.name}</h6>
                                <span class="badge ${vendor.status === 'booked' ? 'bg-success' : 'bg-warning'}">${vendor.status}</span>
                            </div>
                            <p class="card-text small text-muted mb-2">${vendor.type}</p>
                            <div class="mb-2">
                                <small class="text-muted">Rating: ${'★'.repeat(Math.floor(vendor.rating))}${'☆'.repeat(5-Math.floor(vendor.rating))} (${vendor.rating})</small>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">Price: ${vendor.priceRange}</small>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">
                                    <i class="fas fa-phone me-1"></i>${vendor.phone}<br>
                                    <i class="fas fa-envelope me-1"></i>${vendor.contact}
                                </small>
                            </div>
                            ${vendor.notes ? `<p class="card-text small mb-3">${vendor.notes}</p>` : ''}
                            <div class="d-flex gap-1">
                                <button class="btn btn-outline-primary btn-sm flex-fill" data-action="edit" data-vendor-id="${vendor.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn ${vendor.status === 'booked' ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm flex-fill" data-action="toggle-status" data-vendor-id="${vendor.id}">
                                    ${vendor.status === 'booked' ? 'Unbook' : 'Book'}
                                </button>
                                <button class="btn btn-outline-danger btn-sm flex-fill" data-action="delete" data-vendor-id="${vendor.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                vendorList.appendChild(vendorCard);
            });

            categoryDiv.appendChild(vendorList);
            container.appendChild(categoryDiv);
        });

        this.setupVendorEventListeners();
    }

    filterVendors(vendors) {
        if (this.currentFilter === 'all') return vendors;
        if (this.currentFilter === 'booked') return vendors.filter(vendor => vendor.status === 'booked');
        if (this.currentFilter === 'pending') return vendors.filter(vendor => vendor.status === 'pending');
        return vendors;
    }

    groupVendorsByCategory(vendors) {
        const grouped = {};
        vendors.forEach(vendor => {
            const category = vendor.category || 'General';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(vendor);
        });
        return grouped;
    }

    setupVendorEventListeners() {
        // Remove existing listeners to prevent duplicates
        const container = document.getElementById('vendors-container');
        if (container) {
            container.removeEventListener('click', this.handleVendorClick);
            container.addEventListener('click', this.handleVendorClick.bind(this));
        }
    }

    handleVendorClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const vendorId = target.getAttribute('data-vendor-id');
        const action = target.getAttribute('data-action');

        if (action === 'edit') {
            this.editVendor(vendorId);
        } else if (action === 'toggle-status') {
            this.toggleVendorStatus(vendorId);
        } else if (action === 'delete') {
            this.deleteVendor(vendorId);
        }
    }

    toggleVendorStatus(vendorId) {
        const vendor = planner.eventState.vendors.find(v => v.id === vendorId);
        if (vendor) {
            const newStatus = vendor.status === 'booked' ? 'pending' : 'booked';
            planner.updateVendor(vendorId, { status: newStatus });
            this.renderVendors();
        }
    }

    addNewVendor() {
        const vendor = {
            name: 'New Vendor',
            type: 'Service Provider',
            category: 'General',
            rating: 4.0,
            priceRange: '$0-$1000',
            contact: 'contact@example.com',
            phone: '(555) 000-0000',
            status: 'pending',
            notes: 'Vendor details'
        };
        planner.addVendor(vendor);
        this.renderVendors();
    }

    editVendor(vendorId) {
        const vendor = planner.eventState.vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        // Simple inline editing - in a real app, use a modal
        const newName = prompt('Edit vendor name:', vendor.name);
        if (newName !== null) {
            planner.updateVendor(vendorId, { name: newName });
            this.renderVendors();
        }
    }

    deleteVendor(vendorId) {
        const vendor = planner.eventState.vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        if (confirm(`Delete "${vendor.name}"?`)) {
            planner.removeVendor(vendorId);
            this.renderVendors();
        }
    }

    saveVendors() {
        // Vendors are auto-saved via planner
        Utils.showToast('Vendors saved!', 'success');
    }
}

// Global instance
export const vendorManager = new VendorManager();