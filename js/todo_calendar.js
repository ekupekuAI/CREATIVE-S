/* Calendar View */
window.todoCalendar = (function(){
  let containerId = 'calendarContainer';

  function init(id){ containerId = id||containerId; render(new Date()); bindKeys(); }

  function bindKeys(){
    const cont = document.getElementById(containerId);
    if(!cont) return;
    cont.addEventListener('dragstart', e=>{
      if(e.target.classList.contains('calendar-pill')){
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
      }
    });
    cont.addEventListener('dragover', e=>{ e.preventDefault(); });
    cont.addEventListener('drop', e=>{
      const dayEl = e.target.closest('.calendar-day');
      if(!dayEl) return;
      const id = e.dataTransfer.getData('text/plain');
      const date = dayEl.dataset.date;
      if(window.updateTaskDueDate) window.updateTaskDueDate(id, date);
      render(currentMonth);
    });
  }

  let currentMonth = new Date(); currentMonth.setDate(1);

  function render(monthDate){
    currentMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const cont = document.getElementById(containerId); if(!cont) return;
    const tasks = window.getAllTasks?window.getAllTasks():[];
    const firstDay = new Date(currentMonth); const startIdx = firstDay.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 0).getDate();
    const heat = buildHeat(tasks);
    let html = `<div class="d-flex justify-content-between align-items-center mb-2">
      <button class="btn btn-sm btn-outline-secondary" onclick="todoCalendar.prev()"><i class="fas fa-chevron-left"></i></button>
      <h5 class="mb-0">${currentMonth.toLocaleString(undefined,{ month:'long', year:'numeric'})}</h5>
      <button class="btn btn-sm btn-outline-secondary" onclick="todoCalendar.next()"><i class="fas fa-chevron-right"></i></button>
    </div>`;
    html += `<div class="calendar-grid">`;
    for(let i=0;i<startIdx;i++){ html += `<div></div>`; }
    for(let d=1; d<=daysInMonth; d++){
      const dateStr = toDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dayTasks = tasks.filter(t=>t.dueDate===dateStr);
      const intensity = Math.min(1, (heat[dateStr]||0)/4);
      html += `<div class="calendar-day" data-date="${dateStr}" onclick="todoCalendar.openDay('${dateStr}')">
        <div class="date">${d}</div>
        <div class="items">${dayTasks.map(t=>`<span class='calendar-pill' draggable='true' data-id='${t.id}'>${escapeHtml(t.title)}</span>`).join('')}</div>
        <div class="calendar-heat" style="background: rgba(220,53,69,${intensity})"></div>
      </div>`;
    }
    html+=`</div>`;
    cont.innerHTML = html;
  }

  function buildHeat(tasks){
    const heat={}; for(const t of tasks){ if(t.dueDate){ heat[t.dueDate]=(heat[t.dueDate]||0)+1; } } return heat;
  }
  function toDateStr(y,m,d){ return new Date(y,m,d).toISOString().slice(0,10); }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }

  function openDay(dateStr){
    const tasks = window.getAllTasks?window.getAllTasks():[];
    const list = tasks.filter(t=>t.dueDate===dateStr);
    const html = `<div class='modal fade' id='calendarDayModal' tabindex='-1'>
      <div class='modal-dialog'>
        <div class='modal-content'>
          <div class='modal-header'><h5 class='modal-title'>Tasks for ${dateStr}</h5><button class='btn-close' data-bs-dismiss='modal'></button></div>
          <div class='modal-body'>${list.length?'<ul class="list-group">'+list.map(t=>`<li class='list-group-item d-flex justify-content-between align-items-center'>${escapeHtml(t.title)}<span class='badge bg-secondary'>${t.priority||'medium'}</span></li>`).join('')+'</ul>':'<div class="text-muted">No tasks.</div>'}</div>
        </div>
      </div>
    </div>`;
    const wrap = document.createElement('div'); wrap.innerHTML = html; document.body.appendChild(wrap);
    new bootstrap.Modal(document.getElementById('calendarDayModal')).show();
  }

  function prev(){ const d=new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1); render(d); }
  function next(){ const d=new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1); render(d); }

  return { init, prev, next, openDay };
})();
