// Lightweight optional AI hooks used by the new certificate studio.
// They call backend endpoints if available, otherwise fall back
// to deterministic stubbed content so the UI always works.

export async function aiSuggestWording(payload) {
  try {
    const resp = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    if (!resp.ok) throw new Error('offline');
    return await resp.json();
  } catch (e) {
    return {
      title: 'Certificate of Excellence',
      subtitle: 'This certifies that',
      description: 'In recognition of outstanding achievement and dedication.'
    };
  }
}

export async function aiAutoFillCertificate(state) {
  try {
    const resp = await fetch('/api/ai/autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
    if (!resp.ok) throw new Error('offline');
    return await resp.json();
  } catch (e) {
    return {
      recipient: 'Recipient Name',
      date: new Date().toLocaleDateString(),
      signatureLabel: 'Authorized Signatory'
    };
  }
}

export async function aiDesignEnhancer(state) {
  try {
    const resp = await fetch('/api/ai/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
    if (!resp.ok) throw new Error('offline');
    return await resp.json();
  } catch (e) {
    return {
      suggestions: [
        'Use a bold, elegant font for the recipient name.',
        'Keep margins generous so the border can breathe.',
        'Align title, recipient, and subtitle centrally for balance.'
      ]
    };
  }
}
