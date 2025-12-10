/* Smart Day Scheduler */
window.todoScheduler = (function(){
  const STORAGE_KEY = 'todo_schedule_today_v1';

  function estimateDuration(task){
    const base = task.priority==='high' ? 60 : task.priority==='low' ? 20 : 40;
    const len = (task.description||'').length;
    return Math.min(180, base + Math.floor(len/80)*10);
  }

  async function autoScheduleToday(){
    const tasks = (window.getAllTasks?window.getAllTasks():[]).filter(t=>t.status!=='completed');
    const today = new Date(); today.setHours(9,0,0,0);
    const endDay = new Date(); endDay.setHours(18,0,0,0);
    const sorted = tasks.sort((a,b)=>{
      const pa = a.priority==='high'?3:a.priority==='medium'?2:1; const pb = b.priority==='high'?3:b.priority==='medium'?2:1;
      const da = a.dueDate?new Date(a.dueDate).getTime():Infinity; const db = b.dueDate?new Date(b.dueDate).getTime():Infinity;
      return (pb-pa) || (da-db);
    });
    const timeline=[]; let cursor = new Date(today);
    for(const t of sorted){
      const mins = estimateDuration(t);
      const slotEnd = new Date(cursor.getTime()+mins*60000);
      if(slotEnd> endDay) break;
      timeline.push({ id:t.id, title:t.title, start:new Date(cursor), end:slotEnd, priority:t.priority });
      cursor = slotEnd;
    }
    try { await window.AppStorage.save(STORAGE_KEY, { date: new Date().toDateString(), timeline }); } catch {}
    // switch to tab and render
    const scheduleTab = document.querySelector('#schedule-tab');
    if(scheduleTab){ new bootstrap.Tab(scheduleTab).show(); }
    renderSavedSchedule('scheduleContainer');
  }

  function renderSavedSchedule(containerId){
    const cont = document.getElementById(containerId);
    if(!cont) return;
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    const timeline = data.timeline||[];
    let html = `<div class="timeline">`;
    for(const item of timeline){
      const start = fmt(item.start); const end = fmt(item.end);
      html += `<div class="timeline-slot"><span class="text-muted">${start} - ${end}</span></div>`+
              `<div class="timeline-item"><strong>${iconFor(item.priority)} ${escapeHtml(item.title)}</strong></div>`;
    }
    html += `</div>`;
    cont.innerHTML = html || '<div class="alert alert-info">No schedule yet. Click "Auto-Schedule My Day".</div>';
  }

  function iconFor(priority){
    const map = { high:'<i class="fas fa-fire text-danger"></i>', medium:'<i class="fas fa-signal text-warning"></i>', low:'<i class="fas fa-feather text-secondary"></i>' };
    return map[priority]||'<i class="fas fa-tasks"></i>';
  }
  function fmt(d){ const dd = new Date(d); return dd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }

  return { autoScheduleToday, renderSavedSchedule };
})();
