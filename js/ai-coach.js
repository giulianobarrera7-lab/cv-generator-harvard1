const coachTips = {
    summary: [
        {
            title: "Resumen impactante",
            tips: [
                "Empieza con un logro cuantificable",
                "Usa palabras clave de tu industria",
                "Mantén 2-3 líneas máximo",
                "Incluye valor único que aportas"
            ],
            examples: [
                "❌ Ingeniero con experiencia en software",
                "✅ Ingeniero Full Stack con 5+ años. Lideré equipo de 8 devs en proyecto que aumentó conversión 40%"
            ]
        }
    ],
    experience: [
        {
            title: "Experiencia ATS-Friendly",
            tips: [
                "Usa verbos de acción fuertes (Lideré, Desarrollé, Optimicé)",
                "Incluye números y porcentajes",
                "Evita jerga o acrónimos desconocidos",
                "Ordena por relevancia, no cronología"
            ],
            examples: [
                "❌ Trabajé en proyectos y ayudé al equipo",
                "✅ Desarrollé 3 módulos que redujeron tiempo de carga en 35% | Lideré equipo de QA (5 personas)"
            ]
        }
    ],
    skills: [
        {
            title: "Habilidades optimizadas para ATS",
            tips: [
                "Usa nombres estándar (no abreviaciones)",
                "Agrupa por categoría (Técnicas, Idiomas, Soft Skills)",
                "Incluye herramientas específicas de tu industria",
                "Ordena por relevancia para el puesto"
            ],
            examples: [
                "TÉCNICAS: Python, JavaScript, React, SQL, AWS",
                "IDIOMAS: Español (Nativo), Inglés (Fluido)",
                "SOFT SKILLS: Liderazgo, Comunicación, Resolución de Problemas"
            ]
        }
    ]
};

function getCoachTip(section) {
    const tips = coachTips[section];
    if (!tips || tips.length === 0) return;

    const tip = tips[0];
    const coachPanel = document.getElementById('coachPanel');
    
    let html = `<div class="coach-tip">
        <h4>💡 ${tip.title}</h4>
        <ul>`;
    
    tip.tips.forEach(t => {
        html += `<li>${t}</li>`;
    });
    
    html += `</ul>`;
    
    if (tip.examples) {
        html += `<div class="example"><strong>Ejemplos:</strong><br>`;
        tip.examples.forEach(ex => {
            html += `${ex}<br>`;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    coachPanel.innerHTML = html;
}
