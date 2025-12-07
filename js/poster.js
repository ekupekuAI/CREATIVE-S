// ===== Poster Designer Pro - Professional Design Editor JavaScript =====

class PosterDesignerPro {
    }
    /* TEMP: Removing malformed in-class top-level code. Will be re-added below class properly.
    this.loadTemplates();
    this.loadAssets();
    this.initializeZoomControls();
    this.initializeRulers();
    this.initializeGuides();
    this.initializeContextMenu();
    this.initializeModals();
    this.loadProject();

    // Basic assets population (placeholders; can be extended to load from /assets/poster/*)
    const assetTextStyles = document.getElementById('assetTextStyles');
    ['Heading','Subheading','Body'].forEach(n=>{ const chip=document.createElement('div'); chip.className='pdp-chip'; chip.textContent=n; chip.draggable=true; chip.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', n)); assetTextStyles.appendChild(chip); });

    // Template loader
    const templateGrid = document.getElementById('templateGrid');
    async function fetchJSON(path){ const r=await fetch(path); if(!r.ok) throw new Error('Failed '+path); return r.json(); }
    async function loadTemplatesList(){
        const entries = [ ... ];
        templateGrid.innerHTML='';
        entries.forEach(t=>{ const card=document.createElement('div'); card.className='pdp-card'; card.draggable=true; card.innerHTML = `<div class="title">${t.name}</div>`; card.addEventListener('click', ()=> applyTemplate(t.file)); templateGrid.appendChild(card); });
    }
    async function applyTemplate(path){
        const entries = [
            { name:'TechFest 2025', file:'/assets/poster/templates/event-techfest.json', preview:'#0ea5e9' },
            { name:'Summer Fest', file:'/assets/poster/templates/event-festival.json', preview:'#f59e0b' },
            { name:'Night Festival', file:'/assets/poster/templates/festival-night.json', preview:'#0ea5e9' },
            { name:'Mega Sale', file:'/assets/poster/templates/marketing-sale.json', preview:'#ef4444' },
            { name:'Food Promo', file:'/assets/poster/templates/marketing-food.json', preview:'#f59e0b' },
            { name:'Flash Sale', file:'/assets/poster/templates/sales-flash.json', preview:'#3b82f6' },
            { name:'Business Flyer', file:'/assets/poster/templates/business-flyer.json', preview:'#ffffff' },
            { name:'Business Minimal', file:'/assets/poster/templates/business-minimal.json', preview:'#f3f4f6' },
            { name:'Magazine Cover', file:'/assets/poster/templates/magazine-cover.json', preview:'#ffffff' },
            { name:'Fashion Lookbook', file:'/assets/poster/templates/fashion-lookbook.json', preview:'#f9fafb' }
        ];
        templateGrid.innerHTML='';
        entries.forEach(t=>{
            const card=document.createElement('div'); card.className='pdp-card'; card.draggable=true;
            card.innerHTML = `<div class="title">${t.name}</div>`;
            card.addEventListener('click', ()=> applyTemplate(t.file));
            templateGrid.appendChild(card);
        });
    }
    async function applyTemplate(path){
        try{
            const tpl = await fetchJSON(path);
            canvas.clear();
            canvas.setWidth((tpl.size && tpl.size.width) || 1200);
            canvas.setHeight((tpl.size && tpl.size.height) || 1600);
            if(tpl.background){
                if(tpl.background.type==='solid'){ canvas.setBackgroundColor(tpl.background.color || '#ffffff', canvas.renderAll.bind(canvas)); }
                else if(tpl.background.type==='gradient'){
                    const sizeW = (tpl.size && tpl.size.width) || 1200;
                    const sizeH = (tpl.size && tpl.size.height) || 1600;
                    const grad = new fabric.Gradient({ type:'linear', gradientUnits:'pixels', coords:{ x1:0, y1:0, x2:sizeW, y2:sizeH }, colorStops:[ { offset:0, color: (tpl.background.colors && tpl.background.colors[0])||'#fff' }, { offset:1, color: (tpl.background.colors && tpl.background.colors[1])||'#eee' } ] });
                    const bgRect = new fabric.Rect({ left:0, top:0, width:sizeW, height:sizeH, selectable:false });
                    bgRect.set('fill', grad); canvas.add(bgRect);
                }
            }
            for(const layer of (tpl.layers||[])){
                await addLayerFromSpec(layer);
            }
            canvas.renderAll(); saveState();
        }catch(e){ console.error('Template load failed', e); }
    }
    async function addLayerFromSpec(layer){
        if(layer.type==='rect'){
                        this.templates = this.initializeTemplates ? this.initializeTemplates() : [];
                        this.assets = this.initializeAssets ? this.initializeAssets() : {};
            canvas.add(new fabric.Rect({ left:layer.left, top:layer.top, width:layer.width, height:layer.height, fill:layer.fill||'#1f2937', rx:layer.rx||0 }));
        } else if(layer.type==='text'){
            canvas.add(new fabric.IText(layer.text||'', { left:layer.left, top:layer.top, fontSize:layer.fontSize||32, fontWeight:layer.fontWeight||'normal', fill:layer.fill||'#000' }));
                        this.init();
            // Simple emulation: large text, later replaced with curved plugin
    
                    async fetchJSON(path){
                        const r = await fetch(path);
                        if(!r.ok) throw new Error('Failed '+path);
                        return r.json();
                    }

                    loadTemplatesList(){
                        const templateGrid = document.getElementById('templateGrid');
                        if(!templateGrid) return;
                        const entries = [
                            { name:'TechFest 2025', file:'/assets/poster/templates/event-techfest.json', preview:'#0ea5e9' },
                            { name:'Summer Fest', file:'/assets/poster/templates/event-festival.json', preview:'#f59e0b' },
                            { name:'Night Festival', file:'/assets/poster/templates/festival-night.json', preview:'#0ea5e9' },
                            { name:'Mega Sale', file:'/assets/poster/templates/marketing-sale.json', preview:'#ef4444' },
                            { name:'Food Promo', file:'/assets/poster/templates/marketing-food.json', preview:'#f59e0b' },
                            { name:'Flash Sale', file:'/assets/poster/templates/sales-flash.json', preview:'#3b82f6' },
                            { name:'Business Flyer', file:'/assets/poster/templates/business-flyer.json', preview:'#ffffff' },
                            { name:'Business Minimal', file:'/assets/poster/templates/business-minimal.json', preview:'#f3f4f6' },
                            { name:'Magazine Cover', file:'/assets/poster/templates/magazine-cover.json', preview:'#ffffff' },
                            { name:'Fashion Lookbook', file:'/assets/poster/templates/fashion-lookbook.json', preview:'#f9fafb' }
                        ];
                        templateGrid.innerHTML='';
                        entries.forEach(t=>{
                            const card=document.createElement('div');
                            card.className='pdp-card';
                            card.draggable=true;
                            card.innerHTML = '<div class="title">'+t.name+'</div>';
                            card.addEventListener('click', ()=> this.applyTemplate(t.file));
                            templateGrid.appendChild(card);
                        });
                    }

                    async applyTemplate(path){

                            const tpl = await this.fetchJSON(path);
                            const canvas = this.canvas;
                            canvas.clear();
                            const sizeW = (tpl.size && tpl.size.width) || 1200;
                            const sizeH = (tpl.size && tpl.size.height) || 1600;
                            canvas.setWidth(sizeW);
                            canvas.setHeight(sizeH);
                            if(tpl.background){
                                if(tpl.background.type==='solid'){
                                    canvas.setBackgroundColor(tpl.background.color || '#ffffff', canvas.renderAll.bind(canvas));
                                } else if(tpl.background.type==='gradient'){
                                    const grad = new fabric.Gradient({ type:'linear', gradientUnits:'pixels', coords:{ x1:0, y1:0, x2:sizeW, y2:sizeH }, colorStops:[ { offset:0, color: (tpl.background.colors && tpl.background.colors[0])||'#fff' }, { offset:1, color: (tpl.background.colors && tpl.background.colors[1])||'#eee' } ] });
                                    const bgRect = new fabric.Rect({ left:0, top:0, width:sizeW, height:sizeH, selectable:false });
                                    bgRect.set('fill', grad); canvas.add(bgRect);
    }
    }

                                await this.addLayerFromSpec(layer);

                            canvas.renderAll();
                            this.saveState && this.saveState();
        if (!canvasEl) return;

                    async addLayerFromSpec(layer){
            preserveObjectStacking: true,
                            this.canvas.add(new fabric.Rect({ left:layer.left, top:layer.top, width:layer.width, height:layer.height, fill:layer.fill||'#eee', rx:layer.rx||0 }));
            backgroundColor: '#ffffff'
                            this.canvas.add(new fabric.Rect({ left:layer.left, top:layer.top, width:layer.width, height:layer.height, fill:layer.fill||'#1f2937', rx:layer.rx||0 }));
        this.setCanvasSize(1080, 1080);
                            this.canvas.add(new fabric.IText(layer.text||'', { left:layer.left, top:layer.top, fontSize:layer.fontSize||32, fontWeight:layer.fontWeight||'normal', fill:layer.fill||'#000' }));
        this.canvas.on('object:modified', () => this.onObjectChange());
        this.canvas.on('object:removed', () => this.onObjectChange());
                            this.canvas.add(new fabric.IText(layer.text||'', { left:layer.left, top:layer.top, fontSize:layer.fontSize||64, fill:layer.fill||'#000' }));
        this.canvas.on('selection:updated', (e) => this.onSelectionChange(e));
        this.canvas.on('selection:cleared', () => this.onSelectionClear());
                            this.canvas.add(ph);
        this.canvas.on('mouse:move', (e) => this.onMouseMove(e));
        this.canvas.on('mouse:up', () => this.onMouseUp());
                            for(const child of layer.children){ items.push(await this.createObject(child)); }
        this.canvas.on('object:scaling', (e) => this.handleSnapping(e));
    }
                            this.canvas.add(group);
        this.setCanvasSize(1080, 1080);
                            this.canvas.add(new fabric.Circle({ left:layer.left, top:layer.top, radius:layer.radius||40, fill:layer.fill||'rgba(255,255,255,0.12)' }));
        // Canvas event listeners
        this.canvas.on('object:added', () => this.onObjectChange());
                    async createObject(spec){
                        if(spec.type==='text') return new fabric.IText(spec.text||'', { left:spec.left, top:spec.top, fontSize:spec.fontSize||28, fill:spec.fill||'#000' });
                        if(spec.type==='shape' && spec.shape==='rect') return new fabric.Rect({ left:spec.left, top:spec.top, width:spec.width, height:spec.height, rx:spec.rx||0, fill:spec.fill||'#1f2937' });
                        return new fabric.Rect({ left:(spec.left||0), top:(spec.top||0), width:40, height:40, fill:'#ddd' });
                    }
        this.canvas.on('object:moving', (e) => this.handleSnapping(e));
        this.canvas.on('object:scaling', (e) => this.handleSnapping(e));
    }

    setCanvasSize(width, height) {
        if (!this.canvas) return;

        this.canvas.setWidth(width);
        this.canvas.setHeight(height);
        this.canvas.calcOffset();
        this.canvas.renderAll();
        this.updateZoomDisplay();
        this.updateRulers();
    }

// Instantiate app and basic UI wiring after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new PosterDesignerPro();

    // Minimal Asset Text Styles chips
    const assetTextStyles = document.getElementById('assetTextStyles');
    if (assetTextStyles) {
        ['Heading','Subheading','Body'].forEach(n=>{
            const chip=document.createElement('div');
            chip.className='pdp-chip';
            chip.textContent=n;
            chip.draggable=true;
            chip.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', n));
            assetTextStyles.appendChild(chip);
        });
    }

    // Export dropdown basic wiring
    const exportDropdown = document.getElementById('exportDropdown');
    if (exportDropdown) {
        exportDropdown.addEventListener('click', (e)=>{
            const btn = e.target.closest('[data-export]');
            if(!btn) return;
            const type = btn.getAttribute('data-export');
            if (type === 'json' && app.exportTemplateJSON) app.exportTemplateJSON();
            if ((type === 'png' || type === 'jpg' || type === 'pdf') && app.exportImage) app.exportImage(type);
        });
    }
});

    bindEvents() {
        // Toolbar events
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleZoom(e));
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToolClick(e));
        });

        // Sidebar tabs
        document.querySelectorAll('.nav-link').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });

        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectTemplate(e));
        });

        // Asset selection
        document.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', (e) => this.addAsset(e));
        });

        // AI tools
        document.querySelectorAll('.ai-tool button').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAITool(e));
        });

        // Export modal
        document.getElementById('exportBtn')?.addEventListener('click', () => this.showExportModal());
        document.getElementById('confirmExport')?.addEventListener('click', () => this.exportDesign());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupUI() {
        this.updateLayersPanel();
        this.updatePropertiesPanel();
        this.updateZoomDisplay();
    }

    initializeTemplates() {
        return {
            business: [
                { id: 'business-1', name: 'Corporate', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', elements: [] },
                { id: 'business-2', name: 'Minimal', preview: '#ffffff', elements: [] },
                { id: 'business-3', name: 'Modern', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', elements: [] }
            ],
            social: [
                { id: 'social-1', name: 'Instagram Story', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', elements: [] },
                { id: 'social-2', name: 'Facebook Post', preview: '#ffffff', elements: [] },
                { id: 'social-3', name: 'Twitter Header', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', elements: [] }
            ],
            creative: [
                { id: 'creative-1', name: 'Artistic', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', elements: [] },
                { id: 'creative-2', name: 'Vintage', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', elements: [] },
                { id: 'creative-3', name: 'Geometric', preview: '#ffffff', elements: [] }
            ]
        };
    }

    initializeAssets() {
        return {
            shapes: [
                { type: 'rect', name: 'Rectangle', icon: 'square' },
                { type: 'circle', name: 'Circle', icon: 'circle' },
                { type: 'triangle', name: 'Triangle', icon: 'triangle' },
                { type: 'polygon', name: 'Star', icon: 'star' }
            ],
            icons: [
                { name: 'Heart', icon: 'heart', category: 'symbols' },
                { name: 'Star', icon: 'star', category: 'symbols' },
                { name: 'Check', icon: 'check', category: 'symbols' },
                { name: 'Arrow', icon: 'arrow-right', category: 'arrows' }
            ],
            text: [
                { content: 'Heading', style: 'heading' },
                { content: 'Subheading', style: 'subheading' },
                { content: 'Body Text', style: 'body' },
                { content: 'Call to Action', style: 'cta' }
            ]
        };
    }

    loadTemplates() {
        const templateGrid = document.querySelector('.template-grid');
        if (!templateGrid) return;

        templateGrid.innerHTML = '';

        Object.entries(this.templates).forEach(([category, templates]) => {
            templates.forEach(template => {
                const card = document.createElement('div');
                card.className = 'template-card';
                card.dataset.templateId = template.id;
                card.innerHTML = `
                    <div class="template-preview" style="background: ${template.preview}">
                        <div class="template-overlay">
                            <span>${template.name}</span>
                        }

        this.assets.shapes.forEach(shape => {
            const item = document.createElement('div');
            item.className = 'asset-item shape-preset';
            item.dataset.shapeType = shape.type;
            item.innerHTML = `<i class="fas fa-${shape.icon}"></i>`;
            shapesGrid.appendChild(item);
        });
    }

    loadIcons() {
        const iconsGrid = document.querySelector('.asset-grid[data-category="icons"]');
        if (!iconsGrid) return;

        iconsGrid.innerHTML = '';

        this.assets.icons.forEach(icon => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.dataset.iconName = icon.icon;
            item.innerHTML = `<i class="fas fa-${icon.icon}"></i>`;
            iconsGrid.appendChild(item);
        });
    }

    loadTextPresets() {
        const textGrid = document.querySelector('.asset-grid[data-category="text"]');
        if (!textGrid) return;

        textGrid.innerHTML = '';

        this.assets.text.forEach(text => {
            const item = document.createElement('div');
            item.className = 'asset-item text-preset';
            item.dataset.textContent = text.content;
            item.dataset.textStyle = text.style;
            item.textContent = text.content;
            textGrid.appendChild(item);
        });
    }

    initializeZoomControls() {
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas.getZoom();
            zoom *= 0.999 ** delta;
            zoom = Math.max(0.1, Math.min(3, zoom));
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            this.zoom = zoom;
            this.updateZoomDisplay();
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
    }

    initializeRulers() {
        this.updateRulers();
    }

    initializeGuides() {
        // Add default guides
        this.addGuide('horizontal', this.canvas.height / 2);
        this.addGuide('vertical', this.canvas.width / 2);
    }

    initializeContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#posterCanvas')) {
                e.preventDefault();
                this.showContextMenu(e);
            }
        });

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    initializeModals() {
        // Color picker modal
        document.getElementById('colorPickerBtn')?.addEventListener('click', () => this.showColorPicker());

        // Export modal
        document.getElementById('exportModal')?.addEventListener('hidden.bs.modal', () => {
            // Reset export options
        });
    }

    handleZoom(e) {
        const action = e.currentTarget.dataset.action;
        let zoom = this.canvas.getZoom();

        switch (action) {
            case 'zoom-in':
                zoom = Math.min(3, zoom * 1.2);
                break;
            case 'zoom-out':
                zoom = Math.max(0.1, zoom / 1.2);
                break;
            case 'zoom-fit':
                zoom = Math.min(
                    (this.canvas.wrapperEl.clientWidth - 40) / this.canvas.width,
                    (this.canvas.wrapperEl.clientHeight - 40) / this.canvas.height
                );
                break;
            case 'zoom-100':
                zoom = 1;
                break;
        }

        this.canvas.setZoom(zoom);
        this.zoom = zoom;
        this.updateZoomDisplay();
    }

    handleToolClick(e) {
        const tool = e.currentTarget.dataset.tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');

        switch (tool) {
            case 'select':
                this.canvas.isDrawingMode = false;
                break;
            case 'text':
                this.addText();
                break;
            case 'image':
                this.addImage();
                break;
            case 'shape':
                // Show shape submenu
                break;
        }
    }

    handleTabClick(e) {
        const tabId = e.currentTarget.id;
        document.querySelectorAll('.nav-link').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        e.currentTarget.classList.add('active');
        document.getElementById(tabId.replace('tab-', '') + '-content')?.classList.add('active');
    }

    selectTemplate(e) {
        const templateId = e.currentTarget.dataset.templateId;
        document.querySelectorAll('.template-card').forEach(card => card.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Apply template
        this.applyTemplate(templateId);
    }

    applyTemplate(templateId) {
        // Clear canvas
        this.canvas.clear();

        // Find template
        let template = null;
        Object.values(this.templates).forEach(category => {
            const found = category.find(t => t.id === templateId);
            if (found) template = found;
        });

        if (!template) return;

        // Set background
        this.canvas.setBackgroundColor(template.preview, this.canvas.renderAll.bind(this.canvas));

        // Add template elements
        // This would be expanded with actual template data
        this.onObjectChange();
    }

    addAsset(e) {
        const item = e.currentTarget;

        if (item.classList.contains('shape-preset')) {
            this.addShape(item.dataset.shapeType);
        } else if (item.classList.contains('text-preset')) {
            this.addTextPreset(item.dataset.textContent, item.dataset.textStyle);
        } else {
            // Icon or other asset
            this.addIcon(item.dataset.iconName);
        }
    }

    addText(text = 'New Text', options = {}) {
        const textbox = new fabric.Textbox(text, {
            left: 100,
            top: 100,
            width: 300,
            fontSize: 24,
            fontFamily: 'Inter',
            fill: '#000000',
            ...options
        });

        this.canvas.add(textbox);
        this.canvas.setActiveObject(textbox);
        this.canvas.renderAll();
        this.onObjectChange();
    }

    addTextPreset(content, style) {
        const styles = {
            heading: { fontSize: 48, fontWeight: 'bold' },
            subheading: { fontSize: 32, fontWeight: '600' },
            body: { fontSize: 18 },
            cta: { fontSize: 24, fontWeight: 'bold', fill: '#ffffff', backgroundColor: '#6366f1' }
        };

        this.addText(content, styles[style] || {});
    }

    addShape(type) {
        let shape;

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: '#6366f1',
                    stroke: '#000000',
                    strokeWidth: 2
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: 100,
                    top: 100,
                    radius: 50,
                    fill: '#10b981',
                    stroke: '#000000',
                    strokeWidth: 2
                });
                break;
            case 'triangle':
                shape = new fabric.Triangle({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: '#f59e0b',
                    stroke: '#000000',
                    strokeWidth: 2
                });
                break;
        }

        if (shape) {
            this.canvas.add(shape);
            this.canvas.setActiveObject(shape);
            this.canvas.renderAll();
            this.onObjectChange();
        }
    }

    addIcon(iconName) {
        // Create icon as text with Font Awesome
        const icon = new fabric.Text(`\uf${iconName}`, {
            left: 100,
            top: 100,
            fontSize: 48,
            fontFamily: 'Font Awesome 6 Free',
            fill: '#6366f1'
        });

        this.canvas.add(icon);
        this.canvas.setActiveObject(icon);
        this.canvas.renderAll();
        this.onObjectChange();
    }

    addImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fabric.Image.fromURL(event.target.result, (img) => {
                        img.set({
                            left: 100,
                            top: 100,
                            scaleX: 0.5,
                            scaleY: 0.5
                        });
                        this.canvas.add(img);
                        this.canvas.setActiveObject(img);
                        this.canvas.renderAll();
                        this.onObjectChange();
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    handleAITool(e) {
        const tool = e.currentTarget.dataset.aiTool;

        switch (tool) {
            case 'generate-text':
                this.generateText();
                break;
            case 'suggest-colors':
                this.suggestColors();
                break;
            case 'auto-layout':
                this.autoLayout();
                break;
        }
    }

    async generateText() {
        const prompt = document.querySelector('.ai-tool input')?.value;
        if (!prompt) return;

        // Show loading
        const btn = document.querySelector('[data-ai-tool="generate-text"]');
        const originalText = btn.textContent;
        btn.textContent = 'Generating...';
        btn.disabled = true;

        try {
            // Simulate AI API call
            const response = await this.callAIApi('/api/generate-text', { prompt });
            this.addText(response.text);
        } catch (error) {
            console.error('AI text generation failed:', error);
            alert('Failed to generate text. Please try again.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async suggestColors() {
        try {
            const response = await this.callAIApi('/api/suggest-colors', {
                currentColors: this.getCurrentColors()
            });
            this.showColorPalette(response.colors);
        } catch (error) {
            console.error('Color suggestion failed:', error);
        }
    }

    async autoLayout() {
        try {
            const response = await this.callAIApi('/api/auto-layout', {
                elements: this.getCanvasElements()
            });
            this.applyLayout(response.layout);
        } catch (error) {
            console.error('Auto layout failed:', error);
        }
    }

    async callAIApi(endpoint, data) {
        // This would be replaced with actual API calls
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    text: 'Generated text from AI',
                    colors: ['#6366f1', '#10b981', '#f59e0b'],
                    layout: {}
                });
            }, 1000);
        });
    }

    onObjectChange() {
        this.pushState();
        this.updateLayersPanel();
        this.updatePropertiesPanel();
    }

    onSelectionChange(e) {
        this.activeObject = e.selected[0];
        this.updatePropertiesPanel();
    }

    onSelectionClear() {
        this.activeObject = null;
        this.updatePropertiesPanel();
    }

    onMouseDown(e) {
        if (e.e.altKey) {
            this.isDragging = true;
            this.lastPos = { x: e.e.clientX, y: e.e.clientY };
            this.canvas.defaultCursor = 'grabbing';
        }
    }

    onMouseMove(e) {
        if (this.isDragging) {
            const delta = {
                x: e.e.clientX - this.lastPos.x,
                y: e.e.clientY - this.lastPos.y
            };

            this.panOffset.x += delta.x;
            this.panOffset.y += delta.y;

            this.canvas.relativePan(delta);
            this.lastPos = { x: e.e.clientX, y: e.e.clientY };
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.canvas.defaultCursor = 'default';
    }

    handleSnapping(e) {
        if (!this.snapEnabled) return;

        const obj = e.target;
        const threshold = 10;

        // Snap to canvas edges
        if (Math.abs(obj.left) < threshold) obj.left = 0;
        if (Math.abs(obj.top) < threshold) obj.top = 0;
        if (Math.abs(obj.left + obj.getScaledWidth() - this.canvas.width) < threshold) {
            obj.left = this.canvas.width - obj.getScaledWidth();
        }
        if (Math.abs(obj.top + obj.getScaledHeight() - this.canvas.height) < threshold) {
            obj.top = this.canvas.height - obj.getScaledHeight();
        }

        // Snap to guides
        this.guides.forEach(guide => {
            if (guide.type === 'vertical') {
                if (Math.abs(obj.left - guide.position) < threshold) obj.left = guide.position;
                if (Math.abs(obj.left + obj.getScaledWidth() - guide.position) < threshold) {
                    obj.left = guide.position - obj.getScaledWidth();
                }
            } else {
                if (Math.abs(obj.top - guide.position) < threshold) obj.top = guide.position;
                if (Math.abs(obj.top + obj.getScaledHeight() - guide.position) < threshold) {
                    obj.top = guide.position - obj.getScaledHeight();
                }
            }
        });
    }

    updateLayersPanel() {
        const layersList = document.querySelector('.layers-list');
        if (!layersList) return;

        layersList.innerHTML = '';

        const objects = this.canvas.getObjects().slice().reverse();
        objects.forEach((obj, index) => {
            const realIndex = this.canvas.getObjects().length - 1 - index;
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (this.activeObject === obj) layerItem.classList.add('active');

            const name = this.getObjectDisplayName(obj);

            layerItem.innerHTML = `
                <div class="layer-preview"></div>
                <div class="layer-info">
                    <div class="layer-name">${name}</div>
                    <div class="layer-type">${obj.type}</div>
                </div>
                <div class="layer-actions">
                    <button class="btn" onclick="designer.toggleLayerVisibility(${realIndex})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn" onclick="designer.lockLayer(${realIndex})">
                        <i class="fas fa-lock"></i>
                    </button>
                </div>
            `;

            layerItem.addEventListener('click', () => {
                this.canvas.setActiveObject(obj);
                this.canvas.renderAll();
                this.updateLayersPanel();
            });

            layersList.appendChild(layerItem);
        });
    }

    updatePropertiesPanel() {
        const panel = document.querySelector('.properties-panel');
        if (!panel) return;

        if (!this.activeObject) {
            panel.innerHTML = '<p class="text-muted">Select an object to edit properties</p>';
            return;
        }

        const obj = this.activeObject;
        let html = '';

        // Position
        html += `
            <div class="property-group">
                <div class="property-label">Position</div>
                <div class="property-control">
                    <input type="number" value="${Math.round(obj.left || 0)}" onchange="designer.updateProperty('left', this.value)">
                    <input type="number" value="${Math.round(obj.top || 0)}" onchange="designer.updateProperty('top', this.value)">
                </div>
            </div>
        `;

        // Size
        if (obj.width !== undefined) {
            html += `
                <div class="property-group">
                    <div class="property-label">Size</div>
                    <div class="property-control">
                        <input type="number" value="${Math.round(obj.width || 0)}" onchange="designer.updateProperty('width', this.value)">
                        <input type="number" value="${Math.round(obj.height || 0)}" onchange="designer.updateProperty('height', this.value)">
                    </div>
                </div>
            `;
        }

        // Rotation
        html += `
            <div class="property-group">
                <div class="property-label">Rotation</div>
                <div class="property-control">
                    <input type="range" min="0" max="360" value="${obj.angle || 0}" onchange="designer.updateProperty('angle', this.value)">
                </div>
            </div>
        `;

        // Opacity
        html += `
            <div class="property-group">
                <div class="property-label">Opacity</div>
                <div class="property-control">
                    <input type="range" min="0" max="1" step="0.1" value="${obj.opacity || 1}" onchange="designer.updateProperty('opacity', this.value)">
                </div>
            </div>
        `;

        // Text properties
        if (obj.type === 'textbox' || obj.type === 'text') {
            html += `
                <div class="property-group">
                    <div class="property-label">Text</div>
                    <div class="property-control">
                        <textarea onchange="designer.updateProperty('text', this.value)">${obj.text || ''}</textarea>
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-label">Font Size</div>
                    <div class="property-control">
                        <input type="number" value="${obj.fontSize || 24}" onchange="designer.updateProperty('fontSize', this.value)">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-label">Color</div>
                    <div class="property-control">
                        <input type="color" value="${obj.fill || '#000000'}" onchange="designer.updateProperty('fill', this.value)">
                    </div>
                </div>
            `;
        }

        // Shape properties
        if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
            html += `
                <div class="property-group">
                    <div class="property-label">Fill Color</div>
                    <div class="property-control">
                        <input type="color" value="${obj.fill || '#6366f1'}" onchange="designer.updateProperty('fill', this.value)">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-label">Stroke Color</div>
                    <div class="property-control">
                        <input type="color" value="${obj.stroke || '#000000'}" onchange="designer.updateProperty('stroke', this.value)">
                    </div>
                </div>
            `;
        }

        panel.innerHTML = html;
    }

    updateProperty(property, value) {
        if (!this.activeObject) return;

        const numProps = ['left', 'top', 'width', 'height', 'angle', 'opacity', 'fontSize'];
        if (numProps.includes(property)) {
            value = parseFloat(value);
        }

        this.activeObject.set(property, value);
        this.activeObject.setCoords();
        this.canvas.renderAll();
        this.onObjectChange();
    }

    updateZoomDisplay() {
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
        }
    }

    updateRulers() {
        // Update ruler marks based on canvas size and zoom
        // This would be implemented with actual ruler rendering
    }

    addGuide(type, position) {
        this.guides.push({ type, position });
        this.renderGuides();
    }

    renderGuides() {
        // Clear existing guides
        document.querySelectorAll('.guide-line').forEach(el => el.remove());

        const guidesContainer = document.querySelector('.guides-container');
        if (!guidesContainer) return;

        this.guides.forEach(guide => {
            const guideEl = document.createElement('div');
            guideEl.className = `guide-line ${guide.type}`;
            if (guide.type === 'horizontal') {
                guideEl.style.top = guide.position + 'px';
            } else {
                guideEl.style.left = guide.position + 'px';
            }
            guidesContainer.appendChild(guideEl);
        });
    }

    showContextMenu(e) {
        const menu = document.querySelector('.context-menu');
        if (!menu) return;

        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.display = 'block';
    }

    hideContextMenu() {
        const menu = document.querySelector('.context-menu');
        if (menu) menu.style.display = 'none';
    }

    showExportModal() {
        const modal = new bootstrap.Modal(document.getElementById('exportModal'));
        modal.show();
    }

    exportDesign() {
        const format = document.querySelector('input[name="exportFormat"]:checked')?.value || 'png';
        const quality = document.querySelector('#exportQuality')?.value || 1;

        const dataURL = this.canvas.toDataURL({
            format: format,
            quality: quality,
            multiplier: 2
        });

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `poster-design.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showColorPicker() {
        const modal = new bootstrap.Modal(document.getElementById('colorPickerModal'));
        modal.show();
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    e.preventDefault();
                    this.copyObject();
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteObject();
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateObject();
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteObject();
                    break;
            }
        }
    }

    pushState() {
        try {
            const state = JSON.stringify(this.canvas.toJSON());
            this.undoStack.push(state);
            if (this.undoStack.length > this.maxUndo) {
                this.undoStack.shift();
            }
            this.redoStack = [];
        } catch (e) {
            console.error('Failed to push state:', e);
        }
    }

    undo() {
        if (this.undoStack.length < 2) return;

        const current = this.undoStack.pop();
        this.redoStack.push(current);
        const previous = this.undoStack[this.undoStack.length - 1];

        this.canvas.loadFromJSON(previous, () => {
            this.canvas.renderAll();
            this.onObjectChange();
        });
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const state = this.redoStack.pop();
        this.loadTemplatesList();
        if (this.loadAssets) this.loadAssets();
        if (this.initializeZoomControls) this.initializeZoomControls();
        if (this.initializeRulers) this.initializeRulers();
        if (this.initializeGuides) this.initializeGuides();
        if (this.initializeContextMenu) this.initializeContextMenu();
        if (this.initializeModals) this.initializeModals();
        if (this.loadProject) this.loadProject();
    copyObject() {
    }
        this.activeObject.clone(cloned => {
            this.clipboard = cloned;
        });
    }

    pasteObject() {
        if (!this.clipboard) return;

        this.clipboard.clone(cloned => {
            cloned.set({
                left: (cloned.left || 0) + 20,
                top: (cloned.top || 0) + 20
            });
            this.canvas.add(cloned);
            this.canvas.setActiveObject(cloned);
            this.canvas.renderAll();
            this.onObjectChange();
        });
    }

    duplicateObject() {
        if (!this.activeObject) return;

        this.activeObject.clone(cloned => {
            cloned.set({
                left: (this.activeObject.left || 0) + 20,
                top: (this.activeObject.top || 0) + 20
            });
            this.canvas.add(cloned);
            this.canvas.setActiveObject(cloned);
            this.canvas.renderAll();
            this.onObjectChange();
        });
    }

    deleteObject() {
        if (!this.activeObject) return;

        this.canvas.remove(this.activeObject);
        this.activeObject = null;
        this.canvas.renderAll();
        this.onObjectChange();
    }

    toggleLayerVisibility(index) {
        const obj = this.canvas.getObjects()[index];
        if (obj) {
            obj.visible = !obj.visible;
            this.canvas.renderAll();
            this.updateLayersPanel();
        }
    }

    lockLayer(index) {
        const obj = this.canvas.getObjects()[index];
        if (obj) {
            obj.selectable = !obj.selectable;
            obj.evented = obj.selectable;
            this.canvas.renderAll();
            this.updateLayersPanel();
        }
    }

    getObjectDisplayName(obj) {
        if (obj.type === 'textbox' || obj.type === 'text') {
            return obj.text ? obj.text.substring(0, 20) + (obj.text.length > 20 ? '...' : '') : 'Text';
        }
        return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
    }

    getCurrentColors() {
        const colors = new Set();
        this.canvas.getObjects().forEach(obj => {
            if (obj.fill) colors.add(obj.fill);
            if (obj.stroke) colors.add(obj.stroke);
        });
        return Array.from(colors);
    }

    getCanvasElements() {
        return this.canvas.getObjects().map(obj => ({
            type: obj.type,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height
        }));
    }

    showColorPalette(colors) {
        const paletteGrid = document.querySelector('.palette-grid');
        if (!paletteGrid) return;

        paletteGrid.innerHTML = '';

        colors.forEach(color => {
            const item = document.createElement('div');
            item.className = 'palette-item';
            item.innerHTML = `
                <div class="palette-colors">
                    <div class="palette-color" style="background: ${color}"></div>
                </div>
                <div class="palette-name">${color}</div>
            `;
            item.addEventListener('click', () => {
                if (this.activeObject) {
                    this.activeObject.set('fill', color);
                    this.canvas.renderAll();
                    this.onObjectChange();
                }
            });
            paletteGrid.appendChild(item);
        });
    }

    applyLayout(layout) {
        // Apply AI-generated layout
        // This would position objects based on AI suggestions
    }

    saveProject() {
        const project = {
            canvas: this.canvas.toJSON(),
            zoom: this.zoom,
            panOffset: this.panOffset,
            guides: this.guides,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('posterDesignerProject', JSON.stringify(project));
        this.showNotification('Project saved successfully!');
    }

    loadProject() {
        const saved = localStorage.getItem('posterDesignerProject');
        if (saved) {
            try {
                const project = JSON.parse(saved);
                this.canvas.loadFromJSON(project.canvas, () => {
                    this.canvas.renderAll();
                    this.zoom = project.zoom || 1;
                    this.panOffset = project.panOffset || { x: 0, y: 0 };
                    this.guides = project.guides || [];
                    this.canvas.setZoom(this.zoom);
                    this.renderGuides();
                    this.onObjectChange();
                });
            } catch (e) {
                console.error('Failed to load project:', e);
            }
        }
    }

    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = 'alert alert-success position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the designer when DOM is loaded
let designer;
document.addEventListener('DOMContentLoaded', () => {
    designer = new PosterDesignerPro();

    // Expose designer globally for HTML event handlers
    window.designer = designer;
});

console.log('Poster Designer Pro initialized');