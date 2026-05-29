import { jsPDF } from 'jspdf';
import { formatDate } from './dates';

const SURVEY_LABELS_INITIAL = {
  frontType: 'Tipo de frente',
  buildingUnits: 'Cantidad de departamentos',
  hasSidewalkContainer: 'Contenedor en vereda',
  spokeWith: 'Habló con',
  contactInfo: 'Contacto del vecino',
  trashSchedule: 'Horario de basura',
  noEveningReason: 'Motivo de no sacar 19-21',
  bagsCount: 'Cantidad de bolsas',
  voluminousDisposal: 'Descarte de voluminosos',
  separatesWaste: 'Separa residuos',
  recyclingPlace: 'Dispone reciclables en',
  blockHygiene: 'Higiene de la cuadra',
  scatteredTrash: 'Residuos diseminados',
  hasBadBehavior: 'Conductas a corregir',
  badBehaviorDescription: 'Descripción conducta',
};

const SURVEY_LABELS_FOLLOWUP = {
  spokeWith: 'Habló con',
  hygieneTrend: 'Higiene vs. visita anterior',
  hygieneTrendOther: 'Detalle',
  scatteredAroundContainer: 'Residuos diseminados estos días',
  scatteredSchedule: 'Horario observado',
  bulkyOrRubble: 'Voluminosos / poda / escombros',
  flyerPosted: '¿Pegó el flyer?',
  flyerFeedback: 'Repercusión del flyer',
  behaviorsToCorrect: 'Conductas a corregir',
  containerState: 'Estado del contenedor',
  containerStateOther: 'Detalle contenedor',
  hasIncidents: '¿Detectó incidencias?',
  incidentsDescription: 'Incidencias',
  observations: 'Observaciones',
};

const SURVEY_VALUE_LABELS = {
  si: 'Sí',
  no: 'No',
  a_veces: 'A veces',
  vecino: 'Vecino/a',
  encargado: 'Encargado',
  comerciante: 'Comerciante',
  no_atendio: 'No atendió',
  no_quiere: 'No quiere ser contactado',
  '10-15': '10 a 15 h',
  '15-19': '15 a 19 h',
  '19-21': '19 a 21 h',
  '21-10': '21 a 10 h',
  boti: 'BOTI',
  147: '147',
  contenedor: 'Junto al contenedor',
  otro: 'Otro',
  verde: 'Contenedor verde',
  punto_verde: 'Punto verde',
  recuperador: 'Recuperador urbano',
  cestos: 'Cestos del edificio',
  no_separa: 'No separa',
  muy_buena: 'Muy buena',
  buena: 'Buena',
  regular: 'Regular',
  mala: 'Mala',
  muy_mala: 'Muy mala',
  todos_los_dias: 'Todos los días',
  nunca: 'Nunca',
  mejoro: 'Mejoró',
  igual: 'Igual',
  empeoro: 'Empeoró',
  limpio: 'Limpio y en orden',
  residuos_alrededor: 'Con residuos alrededor',
  desbordado: 'Desbordado',
  desperfectos: 'Con desperfectos',
  no_aplica: 'No aplica',
};

const COLORS = {
  primary: [21, 50, 68],
  accent: [0, 122, 167],
  text: [33, 41, 51],
  muted: [115, 125, 137],
  border: [217, 222, 228],
  yellow: [255, 224, 125],
};

function valueLabel(val) {
  if (val === true || val === 'true') return 'Sí';
  if (val === false || val === 'false') return 'No';
  if (val === null || val === undefined || val === '') return '—';
  if (Array.isArray(val)) return val.map((v) => SURVEY_VALUE_LABELS[v] || v).join(', ');
  return SURVEY_VALUE_LABELS[val] || String(val);
}

class PdfBuilder {
  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 40;
    this.cursorY = this.margin;
    this.maxLineWidth = this.pageWidth - this.margin * 2;
  }

  ensureSpace(needed = 24) {
    if (this.cursorY + needed > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.cursorY = this.margin;
    }
  }

  setFont(weight = 'normal', size = 10, color = COLORS.text) {
    this.doc.setFont('helvetica', weight);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  header(title, subtitle) {
    this.doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.text(title, this.margin, 36);

    if (subtitle) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      this.doc.text(subtitle, this.margin, 56);
    }

    this.doc.setFontSize(9);
    this.doc.text(
      `Generado: ${new Date().toLocaleString('es-AR')}`,
      this.pageWidth - this.margin,
      36,
      { align: 'right' }
    );
    this.doc.text('Territorio App · GCBA', this.pageWidth - this.margin, 56, {
      align: 'right',
    });

    this.cursorY = 110;
  }

  sectionTitle(title) {
    this.ensureSpace(36);
    this.cursorY += 6;
    this.doc.setFillColor(243, 246, 249);
    this.doc.roundedRect(this.margin, this.cursorY - 14, this.maxLineWidth, 22, 3, 3, 'F');
    this.setFont('bold', 11, COLORS.primary);
    this.doc.text(title, this.margin + 10, this.cursorY);
    this.cursorY += 18;
  }

  divider() {
    this.ensureSpace(10);
    this.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    this.doc.line(this.margin, this.cursorY, this.pageWidth - this.margin, this.cursorY);
    this.cursorY += 10;
  }

  keyValue(label, value) {
    if (value === null || value === undefined || value === '') return;
    const labelStr = label;
    const valueStr = typeof value === 'string' ? value : String(value);
    this.setFont('normal', 9.5, COLORS.muted);
    this.doc.text(labelStr, this.margin, this.cursorY);

    this.setFont('bold', 10, COLORS.text);
    const lines = this.doc.splitTextToSize(valueStr, this.maxLineWidth - 160);
    this.doc.text(lines, this.margin + 160, this.cursorY);

    const blockHeight = Math.max(14, lines.length * 12);
    this.cursorY += blockHeight;
    this.ensureSpace(blockHeight);
  }

  paragraph(text, color = COLORS.text) {
    if (!text) return;
    this.setFont('normal', 10, color);
    const lines = this.doc.splitTextToSize(text, this.maxLineWidth);
    this.ensureSpace(lines.length * 12 + 4);
    this.doc.text(lines, this.margin, this.cursorY);
    this.cursorY += lines.length * 12 + 4;
  }

  badge(text, bg = COLORS.yellow, fg = [90, 58, 0]) {
    this.ensureSpace(22);
    const w = this.doc.getTextWidth(text) + 18;
    this.doc.setFillColor(bg[0], bg[1], bg[2]);
    this.doc.roundedRect(this.margin, this.cursorY - 11, w, 18, 9, 9, 'F');
    this.setFont('bold', 9.5, fg);
    this.doc.text(text, this.margin + 9, this.cursorY);
    this.cursorY += 18;
  }

  addImage(dataUrl, maxWidth = 220, maxHeight = 180) {
    if (!dataUrl) return;
    try {
      this.ensureSpace(maxHeight + 8);
      const format = dataUrl.includes('data:image/png') ? 'PNG' : 'JPEG';
      this.doc.addImage(dataUrl, format, this.margin, this.cursorY, maxWidth, maxHeight, undefined, 'FAST');
      this.cursorY += maxHeight + 8;
    } catch (err) {
      console.warn('No se pudo agregar la imagen al PDF', err);
    }
  }

  addImagesGrid(photos, perRow = 2) {
    if (!photos?.length) return;
    const gap = 10;
    const cellW = (this.maxLineWidth - gap * (perRow - 1)) / perRow;
    const cellH = cellW * 0.75;

    let col = 0;
    let rowY = this.cursorY;
    this.ensureSpace(cellH + 4);

    photos.forEach((src) => {
      if (col === 0 && rowY + cellH > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.cursorY = this.margin;
        rowY = this.cursorY;
      }
      try {
        const format = src.includes('data:image/png') ? 'PNG' : 'JPEG';
        const x = this.margin + col * (cellW + gap);
        this.doc.addImage(src, format, x, rowY, cellW, cellH, undefined, 'FAST');
      } catch (err) {
        console.warn('Error agregando foto', err);
      }
      col += 1;
      if (col >= perRow) {
        col = 0;
        rowY += cellH + gap;
        this.cursorY = rowY;
      }
    });

    if (col !== 0) {
      this.cursorY = rowY + cellH + gap;
    }
  }

  footer() {
    const total = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i += 1) {
      this.doc.setPage(i);
      this.setFont('normal', 8, COLORS.muted);
      this.doc.text(
        `Página ${i} de ${total}`,
        this.pageWidth / 2,
        this.pageHeight - 20,
        { align: 'center' }
      );
    }
  }

  save(filename) {
    this.footer();
    this.doc.save(filename);
  }
}

function renderVisitContent(builder, visit, { showHeader = false } = {}) {
  const h = visit.hygieneObservation;

  if (showHeader) {
    builder.sectionTitle(
      `Recorrido ${formatDate(visit.visitDate)}${
        visit.weekNumber ? ` · Semana ${visit.weekNumber}` : ''
      }`
    );
  }

  if (visit.weekNumber) {
    builder.badge(
      visit.weekNumber === 1
        ? 'Primer relevamiento'
        : `Relevamiento semana ${visit.weekNumber} de 5`
    );
  }

  builder.sectionTitle('Datos del recorrido');
  builder.keyValue('Manzana', visit.block?.code || '—');
  builder.keyValue(
    'Comuna',
    visit.block?.commune?.name || visit.block?.communeId || '—'
  );
  builder.keyValue('Fecha', formatDate(visit.visitDate));
  builder.keyValue(
    'Recorredor',
    visit.user ? `${visit.user.firstName} ${visit.user.lastName}` : '—'
  );
  builder.keyValue('Estado', visit.status || '—');
  builder.keyValue('Pudo recorrer', visit.couldVisit ? 'Sí' : 'No');
  if (!visit.couldVisit && visit.reasonNotVisited) {
    builder.keyValue('Motivo', visit.reasonNotVisited);
  }
  if (visit.street || visit.streetNumber) {
    builder.keyValue(
      'Domicilio',
      `${visit.street || ''} ${visit.streetNumber || ''}${
        visit.doorbell ? ` · Timbre ${visit.doorbell}` : ''
      }`.trim()
    );
  }
  if (visit.startTime || visit.endTime) {
    builder.keyValue('Horario', `${visit.startTime || '—'} a ${visit.endTime || '—'}`);
  }
  if (visit.latitude || visit.longitude) {
    builder.keyValue('Ubicación', `${visit.latitude || '—'}, ${visit.longitude || '—'}`);
  }
  if (visit.generalNotes) {
    builder.keyValue('Notas', visit.generalNotes);
  }

  if (visit.surveyData) {
    const isFollow = visit.surveyData.kind === 'seguimiento';
    builder.sectionTitle(
      isFollow
        ? `Relevamiento de seguimiento (semana ${visit.weekNumber || ''})`
        : 'Primer relevamiento'
    );

    const labels = isFollow ? SURVEY_LABELS_FOLLOWUP : SURVEY_LABELS_INITIAL;
    Object.entries(labels).forEach(([key, label]) => {
      const raw = visit.surveyData[key];
      if (raw === undefined || raw === null || raw === '') return;
      builder.keyValue(label, valueLabel(raw));
    });
  }

  if (h) {
    builder.sectionTitle('Observaciones de higiene');
    builder.keyValue('Basura bien dispuesta', h.trashProperlyDisposed ? 'Sí' : 'No');
    builder.keyValue('Basura fuera de horario', h.trashOutOfSchedule ? 'Sí' : 'No');
    builder.keyValue('Voluminosos', h.bulkyWaste ? 'Sí' : 'No');
    builder.keyValue('Escombros', h.rubble ? 'Sí' : 'No');
    builder.keyValue(
      'Contenedores desbordados',
      h.overflowingContainers ? 'Sí' : 'No'
    );
    builder.keyValue('Punto crítico', h.criticalPoint ? 'Sí' : 'No');
    if (h.criticalPointDescription) {
      builder.keyValue('Descripción punto crítico', h.criticalPointDescription);
    }
    if (h.notes) builder.keyValue('Notas', h.notes);

    if (h.photos?.length) {
      builder.sectionTitle(`Fotos (${h.photos.length})`);
      builder.addImagesGrid(h.photos, 2);
    }
  }
}

export function exportVisitToPdf(visit) {
  const builder = new PdfBuilder();
  const blockCode = visit.block?.code || 'manzana';
  const dateStr = formatDate(visit.visitDate);
  builder.header(`Relevamiento · ${blockCode}`, `Recorrido del ${dateStr}`);
  renderVisitContent(builder, visit);
  const filename = `relevamiento-${blockCode}-${visit.visitDate || ''}.pdf`.replace(
    /\s+/g,
    '_'
  );
  builder.save(filename);
}

export function exportBlockToPdf({ block, visits = [], summary = {} }) {
  const builder = new PdfBuilder();
  builder.header(
    `Manzana ${block?.code || ''}`,
    `${block?.commune?.name || 'Comuna —'} · Informe completo`
  );

  builder.sectionTitle('Información de la manzana');
  builder.keyValue('Código', block?.code || '—');
  builder.keyValue('Comuna', block?.commune?.name || '—');
  if (block?.street) builder.keyValue('Calle principal', block.street);
  if (block?.boundaries) builder.keyValue('Límites', block.boundaries);
  builder.keyValue('Estado', block?.isActive === false ? 'Inactiva' : 'Activa');

  builder.sectionTitle('Resumen');
  builder.keyValue('Total de relevamientos', String(visits.length));
  if (summary.completedWeeks?.length) {
    builder.keyValue(
      'Semanas con relevamiento',
      summary.completedWeeks.sort().join(', ')
    );
  }
  if (summary.lastVisitDate) {
    builder.keyValue('Último recorrido', formatDate(summary.lastVisitDate));
  }
  if (summary.assignedTo) {
    builder.keyValue('Recorredor asignado', summary.assignedTo);
  }

  if (!visits.length) {
    builder.divider();
    builder.paragraph('Esta manzana aún no tiene relevamientos cargados.');
  } else {
    [...visits]
      .sort((a, b) => {
        const dateCmp = String(a.visitDate || '').localeCompare(String(b.visitDate || ''));
        if (dateCmp !== 0) return dateCmp;
        return (a.weekNumber || 0) - (b.weekNumber || 0);
      })
      .forEach((v, idx) => {
        if (idx > 0) {
          builder.doc.addPage();
          builder.cursorY = builder.margin;
        }
        renderVisitContent(builder, v, { showHeader: true });
      });
  }

  const filename = `manzana-${block?.code || 'sin-codigo'}.pdf`.replace(/\s+/g, '_');
  builder.save(filename);
}
