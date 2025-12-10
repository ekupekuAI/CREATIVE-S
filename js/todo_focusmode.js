/* Focus Mode (Pomodoro + Deep Work) */
window.todoFocusMode = (function(){
  const STORAGE_KEY = 'todo_focus_stats_v1';
  let containerId = 'focusContainer';
  let timer = null, remaining = 0, mode = 'work', customWork=25, customBreak=5;

  function init(id){ containerId=id||containerId; render(); }

  function start(type){
    mode = type||'work';
    const mins = mode==='work'?customWork:customBreak;
    remaining = mins*60;
    tick();
    if(timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
  }

  function stop(){ if(timer) clearInterval(timer); timer=null; }
  function tick(){ remaining=Math.max(0,remaining-1); updateTimerText(); if(remaining===0){ stop(); recordSession(mode); } }

  async function recordSession(m){
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    const day = new Date().toISOString().slice(0,10);
    data[day] = data[day]||{ work:0, break:0, sessions:0 };
    if(m==='work'){ data[day].work += 1; data[day].sessions += 1; } else { data[day].break += 1; }
    await window.AppStorage.save(STORAGE_KEY, data);
    // gentle alert
    const el = document.getElementById('focusAlert'); if(el){ el.innerHTML = `<div class='alert alert-success'>${m==='work'?'Work':'Break'} session completed.</div>`; setTimeout(()=> el.innerHTML='', 3000); }
  }

  function render(){
    const cont = document.getElementById(containerId); if(!cont) return;
    cont.innerHTML = `
      <div class='focus-panel'>
        <div>
          <div id='focusTimer' class='focus-timer'>00:00</div>
          <div class='text-muted'>Mode: <span id='focusMode'>Idle</span></div>
        </div>
        <div class='focus-controls'>
          <button class='btn btn-success' onclick='todoFocusMode.start("work")'><i class='fas fa-play me-1'></i>Start Work (25)</button>
          <button class='btn btn-info' onclick='todoFocusMode.start("break")'><i class='fas fa-coffee me-1'></i>Start Break (5)</button>
          <button class='btn btn-secondary' onclick='todoFocusMode.stop()'><i class='fas fa-stop me-1'></i>Stop</button>
        </div>
      </div>
      <div class='mt-3'>
        <label class='form-label'>Custom Durations</label>
        <div class='input-group input-group-sm' style='max-width:340px;'>
          <span class='input-group-text'>Work (min)</span>
          <input id='customWork' type='number' class='form-control' value='25' min='1'>
          <span class='input-group-text'>Break (min)</span>
          <input id='customBreak' type='number' class='form-control' value='5' min='1'>
          <button class='btn btn-outline-primary' onclick='todoFocusMode.applyCustom()'>Apply</button>
        </div>
      </div>
      <div id='focusAlert' class='mt-2'></div>
      <div class='mt-3'>
        <h6>Today</h6>
        <div id='focusStatsToday' class='text-muted'></div>
      </div>
    `;
    updateStats();
  }

  function applyCustom(){
    const w = parseInt(document.getElementById('customWork').value||'25',10);
    const b = parseInt(document.getElementById('customBreak').value||'5',10);
    customWork = Math.max(1,w); customBreak = Math.max(1,b);
    updateStats();
  }

  function updateTimerText(){
    const mm = String(Math.floor(remaining/60)).padStart(2,'0');
    const ss = String(remaining%60).padStart(2,'0');
    const el = document.getElementById('focusTimer'); if(el) el.textContent = `${mm}:${ss}`;
    const m = document.getElementById('focusMode'); if(m) m.textContent = remaining>0? (mode==='work'?'Work':'Break') : 'Idle';
  }

  function updateStats(){
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    const day = new Date().toISOString().slice(0,10);
    const s = data[day]||{ work:0, break:0, sessions:0 };
    const el = document.getElementById('focusStatsToday'); if(el) el.textContent = `Sessions: ${s.sessions}, Work blocks: ${s.work}, Breaks: ${s.break}`;
  }

  return { init, start, stop, applyCustom };
})();
