/* AI Smart Tools Module */
window.todoAI = (function(){
  const STORAGE_KEY = 'todo_ai_insights_v1';
  const API_BASE = '/todo';

  function bootstrap(){ /* placeholder for future init */ }

  function openTools(){
    const modalHtml = `
      <div class="modal fade" id="aiToolsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="fas fa-magic me-2"></i>AI Smart Tools</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Selected Task (optional)</label>
                  <textarea id="aiTaskInput" class="form-control" rows="3" placeholder="Paste a task or leave empty to analyze all"></textarea>
                  <div class="d-grid mt-2 gap-2">
                    <button class="btn btn-outline-primary" id="btnRewrite"><i class="fas fa-pen-fancy me-1"></i>Rewrite Task</button>
                    <button class="btn btn-outline-warning" id="btnPriority"><i class="fas fa-bolt me-1"></i>Predict Priority</button>
                    <button class="btn btn-outline-info" id="btnSubtasks"><i class="fas fa-list-ul me-1"></i>Generate Subtasks</button>
                    <button class="btn btn-outline-success" id="btnBestTime"><i class="fas fa-clock me-1"></i>Suggest Ideal Time</button>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Insights</label>
                  <div class="alert alert-secondary" id="aiInsights" style="min-height:180px;">
                    <div class="small text-muted">Results will appear here.</div>
                  </div>
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-dark" id="btnSummarize"><i class="fas fa-paragraph me-1"></i>Summarize Task List</button>
                    <button class="btn btn-outline-secondary" id="btnWeekly"><i class="fas fa-chart-line me-1"></i>Weekly Productivity Insights</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap);
    const modal = new bootstrap.Modal(document.getElementById('aiToolsModal'));
    modal.show();
    bindHandlers();
  }

  function bindHandlers(){
    const insightsEl = document.getElementById('aiInsights');
    const inputEl = document.getElementById('aiTaskInput');
    const tasks = window.getAllTasks ? window.getAllTasks() : [];

    async function callAPI(endpoint, payload){
      try {
        const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if(!res.ok) throw new Error('Server error');
        return await res.json();
      } catch(err){
        console.error('API call failed:', err);
        return { error: true, message: 'AI service unavailable. Showing local suggestions.', fallback: localSuggest(payload, tasks) };
      }
    }

    function localSuggest(payload, tasks){
      const text = (payload && payload.text) || '';
      const summary = `Tasks: ${tasks.length}. High: ${tasks.filter(t=>t.priority==='high').length}. Completed: ${tasks.filter(t=>t.status==='completed').length}.`;
      const subtasks = text ? [ 'Clarify objective', 'List resources', 'Define deliverables', 'Estimate time', 'Execute', 'Review' ] : [];
      const priority = text.length>120 || /urgent|deadline|critical/i.test(text) ? 'high' : 'medium';
      const bestTime = /write|creative/i.test(text) ? 'morning' : /meeting|email/i.test(text) ? 'afternoon' : 'midday';
      return { summary, subtasks, priority, bestTime };
    }

    function render(data){
      const { error, message, fallback } = data || {};
      const info = error ? `<div class="text-warning mb-2"><i class="fas fa-exclamation-triangle me-1"></i>${message}</div>` : '';
      let content = '';
      if(data.rewrite) content = `<strong>Rewritten:</strong><br>${escapeHtml(data.rewrite)}`;
      else if(data.priority) content = `<strong>Priority:</strong> <span class="badge bg-${data.priority==='high'?'danger':data.priority==='medium'?'warning':'secondary'}">${data.priority.toUpperCase()}</span>`;
      else if(data.subtasks || (data.fallback && data.fallback.subtasks)) {
        const subs = data.subtasks || data.fallback.subtasks;
        content = `<strong>Subtasks:</strong><ol>${subs.map(s=>'<li>'+escapeHtml(s)+'</li>').join('')}</ol>`;
      } else if(data.bestTime) content = `<strong>Best Time:</strong> <span class="badge bg-info">${data.bestTime.toUpperCase()}</span>`;
      else if(data.summary) content = `<strong>Summary:</strong><br>${escapeHtml(data.summary)}`;
      else if(data.insights) content = `<strong>Weekly Insights:</strong><br>${escapeHtml(data.insights)}`;
      else content = JSON.stringify(data, null, 2);
      
      insightsEl.innerHTML = info + `<div>${content}</div>`;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), data: data.error?fallback:data })); } catch {}
    }

    function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }

    document.getElementById('btnRewrite').onclick = async ()=>{
      const text = inputEl.value.trim();
      if(!text){ insightsEl.innerHTML='<div class="text-warning">Please enter a task.</div>'; return; }
      const data = await callAPI(`${API_BASE}/analyze`, { action:'rewrite', text });
      render(data);
    };
    document.getElementById('btnPriority').onclick = async ()=>{
      const text = inputEl.value.trim();
      if(!text){ insightsEl.innerHTML='<div class="text-warning">Please enter a task.</div>'; return; }
      const data = await callAPI(`${API_BASE}/analyze`, { action:'priority', text });
      render(data);
    };
    document.getElementById('btnSubtasks').onclick = async ()=>{
      const text = inputEl.value.trim();
      if(!text){ insightsEl.innerHTML='<div class="text-warning">Please enter a task.</div>'; return; }
      const data = await callAPI(`${API_BASE}/suggest`, { action:'subtasks', text, tasks });
      render(data);
    };
    document.getElementById('btnBestTime').onclick = async ()=>{
      const text = inputEl.value.trim();
      if(!text){ insightsEl.innerHTML='<div class="text-warning">Please enter a task.</div>'; return; }
      const data = await callAPI(`${API_BASE}/suggest`, { action:'bestTime', text });
      render(data);
    };
    document.getElementById('btnSummarize').onclick = async ()=>{
      const data = await callAPI(`${API_BASE}/analyze`, { action:'summarize', tasks });
      render(data);
    };
    document.getElementById('btnWeekly').onclick = async ()=>{
      const data = await callAPI(`${API_BASE}/analyze`, { action:'weeklyInsights', tasks });
      render(data);
    };
  }

  return { openTools, bootstrap };
})();

