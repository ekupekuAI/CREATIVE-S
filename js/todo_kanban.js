/* Kanban Board */
window.todoKanban = (function(){
  const STORAGE_KEY = 'todo_kanban_state_v1';
  let containerId = 'kanbanContainer';

  function init(id){ containerId=id||containerId; render(); }

  function getState(tasks){
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    if(saved.columns) return saved;
    // default mapping using status
    const columns = { todo:[], progress:[], review:[], completed:[] };
    for(const t of tasks){
      const key = t.status==='completed'?'completed': t.status==='in-progress'?'progress':'todo';
      columns[key].push(t.id);
    }
    return { columns };
  }

  function render(){
    const cont = document.getElementById(containerId); if(!cont) return;
    const tasks = window.getAllTasks?window.getAllTasks():[];
    const state = getState(tasks);
    const columnDefs = [
      { key:'todo', title:'To Do', color:'primary' },
      { key:'progress', title:'In Progress', color:'warning' },
      { key:'review', title:'Review', color:'info' },
      { key:'completed', title:'Completed', color:'success' },
    ];
    let html = `<div class='kanban-board'>`;
    for(const col of columnDefs){
      const ids = state.columns[col.key]||[];
      html += `<div class='kanban-column' data-key='${col.key}'>
        <h6>${col.title} <span class='badge bg-${col.color}'>${ids.length}</span></h6>
        <div class='kanban-list' id='list-${col.key}'></div>
      </div>`;
    }
    html += `</div>`;
    cont.innerHTML = html;
    // fill cards
    for(const col of columnDefs){
      const box = document.getElementById(`list-${col.key}`);
      const ids = state.columns[col.key]||[];
      for(const id of ids){
        const t = tasks.find(x=>String(x.id)===String(id)); if(!t) continue;
        const el = document.createElement('div');
        el.className = 'kanban-card';
        el.draggable = true; el.dataset.id = t.id;
        el.innerHTML = `${iconFor(t.priority)} ${escapeHtml(t.title)} <span class='text-muted small'>${t.tags||''}</span>`;
        addCardEvents(el);
        box.appendChild(el);
      }
      // drag handlers
      box.ondragover = e=>{ e.preventDefault(); };
      box.ondrop = e=>{ const id = e.dataTransfer.getData('text/plain'); moveToColumn(id, col.key); };
    }
  }

  function addCardEvents(el){
    el.addEventListener('dragstart', ()=> el.classList.add('dragging'));
    el.addEventListener('dragend', ()=> el.classList.remove('dragging'));
    el.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      const id = el.dataset.id;
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu show';
      menu.style.position='fixed'; menu.style.left = e.clientX+'px'; menu.style.top = e.clientY+'px';
      menu.innerHTML = `
        <button class='dropdown-item' onclick='todoKanban.quick("duplicate","${id}")'><i class="fas fa-copy me-1"></i>Duplicate</button>
        <button class='dropdown-item' onclick='todoKanban.quick("edit","${id}")'><i class="fas fa-edit me-1"></i>Edit</button>
        <button class='dropdown-item text-danger' onclick='todoKanban.quick("delete","${id}")'><i class="fas fa-trash me-1"></i>Delete</button>`;
      document.body.appendChild(menu);
      const remove = ()=> menu.remove();
      setTimeout(()=> document.addEventListener('click', remove, { once:true }), 0);
    });
  }

  function quick(action, id){
    if(action==='duplicate' && window.duplicateTask) window.duplicateTask(id);
    if(action==='edit' && window.openEditTask) window.openEditTask(id);
    if(action==='delete' && window.deleteTask) window.deleteTask(id);
    render();
  }

  function moveToColumn(id, key){
    const tasks = window.getAllTasks?window.getAllTasks():[];
    const state = getState(tasks);
    // remove from all
    for(const k of Object.keys(state.columns)){
      state.columns[k] = (state.columns[k]||[]).filter(x=>String(x)!==String(id));
    }
    (state.columns[key] = state.columns[key]||[]).push(id);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    // reflect status change
    if(window.updateTaskStatus){
      const statusMap = { todo:'pending', progress:'in-progress', review:'in-progress', completed:'completed' };
      window.updateTaskStatus(id, statusMap[key]);
    }
    render();
  }

  function iconFor(priority){
    const map = { high:'<i class="fas fa-fire text-danger"></i>', medium:'<i class="fas fa-signal text-warning"></i>', low:'<i class="fas fa-feather text-secondary"></i>' };
    return map[priority]||'<i class="fas fa-tasks"></i>';
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }

  return { init, quick };
})();
