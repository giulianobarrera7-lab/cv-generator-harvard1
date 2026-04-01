/* ============================================
   app.js — Lógica principal del CV Builder
   ============================================ */

let currentPlantilla = 'harvard';
let photoDataURL = null;

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFormEvents();
  initImportEvents();
  initExportEvents();
  initAdaptarTab();
  initPlantillas();
  initTheme();
  updatePreview();
  updateATSScore();

  // Autoguardar cada 30s
  setInterval(() => {
    if (document.getElementById('nombre')?.value) saveDraft();
  }, 30000);
});

/* ---- TABS ---- */
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
}

function activateTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${tabId}`));
  if (tabId === 'preview') updatePreview();
  if (tabId === 'coach') updateATSScore();
}

/* ---- TEMA ---- */
function initTheme() {
  const saved = localStorage.getItem('cvbuilder_theme') || 'light';
  document.documentElement.dataset.theme = saved;
  updateThemeIcon(saved);

  document.getElementById('btnToggleTheme')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('cvbuilder_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('btnToggleTheme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ---- PLANTILLAS ---- */
function initPlantillas() {
  document.querySelectorAll('.plantilla-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.plantilla-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlantilla = btn.dataset.plantilla;
      const sel = document.getElementById('plantillaSelect');
      if (sel) sel.value = currentPlantilla;
      updatePreview();
    });
  });

  document.getElementById('plantillaSelect')?.addEventListener('change', e => {
    currentPlantilla = e.target.value;
    document.querySelectorAll('.plantilla-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.plantilla === currentPlantilla));
    updatePreview();
  });
}

/* ---- FORM EVENTS ---- */
function initFormEvents() {
  // Live update en inputs
  document.addEventListener('input', e => {
    if (e.target.closest('#tab-editor')) {
      debounce(updatePreview, 400)();
      debounce(updateATSScore, 600)();
    }
  });

  // Contador palabras resumen
  document.getElementById('resumen')?.addEventListener('input', function() {
    const words = this.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById('resumenCount').textContent = words;
  });

  // Foto de perfil
  document.getElementById('fotoInput')?.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      photoDataURL = e.target.result;
      const img = document.getElementById('photoPreview');
      const placeholder = document.getElementById('photoPlaceholder');
      img.src = photoDataURL;
      img.style.display = 'block';
      placeholder.style.display = 'none';
      document.getElementById('btnRemovePhoto').classList.remove('hidden');
      updatePreview();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnRemovePhoto')?.addEventListener('click', () => {
    photoDataURL = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPlaceholder').style.display = 'block';
    document.getElementById('btnRemovePhoto').classList.add('hidden');
    document.getElementById('fotoInput').value = '';
    updatePreview();
  });

  // Botones agregar ítems dinámicos
  document.getElementById('btnAddExperiencia')?.addEventListener('click', () => addDynamicItem('experiencia'));
  document.getElementById('btnAddEducacion')?.addEventListener('click', () => addDynamicItem('educacion'));
  document.getElementById('btnAddIdioma')?.addEventListener('click', () => addDynamicItem('idioma'));
  document.getElementById('btnAddCertificacion')?.addEventListener('click', () => addDynamicItem('certificacion'));

  // Habilidades (tags)
  document.getElementById('btnAddHabilidad')?.addEventListener('click', addHabilidadFromInput);
  document.getElementById('habilidadInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addHabilidadFromInput(); }
  });
}

/* ---- DYNAMIC ITEMS ---- */
function addDynamicItem(type) {
  const tpl = document.getElementById(`tpl-${type}`);
  const list = document.getElementById(`${type}List`);
  if (!tpl || !list) return null;

  const clone = tpl.content.cloneNode(true);
  const item = clone.querySelector('.dynamic-item');

  // Botón remover
  item.querySelector('.btn-remove')?.addEventListener('click', () => {
    item.remove();
    updatePreview();
    updateATSScore();
  });

  // Update en cambio
  item.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => {
      debounce(updatePreview, 400)();
      debounce(updateATSScore, 600)();
    });
  });

  list.appendChild(item);
  return item;
}

/* ---- TAGS / HABILIDADES ---- */
function addHabilidadFromInput() {
  const input = document.getElementById('habilidadInput');
  if (!input) return;
  const vals = input.value.split(',').map(v => v.trim()).filter(Boolean);
  vals.forEach(v => addTag(v));
  input.value = '';
  updatePreview();
  updateATSScore();
}

function addTag(text) {
  const container = document.getElementById('habilidadesList');
  if (!container) return;
  // No duplicar
  const existing = [...container.querySelectorAll('.tag span')].map(s => s.textContent.toLowerCase());
  if (existing.includes(text.toLowerCase())) return;

  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.innerHTML = `<span>${text}</span><button title="Quitar">×</button>`;
  tag.querySelector('button').addEventListener('click', () => {
    tag.remove(); updatePreview(); updateATSScore();
  });
  container.appendChild(tag);
}

/* ---- IMPORT EVENTS ---- */
function initImportEvents() {
  // MI CV EN PDF (genérico)
  document.getElementById('importCVPDF')?.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    showStatus('Leyendo tu CV en PDF...');
    try {
      const text = await extractTextFromPDF(file);
      const data = parseGenericCV(text);
      populateForm(data);
      if (data.sinClasificar?.length > 0) {
        showToast(`✅ CV importado. ${data.sinClasificar.length} bloques sin clasificar — revisá los campos.`);
      } else {
        showToast('✅ CV importado correctamente');
      }
    } catch(e) {
      showToast('❌ Error al leer el PDF: ' + e.message);
    }
    this.value = '';
  });

  // LINKEDIN PDF
  document.getElementById('importLinkedIn')?.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    showStatus('Importando desde LinkedIn...');
    try {
      const text = await extractTextFromPDF(file);
      const data = parseLinkedInCV(text);
      populateForm(data);
      showToast('✅ Datos de LinkedIn importados');
    } catch(e) {
      showToast('❌ Error al importar LinkedIn: ' + e.message);
    }
    this.value = '';
  });

  // OCR IMAGEN DATOS PERSONALES
  document.getElementById('importImageOCR')?.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    showStatus('Procesando imagen con OCR (puede tardar 20-40 seg)...');
    try {
      const text = await extractTextFromImage(file, pct => {
        showStatus(`OCR en progreso: ${pct}%`);
      });
      const data = parseGenericCV(text);
      populateForm(data);
      showToast('✅ Texto extraído de imagen e importado');
    } catch(e) {
      showToast('❌ Error de OCR: ' + e.message);
    }
    hideStatus();
    this.value = '';
  });

  // JSON
  document.getElementById('btnLoadDraft')?.addEventListener('click', loadDraft);
  document.getElementById('btnExportJSON')?.addEventListener('click', exportJSON);
  document.getElementById('importJSON')?.addEventListener('change', function() {
    if (this.files[0]) importJSON(this.files[0]);
    this.value = '';
  });
}

/* ---- EXPORT EVENTS ---- */
function initExportEvents() {
  ['btnExportPDF', 'btnExportPDF2', 'btnExportPDF3'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', exportToPDF);
  });
  ['btnExportDOCX', 'btnExportDOCX2'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', exportToDOCX);
  });
  document.getElementById('btnSaveDraft')?.addEventListener('click', saveDraft);
}

/* ---- TAB ADAPTAR ---- */
function initAdaptarTab() {
  // Sub-tabs imagen/texto
  document.querySelectorAll('.adaptar-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.adaptar-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.adaptar-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`at-${btn.dataset.at}`)?.classList.add('active');
    });
  });

  // Upload imagen de oferta
  document.getElementById('ofertaImageInput')?.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('ofertaImagePreview');
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  // Drag & drop zona
  const zona = document.getElementById('ofertaImageUpload');
  if (zona) {
    zona.addEventListener('dragover', e => { e.preventDefault(); zona.style.borderColor = 'var(--accent)'; });
    zona.addEventListener('dragleave', () => { zona.style.borderColor = ''; });
    zona.addEventListener('drop', e => {
      e.preventDefault(); zona.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const input = document.getElementById('ofertaImageInput');
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  }

  // Analizar imagen de oferta
  document.getElementById('btnAnalyzarOferta')?.addEventListener('click', async () => {
    const input = document.getElementById('ofertaImageInput');
    if (!input.files[0]) { showToast('⚠️ Primero subí una imagen'); return; }
    showStatus('Extrayendo texto de la imagen...');
    try {
      const text = await extractTextFromImage(input.files[0], pct => showStatus(`OCR: ${pct}%`));
      document.getElementById('ofertaExtractedContent').textContent = text;
      document.getElementById('ofertaExtractedText').classList.remove('hidden');
      hideStatus();
      analyzeAndShowResults(text);
    } catch(e) {
      hideStatus();
      showToast('❌ Error de OCR: ' + e.message);
    }
  });

  // Analizar texto pegado de oferta
  document.getElementById('btnAnalyzarTexto')?.addEventListener('click', () => {
    const text = document.getElementById('ofertaTexto')?.value;
    if (!text || text.trim().length < 20) { showToast('⚠️ Pegá el texto de la oferta primero'); return; }
    analyzeAndShowResults(text);
  });

  // Aplicar todas las sugerencias
  document.getElementById('btnAplicarTodo')?.addEventListener('click', () => {
    document.querySelectorAll('.btn-sugerencia-apply:not(.applied)').forEach(btn => btn.click());
  });
}

function analyzeAndShowResults(text) {
  const jobKeywords = analyzeJobOffer(text);
  const cvData = getCVData();
  const matchResult = calculateMatch(cvData, jobKeywords);
  const suggestions = generateSuggestions(cvData, jobKeywords, matchResult);

  // Mostrar match %
  const matchHeader = document.getElementById('matchHeader');
  document.getElementById('matchPercent').textContent = matchResult.percent;
  matchHeader?.classList.remove('hidden');
  document.getElementById('adaptarEmpty')?.classList.add('hidden');

  // Keywords
  const kwContainer = document.getElementById('matchKeywords');
  const kwList = document.getElementById('keywordsList');
  kwContainer?.classList.remove('hidden');
  if (kwList) {
    const allKw = [...(jobKeywords.habilidades || []), ...(jobKeywords.competencias || [])];
    kwList.innerHTML = allKw.map(kw => {
      const found = matchResult.found.includes(kw);
      return `<span class="keyword-match ${found ? 'found' : 'missing'}">${found ? '✅' : '❌'} ${kw}</span>`;
    }).join('');
  }

  // Sugerencias
  const sugContainer = document.getElementById('matchSugerencias');
  const sugList = document.getElementById('sugerenciasList');
  sugContainer?.classList.remove('hidden');
  if (sugList) {
    sugList.innerHTML = suggestions.map((s, i) => `
      <div class="sugerencia-item" id="sug-${i}">
        <div class="sugerencia-header">
          <span class="sugerencia-tipo">📌 ${s.tipo}</span>
          ${s.campo ? `<button class="btn-sugerencia-apply" data-index="${i}">✅ Aplicar</button>` : ''}
        </div>
        <p class="sugerencia-text">${s.texto}</p>
      </div>
    `).join('');

    // Eventos aplicar sugerencia
    sugList.querySelectorAll('.btn-sugerencia-apply').forEach(btn => {
      btn.addEventListener('click', function() {
        const sug = suggestions[parseInt(this.dataset.index)];
        applySuggestion(sug);
        this.textContent = '✓ Aplicada';
        this.classList.add('applied');
      });
    });
  }
}

function applySuggestion(sug) {
  if (sug.campo === 'resumen' && sug.valor) {
    const el = document.getElementById('resumen');
    if (el) { el.value = sug.valor; el.dispatchEvent(new Event('input')); }
  } else if (sug.campo === 'habilidades' && Array.isArray(sug.valor)) {
    sug.valor.forEach(h => addTag(h));
    updatePreview(); updateATSScore();
  }
  showToast('✅ Sugerencia aplicada al CV');
}

/* ---- VISTA PREVIA ---- */
function updatePreview() {
  const preview = document.getElementById('cvPreview');
  if (!preview) return;
  const data = getCVData();

  // Sin datos mínimos
  if (!data.nombre && !data.resumen && data.experiencia.length === 0) {
    preview.innerHTML = '<div class="preview-empty"><p>✏️ Completá el formulario para ver la vista previa de tu CV</p></div>';
    preview.className = `cv-preview ${currentPlantilla}-template`;
    return;
  }

  preview.className = `cv-preview ${currentPlantilla}-template`;

  const generators = {
    harvard: generateHarvard,
    moderna: generateModerna,
    ejecutiva: generateEjecutiva,
    creativa: generateCreativa,
    tecnica: generateTecnica,
  };

  const gen = generators[currentPlantilla] || generateHarvard;
  preview.innerHTML = gen(data);
}

/* ---- GENERADORES DE PLANTILLAS ---- */

function cvContact(data) {
  return [data.email, data.telefono, data.linkedin, data.ubicacion].filter(Boolean).join('  |  ');
}

function generateHarvard(data) {
  let html = `
    <div class="cv-name">${esc(data.nombre || 'Tu Nombre')}</div>
    <div class="cv-contact">${esc(cvContact(data))}</div>
  `;
  if (data.resumen) html += `<div class="cv-section-title">Perfil Profesional</div><p class="cv-item-desc">${esc(data.resumen)}</p>`;
  if (data.experiencia.length) {
    html += '<div class="cv-section-title">Experiencia Profesional</div>';
    data.experiencia.forEach(e => {
      html += `<p class="cv-item-title">${esc(e.cargo)} — ${esc(e.empresa)}</p>`;
      html += `<p class="cv-item-sub">${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
      if (e.descripcion) html += `<p class="cv-item-desc">${esc(e.descripcion)}</p>`;
    });
  }
  if (data.educacion.length) {
    html += '<div class="cv-section-title">Formación Académica</div>';
    data.educacion.forEach(e => {
      html += `<p class="cv-item-title">${esc(e.titulo)} — ${esc(e.institucion)}</p>`;
      html += `<p class="cv-item-sub">${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
    });
  }
  if (data.certificaciones.length) {
    html += '<div class="cv-section-title">Certificaciones</div>';
    data.certificaciones.forEach(c => { html += `<p class="cv-item-desc">• ${esc(c.nombre)}${c.institucion ? ' — ' + esc(c.institucion) : ''}</p>`; });
  }
  if (data.habilidades.length) {
    html += '<div class="cv-section-title">Habilidades Técnicas</div>';
    html += `<div class="cv-skills-list">${data.habilidades.map(h => `<span class="cv-skill-tag">${esc(h)}</span>`).join('')}</div>`;
  }
  if (data.idiomas.length) {
    html += '<div class="cv-section-title">Idiomas</div>';
    data.idiomas.forEach(i => { html += `<p class="cv-item-desc">• ${esc(i.idioma)}: ${esc(i.nivel)}</p>`; });
  }
  return html;
}

function generateModerna(data) {
  let html = `
    <div class="cv-header-bar">
      <div class="cv-name">${esc(data.nombre || 'Tu Nombre')}</div>
      <div style="color:#aaa;margin-top:6px;font-size:0.9rem">${esc(cvContact(data))}</div>
    </div>
    <div class="cv-body">
  `;
  if (data.resumen) html += `<div class="cv-section-title">Perfil</div><p style="color:#444;font-size:0.88rem;line-height:1.5">${esc(data.resumen)}</p>`;
  if (data.experiencia.length) {
    html += '<div class="cv-section-title">Experiencia</div>';
    data.experiencia.forEach(e => {
      html += `<p class="cv-item-title">${esc(e.cargo)} — ${esc(e.empresa)}</p>`;
      html += `<p class="cv-item-sub">${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
      if (e.descripcion) html += `<p style="font-size:0.84rem;color:#555;margin-bottom:10px">${esc(e.descripcion)}</p>`;
    });
  }
  if (data.educacion.length) {
    html += '<div class="cv-section-title">Educación</div>';
    data.educacion.forEach(e => {
      html += `<p class="cv-item-title">${esc(e.titulo)} — ${esc(e.institucion)}</p>`;
      html += `<p class="cv-item-sub">${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
    });
  }
  if (data.habilidades.length) {
    html += '<div class="cv-section-title">Skills</div>';
    html += `<p style="font-size:0.84rem;color:#444">${data.habilidades.map(h => esc(h)).join(' · ')}</p>`;
  }
  html += '</div>';
  return html;
}

function generateEjecutiva(data) {
  let html = `
    <div class="cv-name">${esc(data.nombre || 'Tu Nombre')}</div>
    <div class="cv-contact">${esc(cvContact(data))}</div>
  `;
  if (data.resumen) html += `<div class="cv-section-title">Perfil Ejecutivo</div><p style="font-size:0.88rem;color:#444;line-height:1.6">${esc(data.resumen)}</p>`;
  if (data.experiencia.length) {
    html += '<div class="cv-section-title">Experiencia Profesional</div>';
    data.experiencia.forEach(e => {
      html += `<p style="font-weight:700;font-size:0.92rem">${esc(e.cargo)}</p>`;
      html += `<p style="color:#8B7355;font-size:0.85rem;margin-bottom:3px">${esc(e.empresa)} | ${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
      if (e.descripcion) html += `<p style="font-size:0.85rem;color:#444;margin-bottom:12px">${esc(e.descripcion)}</p>`;
    });
  }
  if (data.educacion.length) {
    html += '<div class="cv-section-title">Formación</div>';
    data.educacion.forEach(e => {
      html += `<p style="font-weight:700;font-size:0.88rem">${esc(e.titulo)}</p>`;
      html += `<p style="color:#666;font-size:0.82rem;margin-bottom:8px">${esc(e.institucion)} | ${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
    });
  }
  if (data.habilidades.length) {
    html += '<div class="cv-section-title">Competencias</div>';
    html += `<p style="font-size:0.84rem;color:#444">${data.habilidades.map(h => esc(h)).join(' · ')}</p>`;
  }
  if (data.certificaciones.length) {
    html += '<div class="cv-section-title">Certificaciones</div>';
    data.certificaciones.forEach(c => { html += `<p style="font-size:0.84rem;color:#444">• ${esc(c.nombre)}${c.institucion ? ' — ' + esc(c.institucion) : ''}</p>`; });
  }
  return html;
}

function generateCreativa(data) {
  const photoHTML = photoDataURL
    ? `<img class="cv-photo" src="${photoDataURL}" alt="Foto" />`
    : `<div class="cv-photo-placeholder">👤</div>`;

  let html = `
    <div class="cv-header-bar">
      ${photoHTML}
      <div>
        <div style="font-size:1.8rem;font-weight:700">${esc(data.nombre || 'Tu Nombre')}</div>
        <div style="color:rgba(255,255,255,0.7);margin-top:6px;font-size:0.85rem">${esc(cvContact(data))}</div>
      </div>
    </div>
    <div class="cv-body">
  `;
  if (data.resumen) html += `<div class="cv-section-title">Perfil</div><p style="font-size:0.88rem;color:#444;line-height:1.5">${esc(data.resumen)}</p>`;
  if (data.experiencia.length) {
    html += '<div class="cv-section-title">Experiencia</div>';
    data.experiencia.forEach(e => {
      html += `<p style="font-weight:700;font-size:0.9rem">${esc(e.cargo)} — ${esc(e.empresa)}</p>`;
      html += `<p style="color:#888;font-size:0.82rem;margin-bottom:4px">${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
      if (e.descripcion) html += `<p style="font-size:0.84rem;color:#555;margin-bottom:10px">${esc(e.descripcion)}</p>`;
    });
  }
  if (data.educacion.length) {
    html += '<div class="cv-section-title">Educación</div>';
    data.educacion.forEach(e => {
      html += `<p style="font-weight:700;font-size:0.88rem">${esc(e.titulo)} — ${esc(e.institucion)}</p>`;
      html += `<p style="color:#888;font-size:0.82rem;margin-bottom:8px">${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
    });
  }
  if (data.habilidades.length) {
    html += '<div class="cv-section-title">Habilidades</div>';
    html += `<div style="display:flex;flex-wrap:wrap;gap:6px">${data.habilidades.map(h => `<span style="background:#dce8f8;color:#1a4f8a;padding:4px 10px;border-radius:20px;font-size:0.8rem">${esc(h)}</span>`).join('')}</div>`;
  }
  if (data.idiomas.length) {
    html += '<div class="cv-section-title">Idiomas</div>';
    data.idiomas.forEach(i => { html += `<p style="font-size:0.84rem;color:#555">• ${esc(i.idioma)}: ${esc(i.nivel)}</p>`; });
  }
  html += '</div>';
  return html;
}

function generateTecnica(data) {
  let html = `
    <div style="border-bottom:2px solid #30363d;padding-bottom:16px;margin-bottom:20px">
      <div class="cv-name">${esc(data.nombre || 'Tu Nombre')}</div>
      <div class="cv-title"># ${esc(data.ubicacion || 'Desarrollador')}</div>
      <div style="font-size:0.78rem;color:#8b949e">${esc(cvContact(data))}</div>
    </div>
  `;
  if (data.resumen) html += `<div class="cv-section-title">// about</div><p style="font-size:0.84rem;color:#c9d1d9;line-height:1.6;margin-bottom:16px">${esc(data.resumen)}</p>`;
  if (data.habilidades.length) {
    html += '<div class="cv-section-title">// tech_stack</div>';
    html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">${data.habilidades.map(h => `<span class="cv-skill-tag">${esc(h)}</span>`).join('')}</div>`;
  }
  if (data.experiencia.length) {
    html += '<div class="cv-section-title">// experience</div>';
    data.experiencia.forEach(e => {
      html += `<p class="cv-item-title">${esc(e.cargo)} @ ${esc(e.empresa)}</p>`;
      html += `<p class="cv-item-sub">${esc(e.fechaInicio)}${e.fechaFin ? ' → ' + esc(e.fechaFin) : ''}</p>`;
      if (e.descripcion) html += `<p class="cv-item-desc" style="margin-bottom:12px">${esc(e.descripcion)}</p>`;
    });
  }
  if (data.educacion.length) {
    html += '<div class="cv-section-title">// education</div>';
    data.educacion.forEach(e => {
      html += `<p class="cv-item-title">${esc(e.titulo)}</p>`;
      html += `<p class="cv-item-sub">${esc(e.institucion)} | ${esc(e.fechaInicio)}${e.fechaFin ? ' – ' + esc(e.fechaFin) : ''}</p>`;
    });
  }
  if (data.certificaciones.length) {
    html += '<div class="cv-section-title">// certifications</div>';
    data.certificaciones.forEach(c => { html += `<p class="cv-item-desc">→ ${esc(c.nombre)}${c.institucion ? ' · ' + esc(c.institucion) : ''}</p>`; });
  }
  return html;
}

/* ---- UTILS ---- */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const debounceTimers = {};
function debounce(fn, delay) {
  return function(...args) {
    clearTimeout(debounceTimers[fn]);
    debounceTimers[fn] = setTimeout(() => fn.apply(this, args), delay);
  };
}
